import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { cancelPaymentIntent } from '@/lib/stripe'
import { sendBookingDeclinedToGuest } from '@/lib/email'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/bookings/[id]/decline - Host declines a pending booking, releases payment hold
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const bookingId = params.id
        const body = await request.json().catch(() => ({}))
        const { reason } = body

        // Authenticate user
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({
                error: 'Unauthorized',
                details: 'Please log in to continue.'
            }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Get the booking with listing, host, and guest info
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                *,
                listing:listings (
                    id,
                    price_yen,
                    title
                ),
                host:hosts (
                    id,
                    user_id
                ),
                guest:profiles!bookings_guest_id_fkey (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            return NextResponse.json({
                error: 'Booking not found',
                details: bookingError?.message
            }, { status: 404 })
        }

        // Verify the current user is the host for this booking
        if (booking.host.user_id !== user.id) {
            return NextResponse.json({
                error: 'Forbidden',
                details: 'You are not the host for this booking.'
            }, { status: 403 })
        }

        // Check booking is in pending_host status
        if (booking.status !== 'pending_host') {
            return NextResponse.json({
                error: 'Invalid booking status',
                details: `Cannot decline a booking with status: ${booking.status}. Expected: pending_host`
            }, { status: 400 })
        }

        // Cancel/release the payment authorization
        if (booking.stripe_payment_intent_id) {
            try {
                await cancelPaymentIntent(booking.stripe_payment_intent_id)
                console.log('[decline] Payment hold released:', booking.stripe_payment_intent_id)
            } catch (cancelError: any) {
                console.error('[decline] Failed to cancel payment:', cancelError.message)
                // Continue with decline even if Stripe fails - we can handle manually
            }
        }

        // Update booking status to declined
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'declined',
                declined_at: new Date().toISOString(),
                declined_reason: reason || null,
            } as any)
            .eq('id', bookingId)

        if (updateError) {
            console.error('[decline] Failed to update booking:', updateError)
            return NextResponse.json({
                error: 'Failed to update booking',
                details: updateError.message
            }, { status: 500 })
        }

        // Update transaction status
        await supabase
            .from('transactions')
            .update({
                status: 'cancelled',
            } as any)
            .eq('booking_id', bookingId)

        // Get host profile for email
        const { data: hostProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

        // Send declined email to guest
        try {
            await sendBookingDeclinedToGuest({
                bookingId: booking.id,
                guestName: booking.guest?.full_name || 'Guest',
                guestEmail: booking.guest?.email || '',
                hostName: hostProfile?.full_name || 'Host',
                hostEmail: '',
                listingTitle: booking.listing?.title || 'Session',
                bookingDate: booking.booking_date,
                startTime: booking.start_time,
                endTime: booking.end_time,
                venue: booking.venue_selected || 'TBD',
                priceYen: booking.listing?.price_yen || 0,
            }, reason)
        } catch (emailError) {
            console.warn('[decline] Email failed:', emailError)
        }

        console.log('[decline] Booking declined:', bookingId)

        return NextResponse.json({
            success: true,
            message: 'Booking declined. The guest has been notified and their payment hold released.',
        })
    } catch (err: any) {
        console.error('[decline] Error:', err.message)
        return NextResponse.json({
            error: 'Failed to decline booking',
            details: err.message
        }, { status: 500 })
    }
}
