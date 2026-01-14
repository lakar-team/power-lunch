import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// GET: Fetch availability slots for a host_location
export async function GET(request: NextRequest) {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const hostLocationId = searchParams.get('host_location_id')

    if (!hostLocationId) {
        return NextResponse.json({ error: 'host_location_id is required' }, { status: 400 })
    }

    // Get slots
    const { data: slots, error: slotsError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('host_location_id', hostLocationId)
        .order('day_of_week', { ascending: true })

    if (slotsError) {
        return NextResponse.json({ error: slotsError.message }, { status: 500 })
    }

    // Get blocked dates
    const { data: blocked, error: blockedError } = await supabase
        .from('unavailable_dates')
        .select('date')
        .eq('host_location_id', hostLocationId)

    if (blockedError) {
        console.error('Failed to fetch blocked dates:', blockedError.message)
    }

    return NextResponse.json({
        slots: slots || [],
        blocked_dates: (blocked || []).map(b => b.date)
    })
}

// POST: Add or update availability slots
export async function POST(request: NextRequest) {
    try {
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { host_location_id, slots } = body

        if (!host_location_id || !Array.isArray(slots)) {
            return NextResponse.json({ error: 'host_location_id and slots array required' }, { status: 400 })
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

        // Delete existing slots for this location
        await supabase
            .from('availability_slots')
            .delete()
            .eq('host_location_id', host_location_id)

        // Insert new slots
        if (slots.length > 0) {
            const slotsToInsert = slots.map((slot: any) => ({
                host_location_id,
                day_of_week: slot.day_of_week ?? slot.day,
                start_time: slot.start_time || slot.startTime,
                end_time: slot.end_time || slot.endTime,
                valid_from: slot.valid_from || null,
                valid_until: slot.valid_until || null,
            }))

            const { error: insertError } = await supabase
                .from('availability_slots')
                .insert(slotsToInsert)

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
