import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// Helper to generate secure hash using Web Crypto API
async function generateSecureHash(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16).toUpperCase()
}

// GET /api/bookings - Get user's bookings
export async function GET(request: NextRequest) {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'guest' // 'guest' or 'host'
    const status = searchParams.get('status') // Optional status filter

    let query

    if (role === 'host') {
        // Get bookings where user is the host
        const { data: host } = await supabase
            .from('hosts')
            .select('id')
            .eq('user_id', user.id)
            .single() // Removed generic

        if (!host) {
            return NextResponse.json({ bookings: [] })
        }

        const hostId = host.id

        query = supabase
            .from('bookings')
            .select(`
        *,
        listing:listings (*),
        guest:profiles!bookings_guest_id_fkey (*)
      `)
            .eq('host_id', hostId)
    } else {
        // Get bookings where user is the guest
        query = supabase
            .from('bookings')
            .select(`
        *,
        listing:listings (*),
        host:hosts (
          *,
          profile:profiles (*)
        )
      `)
            .eq('guest_id', user.id)
    }

    if (status) {
        query = query.eq('status', status)
    }

    const { data: bookings, error } = await query.order('booking_date', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookings })
}

// POST /api/bookings - Create a new booking with upfront payment (authorization hold)
export async function POST(request: NextRequest) {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.listing_id || !body.booking_date || !body.start_time) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get listing details with host info
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select(`
            *,
            host:hosts (
                id,
                user_id,
                stripe_account_id
            )
        `)
        .eq('id', body.listing_id)
        .single()

    if (listingError || !listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const listingHost = listing.host as { id: string; user_id: string; stripe_account_id: string | null }

    // Prevent booking own listing
    if (listingHost.user_id === user.id) {
        return NextResponse.json({ error: 'Cannot book your own listing' }, { status: 400 })
    }

    // REQUIRE host to have Stripe account for upfront payment
    if (!listingHost.stripe_account_id) {
        return NextResponse.json({
            error: 'Host not ready for bookings',
            details: 'This host has not completed their payment setup yet.'
        }, { status: 400 })
    }

    // Calculate end time based on duration
    const startTime = body.start_time
    const [hours, minutes] = startTime.split(':').map(Number)
    const endDate = new Date()
    endDate.setHours(hours, minutes + listing.duration_minutes)
    const endTime = endDate.toTimeString().slice(0, 5)

    // Calculate host response deadline
    // Min of (72 hours from now) OR (2 hours before event start)
    const now = new Date()
    const maxDeadline = new Date(now.getTime() + 72 * 60 * 60 * 1000) // 72 hours
    const eventStart = new Date(`${body.booking_date}T${startTime}:00`)
    const minDeadline = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000) // 2 hours before
    const hostResponseDeadline = maxDeadline < minDeadline ? maxDeadline : minDeadline

    // Check if deadline is already passed (booking too close to event time)
    if (hostResponseDeadline <= now) {
        return NextResponse.json({
            error: 'Booking too close to event time',
            details: 'Bookings must be made at least 2 hours before the event start time.'
        }, { status: 400 })
    }

    // Generate QR code hash
    const qrSecret = process.env.QR_SECRET || process.env.STRIPE_WEBHOOK_SECRET || 'default-qr-salt'
    const randomPart = Math.random().toString(36).substring(2, 10)
    const qrCodeHash = await generateSecureHash(`${body.listing_id}:${body.booking_date}:${Date.now()}:${qrSecret}:${randomPart}`)

    // Create booking first (in pending_payment status)
    const bookingData = {
        listing_id: body.listing_id,
        guest_id: user.id,
        host_id: listingHost.id,
        booking_date: body.booking_date,
        start_time: startTime,
        end_time: endTime,
        venue_selected: body.venue_selected,
        guest_note: body.guest_note,
        qr_code_hash: qrCodeHash,
        status: 'pending_payment',
        host_response_deadline: hostResponseDeadline.toISOString(),
    }

    const { data: booking, error: bookingError } = await supabase
        .from('bookings' as any)
        .insert(bookingData as any)
        .select()
        .single()

    if (bookingError || !booking) {
        return NextResponse.json({ error: bookingError?.message || 'Failed to create booking' }, { status: 500 })
    }

    // Create Payment Intent with authorization hold
    const { createPaymentIntentWithHold, calculateFees } = await import('@/lib/stripe')

    let paymentIntent
    try {
        paymentIntent = await createPaymentIntentWithHold(
            listing.price_yen,
            listingHost.stripe_account_id,
            booking.id
        )
    } catch (stripeError: any) {
        // Clean up booking if payment intent creation fails
        await supabase.from('bookings').delete().eq('id', booking.id)
        console.error('[bookings] Stripe error:', stripeError.message)
        return NextResponse.json({
            error: 'Payment setup failed',
            details: stripeError.message
        }, { status: 500 })
    }

    // Update booking with payment intent ID
    await supabase
        .from('bookings')
        .update({
            stripe_payment_intent_id: paymentIntent.id
        } as any)
        .eq('id', booking.id)

    // Create transaction record
    const fees = calculateFees(listing.price_yen)
    await supabase
        .from('transactions')
        .insert({
            booking_id: booking.id,
            amount_yen: fees.totalAmount,
            platform_fee_yen: fees.platformFee,
            host_payout_yen: fees.hostPayout,
            stripe_charge_id: paymentIntent.id,
            status: 'pending',
        } as any)

    console.log('[bookings] Created booking with payment hold:', booking.id)

    // Return client_secret for guest to complete payment
    return NextResponse.json({
        booking: {
            ...booking,
            stripe_payment_intent_id: paymentIntent.id,
        },
        client_secret: paymentIntent.client_secret,
        amount_yen: listing.price_yen,
        host_response_deadline: hostResponseDeadline.toISOString(),
        message: 'Complete payment to send your booking request to the host.',
    }, { status: 201 })
}
