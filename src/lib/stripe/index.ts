import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
})

// Platform fee percentage (15%)
export const PLATFORM_FEE_PERCENT = 15

// Calculate fees for a booking
export function calculateFees(priceYen: number) {
    const platformFee = Math.round(priceYen * (PLATFORM_FEE_PERCENT / 100))
    const hostPayout = priceYen - platformFee

    return {
        totalAmount: priceYen,
        platformFee,
        hostPayout,
    }
}

// Create Stripe Connect onboarding link for hosts
export async function createConnectOnboardingLink(
    accountId: string,
    returnUrl: string,
    refreshUrl: string
) {
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
    })

    return accountLink.url
}

// Create a new Connected Account for a host
export async function createConnectedAccount(email: string) {
    const account = await stripe.accounts.create({
        type: 'express',
        country: 'JP',
        email,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        business_type: 'individual',
    })

    return account.id
}

// Create Payment Intent with destination charge (split payment)
export async function createPaymentIntent(
    amountYen: number,
    hostStripeAccountId: string,
    bookingId: string
) {
    const { platformFee, hostPayout } = calculateFees(amountYen)

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountYen, // Stripe uses smallest currency unit (yen = 1)
        currency: 'jpy',
        payment_method_types: ['card'],
        transfer_data: {
            destination: hostStripeAccountId,
            amount: hostPayout,
        },
        metadata: {
            booking_id: bookingId,
            platform_fee: platformFee.toString(),
        },
    })

    return paymentIntent
}

// Process refund
export async function processRefund(
    paymentIntentId: string,
    amountYen?: number // Optional partial refund
) {
    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amountYen,
        reverse_transfer: true, // Also reverse the transfer to host
    })

    return refund
}
