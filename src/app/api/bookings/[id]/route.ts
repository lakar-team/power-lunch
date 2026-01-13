import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings (
                *,
                host:hosts (
                    *,
                    profile:profiles (*)
                ),
                venue_options
            ),
            host:hosts (
                *,
                profile:profiles (*)
            )
        `)
        .eq('id', params.id)
        .single() // We removed generic <Booking> to avoid build errors

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify ownership (either guest or host)
    if (booking.guest_id !== user.id && booking.host_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ booking })
}
