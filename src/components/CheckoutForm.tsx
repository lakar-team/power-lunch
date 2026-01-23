'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js'
import { useTranslation } from '@/lib/i18n/translations'

// Initialize Stripe (public key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface CheckoutFormProps {
    clientSecret: string
    bookingId: string
    amountYen: number
    onSuccess?: () => void
    onError?: (error: string) => void
}

// Inner form component (must be inside Elements provider)
function PaymentForm({
    bookingId,
    amountYen,
    onSuccess,
    onError,
}: Omit<CheckoutFormProps, 'clientSecret'>) {
    const { t } = useTranslation()
    const stripe = useStripe()
    const elements = useElements()
    const [isProcessing, setIsProcessing] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsProcessing(true)
        setMessage(null)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/bookings/${bookingId}/confirmed`,
            },
            redirect: 'if_required',
        })

        if (error) {
            setMessage(error.message || 'Payment failed. Please try again.')
            onError?.(error.message || 'Payment failed')
            setIsProcessing(false)
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            setMessage('Payment successful!')
            onSuccess?.()
        } else {
            setIsProcessing(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="checkout-form">
            <div className="checkout-header">
                <h3>{t('payment') || 'Payment'}</h3>
                <p className="checkout-amount">
                    ¥{amountYen.toLocaleString()}
                </p>
            </div>

            <div className="payment-element-container">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
            </div>

            {message && (
                <div className={`checkout-message ${message.includes('successful') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="checkout-button"
            >
                {isProcessing ? (
                    <span className="loading-spinner" />
                ) : (
                    <>
                        {t('payNow') || 'Pay Now'} ¥{amountYen.toLocaleString()}
                    </>
                )}
            </button>

            <p className="checkout-secure-note">
                🔒 {t('securePayment') || 'Secure payment powered by Stripe'}
            </p>

            <style jsx>{`
                .checkout-form {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    max-width: 400px;
                    margin: 0 auto;
                }

                .checkout-header {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .checkout-header h3 {
                    margin: 0 0 8px 0;
                    font-size: 1.25rem;
                    color: #1a1a1a;
                }

                .checkout-amount {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #2563eb;
                    margin: 0;
                }

                .payment-element-container {
                    margin-bottom: 24px;
                }

                .checkout-message {
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    text-align: center;
                    font-size: 0.875rem;
                }

                .checkout-message.success {
                    background: #dcfce7;
                    color: #166534;
                }

                .checkout-message.error {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .checkout-button {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .checkout-button:hover:not(:disabled) {
                    background: linear-gradient(135deg, #1d4ed8, #1e40af);
                    transform: translateY(-1px);
                }

                .checkout-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .loading-spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .checkout-secure-note {
                    text-align: center;
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin: 16px 0 0 0;
                }
            `}</style>
        </form>
    )
}

// Main exported component with Elements wrapper
export default function CheckoutForm({
    clientSecret,
    bookingId,
    amountYen,
    onSuccess,
    onError,
}: CheckoutFormProps) {
    const appearance = {
        theme: 'stripe' as const,
        variables: {
            colorPrimary: '#2563eb',
            borderRadius: '8px',
        },
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance,
            }}
        >
            <PaymentForm
                bookingId={bookingId}
                amountYen={amountYen}
                onSuccess={onSuccess}
                onError={onError}
            />
        </Elements>
    )
}
