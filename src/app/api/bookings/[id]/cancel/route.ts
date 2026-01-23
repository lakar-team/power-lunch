import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { processRefund, cancelPaymentIntent } from '@/lib/stripe'
import { sendBookingCancelled } from '@/lib/email'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/bookings/[id]/cancel - Cancel a booking (guest or host)
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

        // Get the booking with host and guest info
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                *,
                listing:listings (id, title, price_yen),
                host:hosts (id, user_id),
                guest:profiles!bookings_guest_id_fkey (id, full_name, email)
            `)
            .eq('id', bookingId)
            .single()

        if (bookingError || !booking) {
            return NextResponse.json({
                error: 'Booking not found',
                details: bookingError?.message
            }, { status: 404 })
        }

        // Verify the current user is either the guest or the host
        const isGuest = booking.guest_id === user.id
        const isHost = booking.host.user_id === user.id

        if (!isGuest && !isHost) {
            return NextResponse.json({
                error: 'Forbidden',
                details: 'You are not a participant in this booking.'
            }, { status: 403 })
        }

        // Check booking can be cancelled (updated for new flow)
        const cancellableStatuses = ['pending_payment', 'pending_host', 'confirmed']
        if (!cancellableStatuses.includes(booking.status)) {
            return NextResponse.json({
                error: 'Cannot cancel booking',
                details: `Booking with status "${booking.status}" cannot be cancelled.`
            }, { status: 400 })
        }

        // Handle payment based on status
        let paymentAction = 'none'
        if (booking.stripe_payment_intent_id) {
            try {
                if (booking.status === 'confirmed') {
                    // Payment was captured - need to refund
                    await processRefund(booking.stripe_payment_intent_id)
                    paymentAction = 'refunded'
                    console.log('[cancel] Refund processed')
                } else if (booking.status === 'pending_host') {
                    // Payment on hold - release it
                    await cancelPaymentIntent(booking.stripe_payment_intent_id)
                    paymentAction = 'released'
                    console.log('[cancel] Payment hold released')
                }
            } catch (paymentError: any) {
                console.error('[cancel] Payment action failed:', paymentError.message)
                // Continue with cancellation even if payment action fails
            }
        }

        // Determine cancellation type
        const cancelledBy = isHost ? 'host' : 'guest'

        // Update booking status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'cancelled',
                cancellation_reason: reason || null,
                cancelled_by: cancelledBy,
                cancelled_at: new Date().toISOString(),
            } as any)
            .eq('id', bookingId)

        if (updateError) {
            console.error('[cancel] Failed to update booking:', updateError)
            return NextResponse.json({
                error: 'Failed to cancel booking',
                details: updateError.message
            }, { status: 500 })
        }

        // If there was a payment intent but no payment yet, update transaction
        if (booking.stripe_payment_intent_id) {
            await supabase
                .from('transactions')
                .update({
                    status: paymentAction === 'refunded' ? 'refunded' : 'cancelled',
                } as any)
                .eq('booking_id', bookingId)
        }

        console.log('[cancel] Booking cancelled:', bookingId, 'by:', cancelledBy)

        return NextResponse.json({
            success: true,
            message: 'Booking cancelled successfully.',
            refunded: paymentAction === 'refunded',
            cancelled_by: cancelledBy,
        })
    } catch (err: any) {
        console.error('[cancel] Error:', err.message)
        return NextResponse.json({
            error: 'Failed to cancel booking',
            details: err.message
        }, { status: 500 })
    }
}
