import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { capturePayment } from '@/lib/stripe'
import { sendBookingConfirmedToGuest } from '@/lib/email'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/bookings/[id]/accept - Host accepts a pending booking, captures the held payment
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const bookingId = params.id

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
                    user_id,
                    stripe_account_id
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

        // Check booking is in pending_host status (guest has already paid, on hold)
        if (booking.status !== 'pending_host') {
            return NextResponse.json({
                error: 'Invalid booking status',
                details: `Cannot accept a booking with status: ${booking.status}. Expected: pending_host`
            }, { status: 400 })
        }

        // Check if deadline has passed
        if (booking.host_response_deadline) {
            const deadline = new Date(booking.host_response_deadline)
            if (new Date() > deadline) {
                return NextResponse.json({
                    error: 'Deadline passed',
                    details: 'The response deadline has passed. This booking has expired.'
                }, { status: 400 })
            }
        }

        // Check we have a payment intent to capture
        if (!booking.stripe_payment_intent_id) {
            return NextResponse.json({
                error: 'No payment to capture',
                details: 'This booking does not have an authorized payment.'
            }, { status: 400 })
        }

        // Capture the authorized payment
        let capturedPayment
        try {
            capturedPayment = await capturePayment(booking.stripe_payment_intent_id)
        } catch (captureError: any) {
            console.error('[accept] Capture failed:', captureError.message)
            return NextResponse.json({
                error: 'Payment capture failed',
                details: captureError.message
            }, { status: 500 })
        }

        // Update booking status to confirmed
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
            } as any)
            .eq('id', bookingId)

        if (updateError) {
            console.error('[accept] Failed to update booking:', updateError)
            return NextResponse.json({
                error: 'Failed to update booking',
                details: updateError.message
            }, { status: 500 })
        }

        // Update transaction status
        await supabase
            .from('transactions')
            .update({
                status: 'completed',
            } as any)
            .eq('booking_id', bookingId)

        // Get host profile for email
        const { data: hostProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        // Send confirmation email to guest
        try {
            await sendBookingConfirmedToGuest({
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
                qrCode: `PL-${booking.qr_code_hash}-JP`,
            })
        } catch (emailError) {
            console.warn('[accept] Email failed:', emailError)
            // Don't fail the request if email fails
        }

        console.log('[accept] Booking confirmed, payment captured:', capturedPayment.id)

        return NextResponse.json({
            success: true,
            message: 'Booking confirmed! Payment has been processed.',
            qr_code: `PL-${booking.qr_code_hash}-JP`,
        })
    } catch (err: any) {
        console.error('[accept] Error:', err.message)
        return NextResponse.json({
            error: 'Failed to accept booking',
            details: err.message
        }, { status: 500 })
    }
}
