import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createConnectedAccount, createConnectOnboardingLink } from '@/lib/stripe'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/hosts/onboard - Start Stripe Connect onboarding
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

        // Use admin client for database operations
        const supabase = createAdminClient()

        // Check if user already has a host profile
        const { data: existingHost } = await supabase
            .from('hosts')
            .select('id, stripe_account_id')
            .eq('user_id', user.id)
            .single()

        let stripeAccountId: string

        if (existingHost?.stripe_account_id) {
            // Use existing Stripe account
            stripeAccountId = existingHost.stripe_account_id
        } else {
            // Create new Stripe Connected Account
            console.log('[hosts/onboard] Creating Stripe account for:', user.email)
            stripeAccountId = await createConnectedAccount(user.email!)
            console.log('[hosts/onboard] Created Stripe account:', stripeAccountId)

            if (!existingHost) {
                // Create host profile
                const hostData = {
                    user_id: user.id,
                    stripe_account_id: stripeAccountId,
                }
                const { error: hostError } = await supabase
                    .from('hosts')
                    .insert(hostData as any)

                if (hostError) {
                    console.error('[hosts/onboard] DB error:', hostError.message)
                    return NextResponse.json({ error: hostError.message }, { status: 500 })
                }
            } else {
                // Update existing host with Stripe account
                await supabase
                    .from('hosts')
                    .update({ stripe_account_id: stripeAccountId } as any)
                    .eq('id', existingHost.id)
            }
        }

        // Create onboarding link
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        console.log('[hosts/onboard] Creating onboarding link with baseUrl:', baseUrl)
        const onboardingUrl = await createConnectOnboardingLink(
            stripeAccountId,
            `${baseUrl}/host/dashboard?onboarding=complete`,
            `${baseUrl}/host/onboard?refresh=true`
        )
        console.log('[hosts/onboard] Onboarding URL created:', onboardingUrl)

        return NextResponse.json({ url: onboardingUrl })
    } catch (err: any) {
        console.error('[hosts/onboard] Unexpected error:', err.message, err.stack)
        return NextResponse.json({
            error: 'Failed to start onboarding',
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
