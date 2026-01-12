'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { getBookings } from '@/lib/api/bookings'
import { Booking } from '@/lib/types/supabase'

export default function ProfilePage() {
    const router = useRouter()
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<'guest' | 'host'>('guest')
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [guestBookings, setGuestBookings] = useState<Booking[]>([])
    const [hostBookings, setHostBookings] = useState<Booking[]>([])
    const [bookingsLoading, setBookingsLoading] = useState(false)

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login?redirect=/profile')
                return
            }
            setUser(user)
            setLoading(false)
        }
        getUser()
    }, [router])

    // Fetch bookings when tab changes
    useEffect(() => {
        async function fetchBookings() {
            if (!user) return

            setBookingsLoading(true)
            const { bookings, error } = await getBookings({ role: activeTab })

            if (!error && bookings) {
                if (activeTab === 'guest') {
                    setGuestBookings(bookings)
                } else {
                    setHostBookings(bookings)
                }
            }

            setBookingsLoading(false)
        }

        fetchBookings()
    }, [activeTab, user])

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const currentBookings = activeTab === 'guest' ? guestBookings : hostBookings

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header / Profile Summary */}
            <header className="bg-white px-6 pt-4 pb-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="pl-logo">POWER<span>LUNCH</span>.</Link>
                    <div className="flex items-center space-x-3">
                        <LanguageToggle />
                        <button onClick={() => router.push('/settings')} className="text-gray-400 hover:text-black">
                            <i className="fa-solid fa-gear text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold border-4 border-white shadow-md">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="ml-4">
                        <h2 className="text-lg font-bold">{user.user_metadata?.full_name || 'User'}</h2>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex items-center mt-1 text-xs">
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold"><i className="fa-solid fa-seedling mr-1"></i>{t('profile.newMember')}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white px-6 border-b border-gray-200 sticky top-0 z-20">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('guest')}
                        className={`py-3 text-sm font-bold transition-colors ${activeTab === 'guest' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {t('nav.myPlans')}
                    </button>
                    <button
                        onClick={() => setActiveTab('host')}
                        className={`py-3 text-sm font-bold transition-colors ${activeTab === 'host' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {t('profile.hosting')}
                    </button>
                    <button
                        onClick={() => router.push('/wallet')}
                        className="py-3 text-sm font-bold text-gray-400 hover:text-gray-600"
                    >
                        {t('profile.wallet')}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-md mx-auto p-4 min-h-[60vh]">

                {bookingsLoading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">{t('profile.loadingBookings')}</p>
                    </div>
                ) : (
                    <>
                        {/* GUEST VIEW */}
                        {activeTab === 'guest' && (
                            <div className="space-y-4 animate-fade-in-up">
                                {currentBookings.length === 0 ? (
                                    <div className="text-center py-10 opacity-75">
                                        <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <i className="fa-regular fa-calendar-plus text-3xl text-gray-300"></i>
                                        </div>
                                        <p className="text-sm font-bold text-gray-500">{t('profile.noPlans')}</p>
                                        <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">{t('profile.findHost')}</p>
                                        <Link href="/search" className="mt-4 bg-black text-white text-xs font-bold px-6 py-3 rounded-full inline-block shadow-lg hover:bg-gray-800 transition">
                                            {t('profile.findSession')}
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{t('profile.upcoming')}</h2>
                                        {currentBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').map(booking => (
                                            <div key={booking.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                                                <div className="relative z-10">
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
                                                    <div className="flex items-center mb-4">
                                                        <img
                                                            src={booking.host?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.host?.profile?.full_name || 'Host')}&background=0D8ABC&color=fff`}
                                                            className="w-12 h-12 rounded-full border-2 border-white shadow-sm mr-4"
                                                            alt="Host"
                                                        />
                                                        <div>
                                                            <h3 className="font-bold text-lg leading-tight line-clamp-1">{booking.listing?.title || 'Session'}</h3>
                                                            <p className="text-xs text-gray-500">with {booking.host?.profile?.full_name || 'Host'}</p>
                                                        </div>
                                                    </div>
                                                    <Link href={`/ticket/${booking.id}`} className="w-full bg-gray-50 text-gray-900 border border-gray-200 py-3 rounded-xl font-bold text-sm hover:bg-black hover:text-white hover:border-black transition flex justify-center items-center">
                                                        View Ticket
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Past bookings */}
                                        {currentBookings.filter(b => b.status === 'completed').length > 0 && (
                                            <>
                                                <div className="py-4 mt-2">
                                                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Past History</span>
                                                </div>
                                                {currentBookings.filter(b => b.status === 'completed').map(booking => (
                                                    <div key={booking.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 opacity-60 hover:opacity-100 transition">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 mr-3 font-bold text-xs">
                                                                    <i className="fa-solid fa-check"></i>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-sm text-gray-600">{booking.listing?.title || 'Session'}</h3>
                                                                    <p className="text-[10px] text-gray-400">{formatDate(booking.booking_date)}</p>
                                                                </div>
                                                            </div>
                                                            <Link href={`/listing/${booking.listing_id}`} className="text-xs font-bold text-blue-600 hover:underline">
                                                                Rebook
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* HOST VIEW */}
                        {activeTab === 'host' && (
                            <div className="space-y-4 animate-fade-in-up">
                                {/* Earnings Card */}
                                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 text-white shadow-lg">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Balance</h3>
                                    <div className="flex justify-between items-end">
                                        <span className="text-3xl font-bold">¥0</span>
                                        <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-[10px] font-bold transition">
                                            Cash Out
                                        </button>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-white/10 flex text-[10px] text-gray-400">
                                        <span className="mr-3"><i className="fa-solid fa-arrow-up mr-1 text-green-400"></i> ¥0 this week</span>
                                    </div>
                                </div>

                                {currentBookings.length === 0 ? (
                                    <>
                                        <div className="flex justify-between items-end px-1 mt-6">
                                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Upcoming Sessions</h2>
                                        </div>
                                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                                            <p className="text-sm text-gray-400 font-bold">No upcoming sessions</p>
                                            <Link href="/host/onboard" className="mt-2 inline-block text-xs text-black underline font-bold">
                                                Become a Host
                                            </Link>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-end px-1 mt-6">
                                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Upcoming Sessions</h2>
                                        </div>
                                        {currentBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').map(booking => (
                                            <div key={booking.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">
                                                            {formatDate(booking.booking_date)} at {booking.start_time}
                                                        </span>
                                                        <h3 className="font-bold text-lg mt-2">{booking.listing?.title || 'Session'}</h3>
                                                        <p className="text-xs text-gray-500">with {booking.guest?.full_name || 'Guest'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2 mt-4">
                                                    <Link href={`/host/sessions/${booking.id}`} className="flex-1 bg-gray-900 text-white text-xs font-bold py-2 rounded-lg text-center hover:bg-black transition">
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
