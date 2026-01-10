import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import crypto from 'crypto'

// POST /api/qr/verify - Verify a guest's QR code
export async function POST(request: NextRequest) {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // Parse the code format: PL-XXXXXXXX-JP
    const match = code.match(/^PL-([A-Z0-9]+)-JP$/i)
    if (!match) {
        return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    const qrHash = match[1].toUpperCase()

    // Get user's host profile
    const { data: host } = await supabase
        .from('hosts')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!host) {
        return NextResponse.json({ error: 'Host profile not found' }, { status: 404 })
    }

    const hostId = host.id as string

    // Find booking with this QR code for this host
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
      *,
      guest:profiles!bookings_guest_id_fkey (*),
      listing:listings (*)
    `)
        .eq('qr_code_hash', qrHash)
        .eq('host_id', hostId)
        .eq('status', 'confirmed')
        .single()

    if (bookingError || !booking) {
        return NextResponse.json({
            error: 'Booking not found or already used',
            valid: false
        }, { status: 404 })
    }

    // Check if booking is for today
    const today = new Date().toISOString().split('T')[0]
    if (booking.booking_date !== today) {
        return NextResponse.json({
            error: 'This booking is not for today',
            valid: false,
            booking_date: booking.booking_date,
        }, { status: 400 })
    }

    // Cast nested objects
    const bookingGuest = booking.guest as { full_name: string }
    const bookingListing = booking.listing as { title: string }

    return NextResponse.json({
        valid: true,
        booking: {
            id: booking.id,
            guest_name: bookingGuest.full_name,
            listing_title: bookingListing.title,
            start_time: booking.start_time,
            end_time: booking.end_time,
        },
    })
}

// PUT /api/qr/verify - Start the session after QR verification
export async function PUT(request: NextRequest) {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { booking_id } = body

    if (!booking_id) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    // Update booking status to in_progress
    const { data: booking, error } = await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', booking_id)
        .eq('status', 'confirmed')
        .select()
        .single()

    if (error || !booking) {
        return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        booking,
    })
}
