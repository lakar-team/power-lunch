import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch all locations for a host
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const hostId = searchParams.get('host_id')

    if (!hostId) {
        // If no host_id, return all active locations for map view
        const { data, error } = await supabase
            .from('host_locations')
            .select(`
                *,
                host:hosts(
                    id,
                    bio,
                    topics,
                    rating_avg,
                    total_sessions,
                    profile:profiles(full_name, avatar_url)
                )
            `)
            .eq('is_active', true)
            .or('date_end.is.null,date_end.gte.' + new Date().toISOString().split('T')[0])

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

// POST: Create a new location pin
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { host_id, name, location_area, location_lat, location_lng, session_type, meet_link, venue_options, price_yen, duration_minutes, date_start, date_end } = body

        if (!host_id || !name) {
            return NextResponse.json({ error: 'host_id and name are required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('host_locations')
            .insert({
                host_id,
                name,
                location_area,
                location_lat,
                location_lng,
                session_type: session_type || 'both',
                meet_link,
                venue_options: venue_options || [],
                price_yen: price_yen || 1500,
                duration_minutes: duration_minutes || 60,
                date_start,
                date_end,
                is_active: true
            })
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

// PUT: Update a location pin
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('host_locations')
            .update(updates)
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

// DELETE: Delete a location pin
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
        .from('host_locations')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
}
