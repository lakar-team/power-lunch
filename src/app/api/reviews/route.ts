import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/reviews - Submit a review for a completed booking
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { booking_id, rating, comment } = body

        // Validate input
        if (!booking_id || !rating) {
            return NextResponse.json({
                error: 'Missing required fields',
                details: 'booking_id and rating are required'
            }, { status: 400 })
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({
                error: 'Invalid rating',
                details: 'Rating must be between 1 and 5'
            }, { status: 400 })
        }

        // Authenticate user
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({
                error: 'Unauthorized',
                details: 'Please log in to submit a review.'
            }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Get the booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select(`
                *,
                host:hosts (
                    id,
                    user_id
                )
            `)
            .eq('id', booking_id)
            .single()

        if (bookingError || !booking) {
            return NextResponse.json({
                error: 'Booking not found',
                details: bookingError?.message
            }, { status: 404 })
        }

        // Verify booking is completed
        if (booking.status !== 'completed') {
            return NextResponse.json({
                error: 'Booking not completed',
                details: 'You can only review completed sessions.'
            }, { status: 400 })
        }

        // Determine reviewer role and reviewee
        const isGuest = booking.guest_id === user.id
        const isHost = booking.host.user_id === user.id

        if (!isGuest && !isHost) {
            return NextResponse.json({
                error: 'Forbidden',
                details: 'You are not a participant in this booking.'
            }, { status: 403 })
        }

        // Guests review hosts, hosts review guests
        const revieweeId = isGuest ? booking.host.user_id : booking.guest_id

        // Prevent self-review
        if (user.id === revieweeId) {
            return NextResponse.json({
                error: 'Invalid review',
                details: 'You cannot review yourself.'
            }, { status: 400 })
        }

        // Check for existing review
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('booking_id', booking_id)
            .eq('reviewer_id', user.id)
            .single()

        if (existingReview) {
            return NextResponse.json({
                error: 'Already reviewed',
                details: 'You have already submitted a review for this booking.'
            }, { status: 400 })
        }

        // Insert review
        const { data: review, error: insertError } = await supabase
            .from('reviews')
            .insert({
                booking_id,
                reviewer_id: user.id,
                reviewee_id: revieweeId,
                rating,
                comment: comment || null,
            })
            .select()
            .single()

        if (insertError) {
            console.error('[reviews] Insert error:', insertError)
            return NextResponse.json({
                error: 'Failed to submit review',
                details: insertError.message
            }, { status: 500 })
        }

        // Update host's rating_average if guest reviewed host
        if (isGuest) {
            // Calculate new average
            const { data: stats } = await supabase
                .from('reviews')
                .select('rating')
                .eq('reviewee_id', revieweeId)

            if (stats && stats.length > 0) {
                const avgRating = stats.reduce((sum, r) => sum + r.rating, 0) / stats.length

                await supabase
                    .from('hosts')
                    .update({
                        rating_average: Math.round(avgRating * 100) / 100,
                        total_sessions: stats.length,
                    } as any)
                    .eq('user_id', revieweeId)
            }
        }

        console.log('[reviews] Review submitted:', review.id)

        return NextResponse.json({
            success: true,
            review,
            message: 'Thank you for your review!'
        }, { status: 201 })

    } catch (err: any) {
        console.error('[reviews] Error:', err.message)
        return NextResponse.json({
            error: 'Failed to submit review',
            details: err.message
        }, { status: 500 })
    }
}

// GET /api/reviews?host_id=xxx - Get reviews for a host
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const hostUserId = searchParams.get('host_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!hostUserId) {
        return NextResponse.json({
            error: 'Missing host_id parameter'
        }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            comment,
            created_at,
            reviewer:profiles!reviews_reviewer_id_fkey (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('reviewee_id', hostUserId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('[reviews] Fetch error:', error)
        return NextResponse.json({
            error: 'Failed to fetch reviews',
            details: error.message
        }, { status: 500 })
    }

    // Calculate stats
    const { data: stats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', hostUserId)

    const totalReviews = stats?.length || 0
    const avgRating = totalReviews > 0
        ? stats!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0

    return NextResponse.json({
        reviews,
        stats: {
            total: totalReviews,
            average: Math.round(avgRating * 10) / 10,
        }
    })
}
