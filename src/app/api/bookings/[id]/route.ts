import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createPaymentIntent, calculateFees } from '@/lib/stripe'

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
        .single()

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

// PATCH /api/bookings/[id] - Accept or reject a booking
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authClient = createServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'accept' or 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
        return NextResponse.json({ error: 'Invalid action. Use accept or reject.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get booking with listing details
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
            *,
            listing:listings (
                id,
                price_yen,
                title
            )
        `)
        .eq('id', params.id)
        .single()

    if (bookingError || !booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify user is the host of this booking
    const { data: host } = await supabase
        .from('hosts')
        .select('id, stripe_account_id')
        .eq('user_id', user.id)
        .single()

    if (!host || booking.host_id !== host.id) {
        return NextResponse.json({ error: 'Only the host can accept/reject bookings' }, { status: 403 })
    }

    // Handle rejection
    if (action === 'reject') {
        await supabase
            .from('bookings')
            .update({ status: 'cancelled' } as any)
            .eq('id', params.id)

        return NextResponse.json({
            success: true,
            message: 'Booking rejected',
            status: 'cancelled'
        })
    }

    // Handle acceptance - check for wallet setup
    if (!host.stripe_account_id) {
        return NextResponse.json({
            error: 'wallet_setup_required',
            message: 'Please complete wallet setup to accept bookings.',
            redirect: '/wallet'
        }, { status: 402 }) // 402 Payment Required
    }

    // Create payment intent now that host is accepting
    let paymentIntent
    try {
        paymentIntent = await createPaymentIntent(
            booking.listing.price_yen,
            host.stripe_account_id,
            params.id
        )
    } catch (stripeError: any) {
        console.error('[booking/accept] Stripe error:', stripeError.message)
        return NextResponse.json({ error: stripeError.message }, { status: 500 })
    }

    // Update booking status and add payment intent
    await supabase
        .from('bookings')
        .update({
            status: 'confirmed',
            stripe_payment_intent_id: paymentIntent.id
        } as any)
        .eq('id', params.id)

    // Create transaction record
    const fees = calculateFees(booking.listing.price_yen)
    await supabase.from('transactions' as any).insert({
        booking_id: params.id,
        amount_yen: fees.totalAmount,
        platform_fee_yen: fees.platformFee,
        host_payout_yen: fees.hostPayout,
        stripe_charge_id: paymentIntent.id,
        status: 'pending' as const,
    } as any)

    return NextResponse.json({
        success: true,
        message: 'Booking accepted',
        status: 'confirmed',
        payment: {
            clientSecret: paymentIntent.client_secret,
            amount: booking.listing.price_yen,
        }
    })
}
