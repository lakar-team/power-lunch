```javascript
'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { getListing } from '@/lib/api/listings'
import { createBooking } from '@/lib/api/bookings'
import { Listing } from '@/lib/types/supabase'

// Initialize Stripe outside component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Payment Form Component (runs inside Elements context)
function CheckoutForm({ total, bookingId }: { total: number, bookingId: string }) {
    const stripe = useStripe()
    const elements = useElements()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setIsLoading(true)

        // Confirm payment with Stripe
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Redirect to ticket page on success
                return_url: `${ window.location.origin } /ticket/${ bookingId } `,
            },
        })

        // This only runs if there's an error (store status in your DB otherwise)
        if (error) {
            setMessage(error.message || 'An unexpected error occurred.')
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            
            {message && <div className="text-red-500 text-sm mt-4">{message}</div>}

            {/* Pay Button */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-50">
                <div className="max-w-md mx-auto">
                    <button
                        type="submit"
                        disabled={isLoading || !stripe || !elements}
                        className="block w-full bg-black text-white text-center py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transform transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : `Confirm & Pay ¥${ total.toLocaleString() } `}
                    </button>
                    <p className="text-[10px] text-gray-400 text-center mt-2">
                        By confirming, you agree to the Host's House Rules.
                    </p>
                </div>
            </div>
        </form>
    )
}

function CheckoutContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useTranslation()
    
    const [listing, setListing] = useState<Listing | null>(null)
    const [loading, setLoading] = useState(true)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [bookingId, setBookingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Get booking details from URL
    const listingId = searchParams.get('listing')
    const dateStr = searchParams.get('date')
    const time = searchParams.get('time')
    const venueId = searchParams.get('venue')

    useEffect(() => {
        async function initializeCheckout() {
            if (!listingId || !dateStr || !time || !venueId) {
                setError('Missing booking details')
                setLoading(false)
                return
            }

            // 1. Fetch Listing Details
            const { listing: listingData, error: listingError } = await getListing(listingId)
            
            if (listingError || !listingData) {
                setError(listingError || 'Listing not found')
                setLoading(false)
                return
            }
            
            setListing(listingData)

            // 2. Create Pending Booking & Payment Intent
            // (Only if we haven't already - simplistic check for ref consistency)
            if (!clientSecret) {
                const bookingData = {
                    listing_id: listingId,
                    booking_date: dateStr.split('T')[0], // Extract YYYY-MM-DD
                    start_time: time,
                    venue_selected: venueId,
                    guest_note: ''
                }

                const { payment, booking, error: bookingError } = await createBooking(bookingData)

                if (bookingError || !payment) {
                    setError(bookingError || 'Failed to initialize payment')
                    setLoading(false)
                    return
                }

                setClientSecret(payment.clientSecret)
                setBookingId(booking.id)
            }
            
            setLoading(false)
        }

        initializeCheckout()
    }, [listingId, dateStr, time, venueId])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-500">Preparing secure checkout...</p>
                </div>
            </div>
        )
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center max-w-md w-full bg-white p-8 rounded-xl shadow-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-circle-exclamation text-red-500 text-2xl"></i>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Checkout Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => router.back()} className="pl-btn pl-btn-secondary">
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    const date = new Date(dateStr!)
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const total = listing.price_yen * 1.15 // 15% platform fee (approximated, should match server)
    const fee = listing.price_yen * 0.15

    // Get venue name
    const venueName = listing.venue_options?.find((v: any) => v.id === venueId)?.name || 'Selected Venue'

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center space-x-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-black transition">
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </button>
                    <Link href="/" className="pl-logo text-sm">POWER<span>LUNCH</span>.</Link>
                </div>
                <LanguageToggle />
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">

                {/* Order Summary */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex space-x-4">
                    <img 
                      src={listing.cover_image_url || '/placeholder.jpg'} 
                      className="w-16 h-16 rounded-lg object-cover" 
                      alt="Listing" 
                    />
                    <div className="flex-1">
                        <h2 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{listing.title}</h2>
                        <p className="text-xs text-gray-500 mt-1">{formattedDate}, {time}</p>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">{venueName}</p>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                        <span className="text-sm font-black">¥{listing.price_yen.toLocaleString()}</span>
                    </div>
                </section>

                {/* Price Breakdown */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price Details</h3>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Lunch Session ({listing.duration_minutes}m)</span>
                        <span className="font-bold">¥{listing.price_yen.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Platform Fee (15%)</span>
                        <span className="font-bold">¥{Math.round(fee).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-lg font-black">
                        <span>Total</span>
                        <span>¥{Math.round(total).toLocaleString()}</span>
                    </div>
                </section>

                {/* Secure Payment */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                        <i className="fa-solid fa-lock text-green-500 mr-2"></i>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Secure Payment</h3>
                    </div>
                    
                    {clientSecret && bookingId ? (
                        <Elements stripe={stripePromise} options={{ 
                            clientSecret, 
                            appearance: { theme: 'stripe' } 
                        }}>
                            <CheckoutForm total={Math.round(total)} bookingId={bookingId} />
                        </Elements>
                    ) : (
                         <div className="text-center py-4">
                            <p className="text-sm text-gray-500">Initializing payment gateway...</p>
                         </div>
                    )}
                </section>

            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    )
}
