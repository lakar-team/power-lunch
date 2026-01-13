import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// Allowed fields for updates (whitelist)
const ALLOWED_UPDATE_FIELDS = [
    'name', 'location_area', 'location_lat', 'location_lng',
    'session_type', 'meet_link', 'venue_options',
    'price_yen', 'duration_minutes', 'is_active',
    'date_start', 'date_end'
]

// Manual validation helper
function validateLocationInput(body: any): { valid: boolean; error?: string; data?: any } {
    if (!body.name || typeof body.name !== 'string' || body.name.length < 1 || body.name.length > 100) {
        return { valid: false, error: 'Name is required (1-100 characters)' }
    }

    const sessionType = body.session_type || 'both'
    if (!['in_person', 'online', 'both'].includes(sessionType)) {
        return { valid: false, error: 'Invalid session_type' }
    }

    const priceYen = typeof body.price_yen === 'number' ? body.price_yen : 1500
    if (priceYen < 500 || priceYen > 100000) {
        return { valid: false, error: 'Price must be between ¥500 and ¥100,000' }
    }

    const durationMinutes = typeof body.duration_minutes === 'number' ? body.duration_minutes : 60
    if (durationMinutes < 15 || durationMinutes > 240) {
        return { valid: false, error: 'Duration must be between 15 and 240 minutes' }
    }

    return {
        valid: true,
        data: {
            name: body.name.trim(),
            location_area: body.location_area || null,
            location_lat: typeof body.location_lat === 'number' ? body.location_lat : null,
            location_lng: typeof body.location_lng === 'number' ? body.location_lng : null,
            session_type: sessionType,
            meet_link: body.meet_link || null,
            venue_options: Array.isArray(body.venue_options) ? body.venue_options : [],
            price_yen: priceYen,
            duration_minutes: durationMinutes,
            date_start: body.date_start || null,
            date_end: body.date_end || null,
        }
    }
}

// GET: Fetch all locations (public) or for specific host
export async function GET(request: NextRequest) {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const hostId = searchParams.get('host_id')

    // Viewport bounds for map-based filtering (reduces data transfer)
    const north = searchParams.get('north')
    const south = searchParams.get('south')
    const east = searchParams.get('east')
    const west = searchParams.get('west')

    if (!hostId) {
        // Return active locations for map view - optimized fields only
        let query = supabase
            .from('host_locations')
            .select(`
                id,
                host_id,
                name,
                location_area,
                location_lat,
                location_lng,
                session_type,
                price_yen,
                duration_minutes,
                host:hosts(
                    id,
                    topics,
                    rating_avg,
                    profile:profiles(full_name, avatar_url)
                )
            `)
            .eq('is_active', true)
            .or('date_end.is.null,date_end.gte.' + new Date().toISOString().split('T')[0])

        // Apply viewport bounds if provided (reduces data for large datasets)
        if (north && south && east && west) {
            query = query
                .gte('location_lat', parseFloat(south))
                .lte('location_lat', parseFloat(north))
                .gte('location_lng', parseFloat(west))
                .lte('location_lng', parseFloat(east))
        }

        // Limit results to prevent huge payloads
        query = query.limit(100)

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json(data)
    }

    // Return locations for specific host
    const { data, error } = await supabase
        .from('host_locations')
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
}

// POST: Create a new location pin (AUTHENTICATED)
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's host profile
        const supabase = createAdminClient()
        const { data: host, error: hostError } = await supabase
            .from('hosts')
            .select('id')
            .eq('user_id', user.id)
            .single()

        if (hostError || !host) {
            return NextResponse.json({ error: 'Host profile not found' }, { status: 403 })
        }

        // Parse and validate body
        const body = await request.json()
        const validation = validateLocationInput(body)

        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        // Insert with authenticated host_id (not from request body!)
        const { data, error } = await supabase
            .from('host_locations')
            .insert({
                host_id: host.id,
                ...validation.data,
                is_active: true
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PUT: Update a location pin (AUTHENTICATED + OWNERSHIP CHECK)
export async function PUT(request: NextRequest) {
    try {
        // Authenticate user
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'Location ID is required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Verify ownership: location belongs to user's host profile
        const { data: location, error: locationError } = await supabase
            .from('host_locations')
            .select('host_id, host:hosts(user_id)')
            .eq('id', id)
            .single()

        if (locationError || !location) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 })
        }

        // Check if the current user owns this location
        const hostUserId = (location.host as any)?.user_id
        if (hostUserId !== user.id) {
            return NextResponse.json({ error: 'Forbidden: You do not own this location' }, { status: 403 })
        }

        // Whitelist allowed update fields
        const safeUpdates = Object.fromEntries(
            Object.entries(updates).filter(([key]) => ALLOWED_UPDATE_FIELDS.includes(key))
        )

        if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('host_locations')
            .update(safeUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE: Delete a location pin (AUTHENTICATED + OWNERSHIP CHECK)
export async function DELETE(request: NextRequest) {
    try {
        // Authenticate user
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Location ID is required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Verify ownership
        const { data: location, error: locationError } = await supabase
            .from('host_locations')
            .select('host_id, host:hosts(user_id)')
            .eq('id', id)
            .single()

        if (locationError || !location) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 })
        }

        const hostUserId = (location.host as any)?.user_id
        if (hostUserId !== user.id) {
            return NextResponse.json({ error: 'Forbidden: You do not own this location' }, { status: 403 })
        }

        const { error } = await supabase
            .from('host_locations')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
