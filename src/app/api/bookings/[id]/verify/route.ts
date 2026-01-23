import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/bookings/[id]/verify - Host verifies guest QR code
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const bookingId = params.id
        const { code } = await request.json()

        if (!code) {
            return NextResponse.json({
                error: 'Missing code',
                details: 'QR code is required for verification.'
            }, { status: 400 })
        }

        // Authenticate user (must be the host)
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({
                error: 'Unauthorized',
                details: 'Please log in to continue.'
            }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Get the booking with host info
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                *,
                host:hosts (
                    id,
                    user_id
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

        // Check booking status - must be confirmed
        if (booking.status !== 'confirmed') {
            return NextResponse.json({
                error: 'Invalid booking status',
                details: `Only confirmed bookings can be verified. Current status: ${booking.status}`
            }, { status: 400 })
        }

        // Compare codes
        // The expected code format is PL-[hash]-JP
        const providedHash = code.replace(/^PL-/, '').replace(/-JP$/, '')

        if (providedHash !== booking.qr_code_hash) {
            return NextResponse.json({
                error: 'Invalid code',
                details: 'The provided code does not match this booking.'
            }, { status: 400 })
        }

        // Optional: Check if session is around the scheduled time (e.g. within 12 hours)
        const now = new Date()
        const bookingStart = new Date(`${booking.booking_date}T${booking.start_time}:00`)
        const twelveHoursBefore = new Date(bookingStart.getTime() - 12 * 60 * 60 * 1000)
        const twelveHoursAfter = new Date(bookingStart.getTime() + 12 * 60 * 60 * 1000)

        if (now < twelveHoursBefore || now > twelveHoursAfter) {
            return NextResponse.json({
                error: 'Verification window closed',
                details: 'Bookings can only be verified within 12 hours of the scheduled start time.'
            }, { status: 400 })
        }

        // Update booking to completed
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'completed',
                verified_at: now.toISOString(),
                completed_at: now.toISOString(),
            } as any)
            .eq('id', bookingId)

        if (updateError) {
            console.error('[verify] Failed to update booking:', updateError)
            return NextResponse.json({
                error: 'Failed to complete booking',
                details: updateError.message
            }, { status: 500 })
        }

        console.log('[verify] Booking verified and completed:', bookingId)

        return NextResponse.json({
            success: true,
            message: 'Session successfully verified and marked as completed.',
        })

    } catch (err: any) {
        console.error('[verify] Error:', err.message)
        return NextResponse.json({
            error: 'Failed to verify booking',
            details: err.message
        }, { status: 500 })
    }
}
