import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { createConnectedAccount, createConnectOnboardingLink } from '@/lib/stripe'

// POST /api/hosts/onboard - Start Stripe Connect onboarding
export async function POST(request: NextRequest) {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a host profile
    const { data: existingHost } = await supabase
        .from('hosts')
        .select('id, stripe_account_id')
        .eq('user_id', user.id)
        .single<{ id: string; stripe_account_id: string | null }>()

    let stripeAccountId: string

    if (existingHost?.stripe_account_id) {
        // Use existing Stripe account
        stripeAccountId = existingHost.stripe_account_id
    } else {
        // Create new Stripe Connected Account
        stripeAccountId = await createConnectedAccount(user.email!)

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
    const onboardingUrl = await createConnectOnboardingLink(
        stripeAccountId,
        `${baseUrl}/host/dashboard?onboarding=complete`,
        `${baseUrl}/host/onboard?refresh=true`
    )

    return NextResponse.json({ url: onboardingUrl })
}

// GET /api/hosts/onboard - Check onboarding status
export async function GET(request: NextRequest) {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: host } = await supabase
        .from('hosts')
        .select('id, stripe_account_id, is_verified')
        .eq('user_id', user.id)
        .single<{ id: string; stripe_account_id: string | null; is_verified: boolean }>()

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
