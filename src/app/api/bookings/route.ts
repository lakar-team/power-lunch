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
        .single()

    if (listingError || !listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const listingHost = listing.host

    // Prevent booking own listing
    if (listingHost.user_id === user.id) {
        return NextResponse.json({ error: 'Cannot book your own listing' }, { status: 400 })
    }

    // NOTE: We no longer require Stripe setup here - booking will be pending_host_accept
    // Payment is created when host accepts the booking

    // Calculate end time based on duration
    const startTime = body.start_time
    const [hours, minutes] = startTime.split(':').map(Number)
    const endDate = new Date()
    endDate.setHours(hours, minutes + listing.duration_minutes)
    const endTime = endDate.toTimeString().slice(0, 5)

    // Generate QR code hash using dedicated secret
    const qrSecret = process.env.QR_SECRET || process.env.STRIPE_WEBHOOK_SECRET || 'default-qr-salt'
    const randomPart = Math.random().toString(36).substring(2, 10)
    const qrCodeHash = await generateSecureHash(`${body.listing_id}:${body.booking_date}:${Date.now()}:${qrSecret}:${randomPart}`)

    // Create booking with pending_host_accept status (no payment yet)
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
        status: 'pending' as const, // Host needs to accept
    }
    const { data: booking, error: bookingError } = await supabase
        .from('bookings' as any)
        .insert(bookingData as any)
        .select()
        .single()

    if (bookingError || !booking) {
        return NextResponse.json({ error: bookingError?.message || 'Failed to create booking' }, { status: 500 })
    }

    return NextResponse.json({
        booking,
        qrCode: `PL-${qrCodeHash}-JP`,
        message: 'Booking request sent. Waiting for host to accept.',
    }, { status: 201 })
}
