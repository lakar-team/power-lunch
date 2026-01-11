'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { listingData } from '@/lib/mock-data'

function CheckoutContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)

    // Get booking details from URL
    const listingId = searchParams.get('listing')
    const dateStr = searchParams.get('date')
    const time = searchParams.get('time')
    const venueId = searchParams.get('venue')

    const date = dateStr ? new Date(dateStr) : new Date()
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    const total = listingData.price * 1.1 // 10% fee
    const fee = listingData.price * 0.1

    const handlePay = () => {
        setLoading(true)
        // Simulate API call
        setTimeout(() => {
            router.push(`/ticket/booking-${Math.floor(Math.random() * 10000)}`)
        }, 1500)
    }

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
                    <img src={listingData.image} className="w-16 h-16 rounded-lg object-cover" alt="Listing" />
                    <div className="flex-1">
                        <h2 className="text-sm font-bold text-gray-900 leading-tight">{listingData.title}</h2>
                        <p className="text-xs text-gray-500 mt-1">{formattedDate}, {time}</p>
                        <div className="flex items-center mt-1">
                            <i className="fa-solid fa-star text-yellow-400 text-[10px] mr-1"></i>
                            <span className="text-[10px] font-bold text-gray-600">{listingData.rating} ({listingData.reviewCount})</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                        <span className="text-sm font-black">¥{listingData.price.toLocaleString()}</span>
                    </div>
                </section>

                {/* Payment Method */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Method</h3>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border border-blue-500 bg-blue-50 rounded-lg cursor-pointer">
                            <div className="flex items-center">
                                <i className="fa-brands fa-apple text-xl mr-3"></i>
                                <span className="text-sm font-bold">Apple Pay</span>
                            </div>
                            <div className="w-5 h-5 rounded-full border-4 border-blue-500 bg-white"></div>
                        </label>
                        <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer opacity-50">
                            <div className="flex items-center">
                                <i className="fa-regular fa-credit-card text-xl mr-3 text-gray-400"></i>
                                <span className="text-sm font-bold text-gray-400">Credit Card **** 4242</span>
                            </div>
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                        </label>
                    </div>
                </section>

                {/* Price Breakdown */}
                <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Price Details</h3>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Lunch Session ({listingData.duration}m)</span>
                        <span className="font-bold">¥{listingData.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Service Fee (10%)</span>
                        <span className="font-bold">¥{fee.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-100 my-2 pt-2 flex justify-between text-lg font-black">
                        <span>Total</span>
                        <span>¥{total.toLocaleString()}</span>
                    </div>
                </section>

                <p className="text-[10px] text-gray-400 text-center px-4">
                    By selecting the button below, you agree to the Host's House Rules and the Guest Refund Policy.
                </p>
            </div>

            {/* Pay Button */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-50">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handlePay}
                        disabled={loading}
                        className="block w-full bg-black text-white text-center py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transform transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : `Confirm & Pay ¥${total.toLocaleString()}`}
                    </button>
                </div>
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
