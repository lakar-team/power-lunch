'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'
import { getBookings } from '@/lib/api/bookings'
import { Booking } from '@/lib/types/supabase'

function DashboardContent() {
    const { t } = useTranslation()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [user, setUser] = useState<any>(null)
    const [host, setHost] = useState<any>(null)
    const [listings, setListings] = useState<any[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'listings'>('overview')

    // Check if onboarding just completed
    const onboardingComplete = searchParams.get('onboarding') === 'complete'

    useEffect(() => {
        async function loadDashboard() {
            // Check auth
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/auth/login?redirect=/host/dashboard')
                return
            }
            setUser(session.user)

            // Load host profile
            const { data: hostData } = await supabase
                .from('hosts')
                .select('*, profile:profiles(*)')
                .eq('user_id', session.user.id)
                .single()

            if (!hostData) {
                // Not a host yet, redirect to onboarding
                router.push('/host/onboard')
                return
            }
            setHost(hostData)

            // Load host's listings
            const { data: listingsData } = await supabase
                .from('listings')
                .select('*')
                .eq('host_id', hostData.id)
                .order('created_at', { ascending: false })

            setListings(listingsData || [])

            // Load host's bookings
            const { bookings: bookingsData } = await getBookings({ role: 'host' })
            setBookings(bookingsData || [])

            setLoading(false)
        }

        loadDashboard()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending')
    const totalEarnings = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.listing?.price_yen || 0) * 0.85, 0) // 85% after platform fee

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center sticky top-0 z-50">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
                <div className="flex items-center space-x-3">
                    <LanguageToggle />
                    <Link href="/profile" className="text-gray-500 hover:text-black">
                        <i className="fa-solid fa-user text-lg"></i>
                    </Link>
                </div>
            </header>

            {/* Onboarding Success Banner */}
            {onboardingComplete && (
                <div className="bg-green-500 text-white px-4 py-3 text-center">
                    <i className="fa-solid fa-check-circle mr-2"></i>
                    Stripe connected successfully! You're ready to start hosting.
                </div>
            )}

            {/* Dashboard Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black">Host Dashboard</h1>
                            <p className="text-gray-500">Welcome back, {host?.profile?.full_name || 'Host'}</p>
                        </div>
                        <Link
                            href="/host/listings/new"
                            className="pl-btn pl-btn-primary"
                        >
                            <i className="fa-solid fa-plus mr-2"></i>
                            New Listing
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Earnings</p>
                        <p className="text-2xl font-black">¥{totalEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Upcoming</p>
                        <p className="text-2xl font-black">{upcomingBookings.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Active Listings</p>
                        <p className="text-2xl font-black">{listings.filter(l => l.is_active).length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Rating</p>
                        <p className="text-2xl font-black">
                            {host?.rating_avg ? `${host.rating_avg.toFixed(1)} ⭐` : 'New'}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6">
                    {(['overview', 'bookings', 'listings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition ${activeTab === tab
                                ? 'bg-white shadow-sm text-black'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="font-bold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Link href="/host/listings/new" className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition">
                                    <i className="fa-solid fa-plus text-2xl text-blue-500 mb-2"></i>
                                    <p className="text-sm font-bold">New Listing</p>
                                </Link>
                                <button className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition">
                                    <i className="fa-solid fa-calendar text-2xl text-green-500 mb-2"></i>
                                    <p className="text-sm font-bold">Availability</p>
                                </button>
                                <button className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition">
                                    <i className="fa-solid fa-chart-simple text-2xl text-purple-500 mb-2"></i>
                                    <p className="text-sm font-bold">Analytics</p>
                                </button>
                                <button className="p-4 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition">
                                    <i className="fa-solid fa-gear text-2xl text-gray-500 mb-2"></i>
                                    <p className="text-sm font-bold">Settings</p>
                                </button>
                            </div>
                        </div>

                        {/* Recent Bookings */}
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Upcoming Sessions</h3>
                                <button onClick={() => setActiveTab('bookings')} className="text-sm text-blue-600 hover:underline">
                                    View all
                                </button>
                            </div>
                            {upcomingBookings.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <i className="fa-solid fa-calendar-xmark text-4xl mb-3"></i>
                                    <p>No upcoming sessions</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingBookings.slice(0, 3).map(booking => (
                                        <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                    <i className="fa-solid fa-user text-blue-600"></i>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{booking.listing?.title || 'Session'}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(booking.booking_date).toLocaleDateString()} at {booking.start_time}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${booking.status === 'confirmed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {bookings.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <i className="fa-solid fa-inbox text-5xl mb-4"></i>
                                <p className="font-bold mb-2">No bookings yet</p>
                                <p className="text-sm">Create a listing to start receiving bookings</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="p-4 hover:bg-gray-50 transition">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold">{booking.listing?.title || 'Session'}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(booking.booking_date).toLocaleDateString('en-US', {
                                                        weekday: 'short', month: 'short', day: 'numeric'
                                                    })} • {booking.start_time}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">¥{(booking.listing?.price_yen || 0).toLocaleString()}</p>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'listings' && (
                    <div className="space-y-4">
                        {listings.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-12">
                                <i className="fa-solid fa-store text-5xl text-gray-300 mb-4"></i>
                                <p className="font-bold mb-2">No listings yet</p>
                                <p className="text-sm text-gray-500 mb-6">Create your first listing to start hosting</p>
                                <Link href="/host/listings/new" className="pl-btn pl-btn-primary">
                                    <i className="fa-solid fa-plus mr-2"></i>
                                    Create Listing
                                </Link>
                            </div>
                        ) : (
                            listings.map(listing => (
                                <div key={listing.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <img
                                            src={listing.cover_image_url || 'https://via.placeholder.com/80'}
                                            className="w-16 h-16 rounded-lg object-cover mr-4"
                                            alt={listing.title}
                                        />
                                        <div>
                                            <p className="font-bold">{listing.title}</p>
                                            <p className="text-sm text-gray-500">¥{listing.price_yen?.toLocaleString()} • {listing.duration_minutes}min</p>
                                            <span className={`text-xs font-bold ${listing.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                                {listing.is_active ? '● Active' : '○ Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function HostDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <DashboardContent />
        </Suspense>
    )
}
