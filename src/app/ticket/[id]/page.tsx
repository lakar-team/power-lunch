'use client'

import Link from 'next/link'
import { LanguageToggle } from '@/lib/i18n/translations'
import { listingData } from '@/lib/mock-data'

export default function TicketPage({ params }: { params: { id: string } }) {
    return (
        <div className="bg-gray-100 font-sans text-gray-900 min-h-screen pb-24">
            {/* Success Banner */}
            <div className="bg-green-500 text-white p-6 shadow-md relative">
                <div className="flex justify-between items-center mb-3 relative z-10">
                    <div className="flex items-center">
                        <Link href="/" className="mr-4 text-white hover:text-green-100 transition">
                            <i className="fa-solid fa-arrow-left text-lg"></i>
                        </Link>
                        <Link href="/" className="pl-logo text-white text-sm font-black tracking-tighter">
                            POWER<span>LUNCH</span>.
                        </Link>
                    </div>
                    <LanguageToggle />
                </div>
                <div className="text-center pt-2">
                    <div className="animate-bounce inline-block mb-2"><i className="fa-solid fa-circle-check text-3xl"></i></div>
                    <h1 className="font-bold text-xl mb-1">Booking Confirmed!</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-6">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden relative">
                    <div className="p-6 border-b border-dashed border-gray-300 relative">
                        {/* Ticket Punches */}
                        <div className="absolute top-1/2 left-[-10px] w-5 h-5 bg-gray-100 rounded-full transform -translate-y-1/2"></div>
                        <div className="absolute top-1/2 right-[-10px] w-5 h-5 bg-gray-100 rounded-full transform -translate-y-1/2"></div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                                    Next Tuesday
                                </span>
                                <h2 className="text-xl font-black text-gray-800 mt-2 leading-tight">{listingData.title}</h2>
                                <p className="text-sm text-gray-500">with {listingData.host.name}</p>
                            </div>
                            <img src={listingData.host.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="Host" />
                        </div>

                        <div className="flex space-x-2 mb-4">
                            <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Time</p>
                                <p className="text-lg font-bold text-gray-900">12:15</p>
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Table</p>
                                <p className="text-sm font-bold text-gray-900 leading-tight pt-1">{listingData.venues[0].name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-3 rounded-xl transition">
                                <i className="fa-solid fa-message mr-2"></i> Message
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3 rounded-xl transition">
                                <i className="fa-solid fa-location-arrow mr-2"></i> Directions
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-xs text-gray-400 mb-3">Show this to host upon arrival</p>
                        <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${params.id}`} className="w-32 h-32 opacity-90" alt="QR Code" />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3">Order ID: #{params.id}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 space-y-3">
                    <button className="block w-full text-center py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm">
                        <i className="fa-solid fa-ban mr-2"></i> Cancel Booking
                    </button>
                    <button className="block w-full text-center py-3 rounded-xl font-bold border border-red-200 text-red-500 hover:bg-red-50 transition text-sm">
                        <i className="fa-solid fa-user-slash mr-2"></i> Host Didn't Show Up
                    </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-4">
                    Free cancellation until 24 hours before session.
                </p>
            </div>

            {/* Done Button */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-lg z-50">
                <div className="max-w-md mx-auto">
                    <Link href="/profile" className="block w-full pl-btn pl-btn-primary text-center">
                        View My Plans
                    </Link>
                </div>
            </div>
        </div>
    )
}
