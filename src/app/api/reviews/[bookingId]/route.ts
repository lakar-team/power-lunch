import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// GET /api/reviews/[bookingId] - Check if current user has reviewed this booking
export async function GET(
    request: NextRequest,
    { params }: { params: { bookingId: string } }
) {
    try {
        const bookingId = params.bookingId

        // Authenticate user
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({
                error: 'Unauthorized'
            }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Check for existing review by this user
        const { data: review } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at')
            .eq('booking_id', bookingId)
            .eq('reviewer_id', user.id)
            .single()

        if (review) {
            return NextResponse.json({
                hasReviewed: true,
                review
            })
        }

        return NextResponse.json({
            hasReviewed: false,
            review: null
        })

    } catch (err: any) {
        console.error('[reviews] Check error:', err.message)
        return NextResponse.json({
            error: 'Failed to check review status',
            details: err.message
        }, { status: 500 })
    }
}
