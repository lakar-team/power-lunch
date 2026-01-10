import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { createPaymentIntent, calculateFees } from '@/lib/stripe'
import crypto from 'crypto'

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
            .single<{ id: string }>()

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

// POST /api/bookings - Create a new booking
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

    // Get listing details
    type ListingWithHost = {
        id: string
        price_yen: number
        duration_minutes: number
        host: { id: string; user_id: string; stripe_account_id: string | null }
    }
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
        .single<ListingWithHost>()

    if (listingError || !listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const listingHost = listing.host

    // Prevent booking own listing
    if (listingHost.user_id === user.id) {
        return NextResponse.json({ error: 'Cannot book your own listing' }, { status: 400 })
    }

    // Check if host has Stripe account for payments
    if (!listingHost.stripe_account_id) {
        return NextResponse.json({ error: 'Host is not set up for payments' }, { status: 400 })
    }

    // Calculate end time based on duration
    const startTime = body.start_time
    const [hours, minutes] = startTime.split(':').map(Number)
    const endDate = new Date()
    endDate.setHours(hours, minutes + listing.duration_minutes)
    const endTime = endDate.toTimeString().slice(0, 5)

    // Generate QR code hash
    const qrCodeHash = crypto
        .createHash('sha256')
        .update(`${body.listing_id}:${body.booking_date}:${Date.now()}:${process.env.STRIPE_WEBHOOK_SECRET}`)
        .digest('hex')
        .slice(0, 16)
        .toUpperCase()

    // Create Stripe Payment Intent
    let paymentIntent
    try {
        paymentIntent = await createPaymentIntent(
            listing.price_yen,
            listingHost.stripe_account_id,
            'pending' // Will update after booking is created
        )
    } catch (stripeError: any) {
        return NextResponse.json({ error: stripeError.message }, { status: 500 })
    }

    // Create booking
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
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending' as const,
    }
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData as any)
        .select()
        .single<{ id: string }>()

    if (bookingError || !booking) {
        return NextResponse.json({ error: bookingError?.message || 'Failed to create booking' }, { status: 500 })
    }

    // Create transaction record
    const fees = calculateFees(listing.price_yen)
    const transactionData = {
        booking_id: booking.id,
        amount_yen: fees.totalAmount,
        platform_fee_yen: fees.platformFee,
        host_payout_yen: fees.hostPayout,
        stripe_charge_id: paymentIntent.id,
        status: 'pending' as const,
    }
    await supabase.from('transactions').insert(transactionData as any)

    return NextResponse.json({
        booking,
        payment: {
            clientSecret: paymentIntent.client_secret,
            amount: listing.price_yen,
        },
        qrCode: `PL-${qrCodeHash}-JP`,
    }, { status: 201 })
}
