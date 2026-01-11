'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { getBookings } from '@/lib/api/bookings'
import { Booking } from '@/lib/types/supabase'

export default function BookingsPage() {
    const router = useRouter()
    const { t } = useTranslation()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [bookingsLoading, setBookingsLoading] = useState(false)

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login?redirect=/bookings')
                return
            }
            setUser(user)
            setLoading(false)
        }
        getUser()
    }, [router])

    // Fetch guest bookings
    useEffect(() => {
        async function fetchBookings() {
            if (!user) return

            setBookingsLoading(true)
            const { bookings, error } = await getBookings({ role: 'guest' })

            if (!error && bookings) {
                setBookings(bookings)
            }

            setBookingsLoading(false)
        }

        fetchBookings()
    }, [user])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const upcomingBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled')
    const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')

    return (
        <div className="min-h-screen bg-gray-50 pb-24 text-black">
            {/* Header */}
            <header className="bg-white px-4 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-50">
                <Link href="/" className="pl-logo text-xl">POWER<span>LUNCH</span>.</Link>
                <div className="flex items-center space-x-3">
                    <LanguageToggle />
                </div>
            </header>

            <div className="max-w-md mx-auto p-4">
                <h1 className="text-2xl font-black mb-6">My Plans</h1>

                {bookingsLoading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading bookings...</p>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in-up">
                        {bookings.length === 0 ? (
                            <div className="text-center py-16 opacity-75">
                                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <i className="fa-regular fa-calendar-plus text-4xl text-gray-300"></i>
                                </div>
                                <h3 className="text-lg font-bold text-gray-700">No upcoming plans</h3>
                                <p className="text-sm text-gray-500 mt-2 max-w-[240px] mx-auto">
                                    Find a host nearby to learn something new or seek advice.
                                </p>
                                <Link href="/search" className="mt-6 bg-black text-white font-bold px-8 py-4 rounded-xl inline-block shadow-lg hover:bg-gray-800 transition">
                                    Browse Sessions
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Upcoming */}
                                {upcomingBookings.length > 0 && (
                                    <div className="space-y-4">
                                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Upcoming</h2>
                                        {upcomingBookings.map(booking => (
                                            <div key={booking.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {formatDate(booking.booking_date)}
                                                    </span>
                                                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {booking.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center mb-5">
                                                    <img
                                                        src={booking.host?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.host?.profile?.full_name || 'Host')}&background=0D8ABC&color=fff`}
                                                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm mr-4 object-cover "
                                                        alt="Host"
                                                    />
                                                    <div>
                                                        <h3 className="font-bold text-lg leading-tight line-clamp-1">{booking.listing?.title || 'Session'}</h3>
                                                        <p className="text-xs text-gray-500">with {booking.host?.profile?.full_name || 'Host'}</p>
                                                    </div>
                                                </div>
                                                <Link href={`/ticket/${booking.id}`} className="w-full bg-gray-50 text-gray-900 border border-gray-200 py-3 rounded-xl font-bold text-sm hover:bg-black hover:text-white hover:border-black transition flex justify-center items-center">
                                                    View Ticket & QR
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Past */}
                                {pastBookings.length > 0 && (
                                    <div className="space-y-4">
                                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">History</h2>
                                        {pastBookings.map(booking => (
                                            <div key={booking.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 opacity-80 hover:opacity-100 transition">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 font-bold text-xs ${booking.status === 'cancelled' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            <i className={`fa-solid ${booking.status === 'cancelled' ? 'fa-xmark' : 'fa-check'}`}></i>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-sm text-gray-700">{booking.listing?.title || 'Session'}</h3>
                                                            <p className="text-[10px] text-gray-400">{formatDate(booking.booking_date)} • {booking.status}</p>
                                                        </div>
                                                    </div>
                                                    <Link href={`/listing/${booking.listing_id}`} className="text-xs font-bold text-black border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                                                        Rebook
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
