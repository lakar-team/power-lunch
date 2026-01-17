import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/hosts/onboard - Create host profile (no Stripe required)
export async function POST(request: NextRequest) {
    try {
        // Use server client to verify user session from cookies
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            console.error('[hosts/onboard] Auth error:', authError?.message || 'No user session')
            return NextResponse.json({
                error: 'Unauthorized',
                details: authError?.message || 'No active session found. Please log in again.'
            }, { status: 401 })
        }

        const body = await request.json()
        const { bio, topics } = body

        // Use admin client for database operations
        const supabase = createAdminClient()

        // Check if user already has a host profile
        const { data: existingHost } = await supabase
            .from('hosts')
            .select('id, stripe_account_id')
            .eq('user_id', user.id)
            .single()

        if (existingHost) {
            // Update existing host with new topics
            if (topics && topics.length > 0) {
                await supabase
                    .from('hosts')
                    .update({ topics } as any)
                    .eq('id', existingHost.id)
            }

            // Update profile bio
            if (bio) {
                await supabase
                    .from('profiles')
                    .update({ bio })
                    .eq('id', user.id)
            }

            return NextResponse.json({
                success: true,
                host_id: existingHost.id,
                has_stripe: !!existingHost.stripe_account_id,
                message: 'Host profile updated'
            })
        }

        // Create new host profile (no Stripe yet)
        const hostData = {
            user_id: user.id,
            topics: topics || [],
        }
        const { data: newHost, error: hostError } = await supabase
            .from('hosts')
            .insert(hostData as any)
            .select('id')
            .single()

        if (hostError) {
            console.error('[hosts/onboard] DB error:', hostError.message)
            return NextResponse.json({ error: hostError.message }, { status: 500 })
        }

        // Update profile bio
        if (bio) {
            await supabase
                .from('profiles')
                .update({ bio })
                .eq('id', user.id)
        }

        console.log('[hosts/onboard] Created host profile:', newHost.id)

        return NextResponse.json({
            success: true,
            host_id: newHost.id,
            has_stripe: false,
            message: 'Host profile created. Set up wallet to accept bookings.'
        })
    } catch (err: any) {
        console.error('[hosts/onboard] Unexpected error:', err.message, err.stack)
        return NextResponse.json({
            error: 'Failed to create host profile',
            details: err.message
        }, { status: 500 })
    }
}

// GET /api/hosts/onboard - Check onboarding status
export async function GET(request: NextRequest) {
    const authClient = createServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: host } = await supabase
        .from('hosts')
        .select('id, stripe_account_id, is_verified')
        .eq('user_id', user.id)
        .single() // Removed generic

    if (!host) {
        return NextResponse.json({
            is_host: false,
            is_verified: false,
            has_stripe: false,
        })
    }

    return NextResponse.json({
        is_host: true,
        is_verified: host.is_verified,
        has_stripe: !!host.stripe_account_id,
    })
}
