import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// GET: Fetch blocked dates for a host_location
export async function GET(request: NextRequest) {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const hostLocationId = searchParams.get('host_location_id')

    if (!hostLocationId) {
        return NextResponse.json({ error: 'host_location_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('unavailable_dates')
        .select('id, date, reason')
        .eq('host_location_id', hostLocationId)
        .order('date', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
}

// POST: Toggle a blocked date (add if not exists, remove if exists)
export async function POST(request: NextRequest) {
    try {
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { host_location_id, date, reason } = body

        if (!host_location_id || !date) {
            return NextResponse.json({ error: 'host_location_id and date required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Verify ownership
        const { data: location, error: locationError } = await supabase
            .from('host_locations')
            .select('host_id, host:hosts(user_id)')
            .eq('id', host_location_id)
            .single()

        if (locationError || !location) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 })
        }

        const hostUserId = (location.host as any)?.user_id
        if (hostUserId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Check if date already blocked
        const { data: existing } = await supabase
            .from('unavailable_dates')
            .select('id')
            .eq('host_location_id', host_location_id)
            .eq('date', date)
            .single()

        if (existing) {
            // Remove block
            await supabase
                .from('unavailable_dates')
                .delete()
                .eq('id', existing.id)

            return NextResponse.json({ action: 'unblocked', date })
        } else {
            // Add block
            const { error: insertError } = await supabase
                .from('unavailable_dates')
                .insert({
                    host_location_id,
                    date,
                    reason: reason || null
                })

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 })
            }

            return NextResponse.json({ action: 'blocked', date })
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE: Remove a specific blocked date
export async function DELETE(request: NextRequest) {
    try {
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Get the blocked date to verify ownership
        const { data: blocked, error: blockedError } = await supabase
            .from('unavailable_dates')
            .select('host_location_id')
            .eq('id', id)
            .single()

        if (blockedError || !blocked) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        // Verify ownership via location
        const { data: location } = await supabase
            .from('host_locations')
            .select('host:hosts(user_id)')
            .eq('id', blocked.host_location_id)
            .single()

        const hostUserId = (location?.host as any)?.user_id
        if (hostUserId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await supabase
            .from('unavailable_dates')
            .delete()
            .eq('id', id)

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
