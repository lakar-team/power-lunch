import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { createConnectedAccount, createConnectOnboardingLink } from '@/lib/stripe'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// POST /api/hosts/wallet-setup - Start Stripe Connect onboarding for existing host
export async function POST(request: NextRequest) {
    try {
        const authClient = createServerClient()
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({
                error: 'Unauthorized',
                details: 'Please log in to continue.'
            }, { status: 401 })
        }

        const supabase = createAdminClient()

        // Check if user is a host
        const { data: host } = await supabase
            .from('hosts')
            .select('id, stripe_account_id')
            .eq('user_id', user.id)
            .single()

        if (!host) {
            return NextResponse.json({
                error: 'Not a host',
                details: 'Please complete host onboarding first.'
            }, { status: 400 })
        }

        let stripeAccountId: string

        if (host.stripe_account_id) {
            // Use existing Stripe account
            stripeAccountId = host.stripe_account_id
        } else {
            // Create new Stripe Connected Account
            console.log('[wallet-setup] Creating Stripe account for:', user.email)
            stripeAccountId = await createConnectedAccount(user.email!)
            console.log('[wallet-setup] Created Stripe account:', stripeAccountId)

            // Update host with Stripe account ID
            await supabase
                .from('hosts')
                .update({ stripe_account_id: stripeAccountId } as any)
                .eq('id', host.id)
        }

        // Create onboarding link
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

        let onboardingUrl: string
        try {
            onboardingUrl = await createConnectOnboardingLink(
                stripeAccountId,
                `${baseUrl}/wallet?setup=complete`,
                `${baseUrl}/wallet?setup=refresh`
            )
        } catch (linkError: any) {
            console.warn('[wallet-setup] Link creation failed:', linkError.message)

            // Handle invalid/deleted account
            if (linkError.message?.includes('No such account') ||
                linkError.message?.includes('does not exist') ||
                linkError.message?.includes('not connected to your platform')) {

                // Create new account
                const newStripeAccountId = await createConnectedAccount(user.email!)
                await supabase
                    .from('hosts')
                    .update({ stripe_account_id: newStripeAccountId } as any)
                    .eq('id', host.id)

                onboardingUrl = await createConnectOnboardingLink(
                    newStripeAccountId,
                    `${baseUrl}/wallet?setup=complete`,
                    `${baseUrl}/wallet?setup=refresh`
                )
            } else {
                throw linkError
            }
        }

        return NextResponse.json({ url: onboardingUrl })
    } catch (err: any) {
        console.error('[wallet-setup] Error:', err.message)
        return NextResponse.json({
            error: 'Failed to start wallet setup',
            details: err.message
        }, { status: 500 })
    }
}

// GET /api/hosts/wallet-setup - Check wallet setup status
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
        .single()

    if (!host) {
        return NextResponse.json({
            is_host: false,
            has_stripe: false,
            wallet_ready: false,
        })
    }

    return NextResponse.json({
        is_host: true,
        has_stripe: !!host.stripe_account_id,
        wallet_ready: !!host.stripe_account_id,
    })
}
