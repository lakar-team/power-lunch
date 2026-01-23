import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendBookingRequestToHost } from '@/lib/email'
import Stripe from 'stripe'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createAdminClient()

    switch (event.type) {
        // Guest has authorized payment (money on hold) - notify host
        case 'payment_intent.amount_capturable_updated': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent
            const bookingId = paymentIntent.metadata?.booking_id

            if (!bookingId) {
                console.warn('[webhook] No booking_id in payment intent metadata')
                break
            }

            // Get booking details
            const { data: booking } = await supabase
                .from('bookings')
                .select(`
                    *,
                    listing:listings (id, title, price_yen),
                    host:hosts (id, user_id),
                    guest:profiles!bookings_guest_id_fkey (id, full_name, email)
                `)
                .eq('id', bookingId)
                .single()

            if (!booking) {
                console.error('[webhook] Booking not found:', bookingId)
                break
            }

            // Update booking status: guest has paid, now waiting for host
            const { error } = await supabase
                .from('bookings')
                .update({
                    status: 'pending_host',
                    payment_authorized_at: new Date().toISOString(),
                } as any)
                .eq('id', bookingId)

            if (error) {
                console.error('[webhook] Failed to update booking:', error)
                break
            }

            // Get host profile for email
            const { data: hostProfile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', booking.host?.user_id)
                .single()

            // Send email to host about new booking request
            try {
                await sendBookingRequestToHost({
                    bookingId: booking.id,
                    guestName: booking.guest?.full_name || 'Guest',
                    guestEmail: booking.guest?.email || '',
                    hostName: hostProfile?.full_name || 'Host',
                    hostEmail: hostProfile?.email || '',
                    listingTitle: booking.listing?.title || 'Session',
                    bookingDate: booking.booking_date,
                    startTime: booking.start_time,
                    endTime: booking.end_time,
                    venue: booking.venue_selected || 'TBD',
                    priceYen: booking.listing?.price_yen || 0,
                    hostResponseDeadline: booking.host_response_deadline,
                })
                console.log('[webhook] Sent booking request email to host')
            } catch (emailError) {
                console.warn('[webhook] Email failed:', emailError)
            }

            console.log('[webhook] Payment authorized, notified host:', bookingId)
            break
        }

        // Payment captured (host accepted) - this confirms the booking
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent

            // Only update if this is a capture (for manual capture intents)
            // For automatic capture, this would already be confirmed
            const { data: booking } = await supabase
                .from('bookings')
                .select('status')
                .eq('stripe_payment_intent_id', paymentIntent.id)
                .single()

            // If already confirmed (capture happened via accept API), skip
            if (booking?.status === 'confirmed') {
                console.log('[webhook] Booking already confirmed, skipping')
                break
            }

            // Update booking status to confirmed
            await supabase
                .from('bookings')
                .update({ status: 'confirmed' } as any)
                .eq('stripe_payment_intent_id', paymentIntent.id)

            // Update transaction status
            await supabase
                .from('transactions')
                .update({ status: 'completed' } as any)
                .eq('stripe_charge_id', paymentIntent.id)

            console.log('[webhook] Payment succeeded:', paymentIntent.id)
            break
        }

        // Payment failed
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent

            // Update booking status back to pending_payment (guest can retry)
            await supabase
                .from('bookings')
                .update({ status: 'pending_payment' } as any)
                .eq('stripe_payment_intent_id', paymentIntent.id)

            // Update transaction status
            await supabase
                .from('transactions')
                .update({ status: 'failed' } as any)
                .eq('stripe_charge_id', paymentIntent.id)

            console.log('[webhook] Payment failed:', paymentIntent.id)
            break
        }

        // Payment intent cancelled (host declined or booking expired)
        case 'payment_intent.canceled': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent

            // Transaction already updated by decline/expire endpoints
            console.log('[webhook] Payment intent cancelled:', paymentIntent.id)
            break
        }

        // Host Stripe account updated
        case 'account.updated': {
            const account = event.data.object as Stripe.Account

            // Update host verification status
            if (account.charges_enabled && account.payouts_enabled) {
                await supabase
                    .from('hosts')
                    .update({ is_verified: true } as any)
                    .eq('stripe_account_id', account.id)
                console.log('[webhook] Host verified:', account.id)
            }

            break
        }

        // Refund processed
        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge

            // Update transaction with refund info
            await supabase
                .from('transactions')
                .update({
                    status: 'refunded',
                    refund_amount_yen: charge.amount_refunded,
                } as any)
                .eq('stripe_charge_id', charge.payment_intent as string)

            // Update booking status
            await supabase
                .from('bookings')
                .update({ status: 'cancelled' } as any)
                .eq('stripe_payment_intent_id', charge.payment_intent as string)

            console.log('[webhook] Refund processed:', charge.id)
            break
        }

        default:
            console.log(`[webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
}
