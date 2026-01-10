import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/client'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createServerClient()

    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent

            // Update booking status to confirmed
            const { error } = await supabase
                .from('bookings' as any)
                // @ts-ignore - Supabase types mismatch
                .update({ status: 'confirmed' })
                .eq('stripe_payment_intent_id', paymentIntent.id)

            if (error) {
                console.error('Failed to update booking:', error)
            }

            // Update transaction status
            await supabase
                .from('transactions' as any)
                // @ts-ignore - Supabase types mismatch
                .update({ status: 'completed' })
                .eq('stripe_charge_id', paymentIntent.id)

            // TODO: Send confirmation email to guest and host

            break
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent

            // Update booking status to cancelled
            await supabase
                .from('bookings' as any)
                // @ts-ignore - Supabase types mismatch
                .update({ status: 'cancelled' })
                .eq('stripe_payment_intent_id', paymentIntent.id)

            // Update transaction status
            await supabase
                .from('transactions' as any)
                // @ts-ignore - Supabase types mismatch
                .update({ status: 'failed' })
                .eq('stripe_charge_id', paymentIntent.id)

            break
        }

        case 'account.updated': {
            const account = event.data.object as Stripe.Account

            // Update host verification status
            if (account.charges_enabled && account.payouts_enabled) {
                await supabase
                    .from('hosts' as any)
                    // @ts-ignore - Supabase types mismatch
                    .update({ is_verified: true })
                    .eq('stripe_account_id', account.id)
            }

            break
        }

        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge

            // Update transaction with refund info
            await supabase
                .from('transactions' as any)
                // @ts-ignore - Supabase types mismatch
                .update({
                    status: 'refunded',
                    refund_amount_yen: charge.amount_refunded,
                })
                .eq('stripe_charge_id', charge.payment_intent as string)

            // Update booking status
            await supabase
                .from('bookings' as any)
                // @ts-ignore - Supabase types mismatch
                .update({ status: 'cancelled' })
                .eq('stripe_payment_intent_id', charge.payment_intent as string)

            break
        }

        default:
            console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
}
