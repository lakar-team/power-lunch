import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/listings - Get all active listings
export async function GET(request: NextRequest) {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '5' // km

    let query = supabase
        .from('listings')
        .select(`
      id,
      title,
      category,
      price_yen,
      duration_minutes,
      location_lat,
      location_lng,
      location_area,
      session_type,
      host:hosts (
        id,
        topics,
        rating_avg,
        is_verified,
        profile:profiles (
          full_name,
          avatar_url
        )
      )
    `)
        .eq('is_active', true)

    // Apply filters
    if (category) {
        query = query.eq('category', category)
    }

    if (minPrice) {
        query = query.gte('price_yen', parseInt(minPrice))
    }

    if (maxPrice) {
        query = query.lte('price_yen', parseInt(maxPrice))
    }

    // For location-based search, we'd use PostGIS in production
    // For now, we return all and filter client-side

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ listings: data })
}

// POST /api/listings - Create a new listing
export async function POST(request: NextRequest) {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host profile
    const { data: host, error: hostError } = await supabase
        .from('hosts')
        .select('id')
        .eq('user_id', user.id)
        .single() // Removed generic to fix build error

    if (hostError || !host) {
        return NextResponse.json({ error: 'Host profile not found' }, { status: 404 })
    }

    const hostId = host.id
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.price_yen) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create listing
    const listingData = {
        host_id: hostId,
        title: body.title,
        description: body.description,
        category: body.category,
        price_yen: body.price_yen,
        duration_minutes: body.duration_minutes || 30,
        location_lat: body.location_lat,
        location_lng: body.location_lng,
        location_area: body.location_area,
        venue_options: body.venue_options || [],
        cover_image_url: body.cover_image_url,
    }
    const { data: listing, error: listingError } = await supabase
        .from('listings' as any)
        .insert(listingData as any)
        .select()
        .single() // Removed generic to fix build error

    if (listingError || !listing) {
        return NextResponse.json({ error: listingError?.message || 'Failed to create listing' }, { status: 500 })
    }

    // Create availability slots if provided
    if (body.availability_slots && Array.isArray(body.availability_slots)) {
        const slots = body.availability_slots.map((slot: any) => ({
            listing_id: listing.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
        }))

        await supabase.from('availability_slots' as any).insert(slots as any)
    }

    return NextResponse.json({ listing }, { status: 201 })
}
