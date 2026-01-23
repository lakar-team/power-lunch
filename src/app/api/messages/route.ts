import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { booking_id, message_text } = body

        if (!booking_id || !message_text?.trim()) {
            return NextResponse.json({
                error: 'Missing required fields',
                details: 'booking_id and message_text are required'
            }, { status: 400 })
        }

        // Authenticate user
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({
                error: 'Unauthorized'
            }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Get the booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                id,
                guest_id,
                booking_date,
                status,
                host:hosts (id, user_id)
            `)
            .eq('id', booking_id)
            .single()

        if (bookingError || !booking) {
            return NextResponse.json({
                error: 'Booking not found'
            }, { status: 404 })
        }

        // Verify user is a participant
        const isGuest = booking.guest_id === user.id
        const isHost = booking.host?.user_id === user.id

        if (!isGuest && !isHost) {
            return NextResponse.json({
                error: 'Forbidden',
                details: 'You are not a participant in this booking.'
            }, { status: 403 })
        }

        // Verify booking is confirmed
        if (booking.status !== 'confirmed') {
            return NextResponse.json({
                error: 'Chat not available',
                details: 'Chat is only available for confirmed bookings.'
            }, { status: 400 })
        }

        // Check if it's the day of the booking (allow from midnight to end of day)
        const today = new Date().toISOString().split('T')[0]
        const bookingDate = booking.booking_date

        if (today !== bookingDate) {
            return NextResponse.json({
                error: 'Chat not available',
                details: 'Chat is only available on the day of your booking.'
            }, { status: 400 })
        }

        // Insert message
        const { data: message, error: insertError } = await supabase
            .from('messages')
            .insert({
                booking_id,
                sender_id: user.id,
                message_text: message_text.trim(),
            })
            .select()
            .single()

        if (insertError) {
            console.error('[messages] Insert error:', insertError)
            return NextResponse.json({
                error: 'Failed to send message',
                details: insertError.message
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message
        }, { status: 201 })

    } catch (err: any) {
        console.error('[messages] Error:', err.message)
        return NextResponse.json({
            error: 'Failed to send message',
            details: err.message
        }, { status: 500 })
    }
}

// GET /api/messages?booking_id=xxx - Get messages for a booking
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('booking_id')

    if (!bookingId) {
        return NextResponse.json({
            error: 'Missing booking_id parameter'
        }, { status: 400 })
    }

    // Authenticate user
    const authClient = createServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({
            error: 'Unauthorized'
        }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Verify user is a participant
    const { data: booking } = await supabase
        .from('bookings')
        .select('guest_id, host:hosts(user_id)')
        .eq('id', bookingId)
        .single()

    if (!booking) {
        return NextResponse.json({
            error: 'Booking not found'
        }, { status: 404 })
    }

    const isGuest = booking.guest_id === user.id
    const isHost = booking.host?.user_id === user.id

    if (!isGuest && !isHost) {
        return NextResponse.json({
            error: 'Forbidden'
        }, { status: 403 })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
        .from('messages')
        .select(`
            id,
            sender_id,
            message_text,
            created_at,
            sender:profiles!messages_sender_id_fkey (
                full_name,
                avatar_url
            )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('[messages] Fetch error:', error)
        return NextResponse.json({
            error: 'Failed to fetch messages'
        }, { status: 500 })
    }

    return NextResponse.json({ messages })
}
