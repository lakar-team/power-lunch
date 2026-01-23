import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cancelPaymentIntent } from '@/lib/stripe'
import { sendBookingExpiredToGuest, sendBookingExpiredToHost } from '@/lib/email'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/bookings/expire - Check and expire overdue bookings
// This should be called periodically (e.g., by Cloudflare Cron Trigger every 15 minutes)
// Or can be triggered manually for testing
export async function POST(request: NextRequest) {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.warn('[expire] Unauthorized cron attempt')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Find all pending_host bookings where deadline has passed
    const { data: expiredBookings, error: queryError } = await supabase
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
        .eq('status', 'pending_host')
        .lt('host_response_deadline', now)

    if (queryError) {
        console.error('[expire] Query error:', queryError)
        return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    if (!expiredBookings || expiredBookings.length === 0) {
        return NextResponse.json({
            message: 'No expired bookings found',
            processed: 0
        })
    }

    console.log(`[expire] Found ${expiredBookings.length} expired bookings`)

    const results = []

    for (const booking of expiredBookings) {
        try {
            // Cancel the payment authorization
            if (booking.stripe_payment_intent_id) {
                try {
                    await cancelPaymentIntent(booking.stripe_payment_intent_id)
                    console.log('[expire] Payment hold released:', booking.stripe_payment_intent_id)
                } catch (cancelError: any) {
                    console.error('[expire] Failed to cancel payment for', booking.id, ':', cancelError.message)
                    // Continue processing even if Stripe fails
                }
            }

            // Update booking status to expired
            await supabase
                .from('bookings')
                .update({
                    status: 'expired',
                    expired_at: now,
                } as any)
                .eq('id', booking.id)

            // Update transaction status
            await supabase
                .from('transactions')
                .update({
                    status: 'cancelled',
                } as any)
                .eq('booking_id', booking.id)

            // Get host email
            const { data: hostProfile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', booking.host?.user_id)
                .single()

            const emailData = {
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
            }

            // Send emails to both parties
            try {
                await sendBookingExpiredToGuest(emailData)
                await sendBookingExpiredToHost(emailData)
            } catch (emailError) {
                console.warn('[expire] Email failed for booking', booking.id)
            }

            results.push({ bookingId: booking.id, status: 'expired' })
            console.log('[expire] Expired booking:', booking.id)

        } catch (err: any) {
            console.error('[expire] Error processing booking', booking.id, ':', err.message)
            results.push({ bookingId: booking.id, status: 'error', error: err.message })
        }
    }

    return NextResponse.json({
        message: `Processed ${expiredBookings.length} expired bookings`,
        processed: expiredBookings.length,
        results,
    })
}

// GET endpoint for checking status (read-only)
export async function GET(request: NextRequest) {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Count pending bookings by deadline status
    const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_host')

    const { count: overdueCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_host')
        .lt('host_response_deadline', now)

    return NextResponse.json({
        pending_host_bookings: pendingCount || 0,
        overdue_bookings: overdueCount || 0,
        current_time: now,
    })
}
