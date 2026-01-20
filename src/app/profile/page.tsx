'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { useTranslation } from '@/lib/i18n/translations'
import { getBookings } from '@/lib/api/bookings'
import { Booking } from '@/lib/types/supabase'
import { supabase } from '@/lib/supabase/client'

import { useAuth } from '@/components/AuthProvider'
import Header from '@/components/Header'

// Types
interface HostPin {
    id: string
    title: string
    price_yen: number
    central_address?: string
    category?: string
}

interface StripeStatus {
    details_submitted: boolean
    charges_enabled: boolean
    payouts_enabled: boolean
    external_accounts: Array<{ type: string; last4: string; bank_name?: string }>
}

function ProfilePageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useTranslation()
    const { user, loading, signOut } = useAuth()

    // Tab state: 'profile' | 'plans' | 'hosting' | 'wallet'
    const [activeTab, setActiveTab] = useState<'profile' | 'plans' | 'hosting' | 'wallet'>('profile')

    // Bookings state (for plans tab)
    const [guestBookings, setGuestBookings] = useState<Booking[]>([])
    const [bookingsLoading, setBookingsLoading] = useState(false)

    // Edit Profile state
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
    const [location, setLocation] = useState('')
    const [savingProfile, setSavingProfile] = useState(false)
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Hosting state
    const [pins, setPins] = useState<HostPin[]>([])
    const [hostId, setHostId] = useState<string | null>(null)
    const [isHost, setIsHost] = useState(false)
    const [hostingLoading, setHostingLoading] = useState(false)

    // Wallet state
    const [hasStripe, setHasStripe] = useState(false)
    const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null)
    const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)
    const [connectingStripe, setConnectingStripe] = useState(false)
    const [walletLoading, setWalletLoading] = useState(false)

    // Handle ?tab= query param
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'host' || tab === 'hosting') {
            setActiveTab('hosting')
        } else if (tab === 'plans') {
            setActiveTab('plans')
        } else if (tab === 'wallet') {
            setActiveTab('wallet')
        } else if (tab === 'profile' || tab === 'edit') {
            setActiveTab('profile')
        }
    }, [searchParams])

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login?redirect=/profile')
        }
    }, [user, loading, router])

    // Load profile data when on profile tab
    useEffect(() => {
        async function loadProfile() {
            if (!user || activeTab !== 'profile') return

            setFullName(user.user_metadata?.full_name || '')

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileData) {
                setBio(profileData.bio || '')
                setLocation(profileData.location || '')
            }
        }
        loadProfile()
    }, [user, activeTab])

    // Fetch bookings when on plans tab
    useEffect(() => {
        async function fetchBookings() {
            if (!user || activeTab !== 'plans') return

            setBookingsLoading(true)
            const { bookings, error } = await getBookings({ role: 'guest' })

            if (!error && bookings) {
                setGuestBookings(bookings)
            }

            setBookingsLoading(false)
        }

        fetchBookings()
    }, [activeTab, user])

    // Fetch hosting data when on hosting tab
    useEffect(() => {
        async function fetchHostingData() {
            if (!user || activeTab !== 'hosting') return

            setHostingLoading(true)

            // Fetch host info
            const profilesRes = await fetch('/api/hosts/profiles', { credentials: 'include' })
            const profilesData = await profilesRes.json()

            setIsHost(profilesData.is_host || false)
            setHostId(profilesData.host_id || null)

            // Fetch pins if host
            if (profilesData.is_host && profilesData.host_id) {
                const pinsRes = await fetch(`/api/hosts/${profilesData.host_id}/listings`, { credentials: 'include' })
                if (pinsRes.ok) {
                    const pinsData = await pinsRes.json()
                    setPins(pinsData.listings || [])
                }
            }

            setHostingLoading(false)
        }

        fetchHostingData()
    }, [activeTab, user])

    // Fetch wallet data when on wallet tab
    useEffect(() => {
        async function fetchWalletData() {
            if (!user || activeTab !== 'wallet') return

            setWalletLoading(true)

            try {
                const res = await fetch('/api/hosts/wallet-setup', { credentials: 'include' })
                const data = await res.json()

                setIsHost(data.is_host || false)
                setHasStripe(data.has_stripe || false)
                setStripeStatus(data.stripe_status || null)
                setDashboardUrl(data.dashboard_url || null)
            } catch (e) {
                console.error('Failed to fetch wallet status:', e)
            }

            setWalletLoading(false)
        }

        fetchWalletData()
    }, [activeTab, user])

    // Save profile
    const handleSaveProfile = async () => {
        if (!user) return

        setSavingProfile(true)
        setProfileMessage(null)

        try {
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            if (authError) throw authError

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    bio,
                    location,
                    updated_at: new Date().toISOString()
                })

            if (profileError) throw profileError

            setProfileMessage({ type: 'success', text: 'Profile updated!' })
        } catch (err: any) {
            setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile' })
        } finally {
            setSavingProfile(false)
        }
    }

    // Connect Stripe
    const handleConnectStripe = async () => {
        setConnectingStripe(true)
        try {
            const res = await fetch('/api/hosts/wallet-setup', {
                method: 'POST',
                credentials: 'include',
            })
            const data = await res.json()
            if (res.ok && data.url) {
                window.location.href = data.url
            } else {
                alert(data.error || 'Failed to start wallet setup')
                setConnectingStripe(false)
            }
        } catch (err) {
            alert('Failed to connect to server')
            setConnectingStripe(false)
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
    }

    if (!user) {
        return null
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <Header />

            {/* Profile Summary */}
            <div className="bg-white px-6 pb-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-500">Profile</span>
                    <button onClick={() => router.push('/settings')} className="text-gray-400 hover:text-black">
                        <i className="fa-solid fa-gear text-lg"></i>
                    </button>
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
            </div>

            {/* 4 Tabs */}
            <div className="bg-white px-6 border-b border-gray-200 sticky top-0 z-20">
                <div className="flex space-x-4 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`py-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <i className="fa-solid fa-user-pen mr-1"></i> Edit Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`py-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'plans' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <i className="fa-solid fa-calendar mr-1"></i> {t('nav.myPlans')}
                    </button>
                    <button
                        onClick={() => setActiveTab('hosting')}
                        className={`py-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'hosting' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <i className="fa-solid fa-map-pin mr-1"></i> {t('profile.hosting')}
                    </button>
                    <button
                        onClick={() => setActiveTab('wallet')}
                        className={`py-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'wallet' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <i className="fa-solid fa-wallet mr-1"></i> {t('profile.wallet')}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-md mx-auto p-4 min-h-[60vh]">

                {/* TAB 1: Edit Profile */}
                {activeTab === 'profile' && (
                    <div className="space-y-4 animate-fade-in-up">
                        {profileMessage && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {profileMessage.text}
                            </div>
                        )}

                        {/* Profile Photo */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                            <div className="relative inline-block">
                                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-lg mx-auto">
                                    {fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <button className="absolute bottom-0 right-0 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition">
                                    <i className="fa-solid fa-camera text-sm"></i>
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">Tap to change photo</p>
                        </section>

                        {/* Basic Info */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Basic Information</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your full name"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g., Tokyo, Japan"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Bio */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">About You</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    maxLength={500}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
                            </div>
                        </section>

                        <button
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 shadow-lg"
                        >
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}

                {/* TAB 2: My Plans */}
                {activeTab === 'plans' && (
                    <div className="space-y-4 animate-fade-in-up">
                        {bookingsLoading ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                                <p className="text-sm text-gray-500">{t('profile.loadingBookings')}</p>
                            </div>
                        ) : guestBookings.length === 0 ? (
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
                                {guestBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').map(booking => (
                                    <div key={booking.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {formatDate(booking.booking_date)}
                                                </span>
                                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
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
                            </>
                        )}
                    </div>
                )}

                {/* TAB 3: Hosting (Simplified) */}
                {activeTab === 'hosting' && (
                    <div className="space-y-4 animate-fade-in-up">
                        {hostingLoading ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                            </div>
                        ) : !isHost ? (
                            <div className="text-center py-10">
                                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-handshake text-3xl text-gray-300"></i>
                                </div>
                                <p className="text-sm font-bold text-gray-500 mb-2">Not a host yet</p>
                                <p className="text-xs text-gray-400 mb-4 max-w-[200px] mx-auto">Create events and start earning on Power Lunch</p>
                                <Link
                                    href="/host/onboard"
                                    className="bg-black text-white text-sm font-bold px-6 py-3 rounded-full inline-block hover:bg-gray-800 transition shadow-lg"
                                >
                                    <i className="fa-solid fa-plus mr-2"></i>Become a Host
                                </Link>
                            </div>
                        ) : (
                            <>
                                {/* Create New Event Button */}
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">My Events</h2>
                                    <Link
                                        href="/host/locations/new"
                                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center"
                                    >
                                        <i className="fa-solid fa-plus mr-1"></i> New Event
                                    </Link>
                                </div>

                                {pins.length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <i className="fa-solid fa-map-pin text-gray-400"></i>
                                        </div>
                                        <p className="text-sm font-bold text-gray-600 mb-1">No events yet</p>
                                        <p className="text-xs text-gray-400 mb-4">Create an event to start accepting bookings</p>
                                        <Link
                                            href="/host/locations/new"
                                            className="bg-black text-white text-sm font-bold px-6 py-2 rounded-full inline-block hover:bg-gray-800 transition"
                                        >
                                            <i className="fa-solid fa-plus mr-2"></i>Create Event
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pins.map(pin => (
                                            <div key={pin.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                            <i className="fa-solid fa-map-pin"></i>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-sm">{pin.title}</h3>
                                                            <p className="text-xs text-gray-400">{pin.central_address || 'Location set'}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-green-600">¥{pin.price_yen?.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* TAB 4: Wallet */}
                {activeTab === 'wallet' && (
                    <div className="space-y-4 animate-fade-in-up">
                        {walletLoading ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                {/* Balance Card */}
                                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Balance</h3>
                                    <div className="flex justify-between items-end">
                                        <span className="text-4xl font-bold">¥0</span>
                                        <span className="text-xs text-gray-400">Available for payout</span>
                                    </div>
                                </div>

                                {/* Host Earnings */}
                                {isHost && (
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Host Earnings</h3>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-2xl font-bold text-green-600">¥0</p>
                                                <p className="text-xs text-gray-400">This Month</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-black">0</p>
                                                <p className="text-xs text-gray-400">Sessions</p>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-black">¥0</p>
                                                <p className="text-xs text-gray-400">All Time</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stripe Status */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <div className="text-center">
                                        {hasStripe && stripeStatus?.details_submitted ? (
                                            <>
                                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <i className="fa-solid fa-check text-3xl text-green-600"></i>
                                                </div>
                                                <h2 className="font-bold text-lg mb-2">Stripe Connected</h2>
                                                <p className="text-gray-500 text-sm mb-4">Your payout account is set up.</p>

                                                {stripeStatus.external_accounts.length > 0 && (
                                                    <div className="bg-gray-50 rounded-xl p-3 mb-4 text-left">
                                                        {stripeStatus.external_accounts.map((acc, i) => (
                                                            <div key={i} className="flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    <i className="fa-solid fa-building-columns text-gray-400 mr-3"></i>
                                                                    <div>
                                                                        <p className="text-sm font-medium">{acc.bank_name || 'Bank Account'}</p>
                                                                        <p className="text-xs text-gray-400">****{acc.last4}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-xs text-green-600 font-medium">Active</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex justify-center gap-2 mb-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stripeStatus.charges_enabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {stripeStatus.charges_enabled ? '✓ Charges' : '⏳ Pending'}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stripeStatus.payouts_enabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {stripeStatus.payouts_enabled ? '✓ Payouts' : '⏳ Pending'}
                                                    </span>
                                                </div>

                                                {dashboardUrl && (
                                                    <a
                                                        href={dashboardUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl inline-block hover:bg-gray-200 transition"
                                                    >
                                                        <i className="fa-solid fa-external-link mr-2"></i>Manage in Stripe
                                                    </a>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <i className="fa-brands fa-stripe text-3xl text-indigo-600"></i>
                                                </div>
                                                <h2 className="font-bold text-lg mb-2">Payout Method</h2>
                                                <p className="text-gray-500 text-sm mb-6">
                                                    {isHost ? 'Complete Stripe setup to receive payouts.' : 'Become a host to start earning.'}
                                                </p>

                                                {isHost ? (
                                                    <button
                                                        onClick={handleConnectStripe}
                                                        disabled={connectingStripe}
                                                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
                                                    >
                                                        {connectingStripe ? (
                                                            <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Connecting...</>
                                                        ) : (
                                                            <><i className="fa-solid fa-link mr-2"></i>Connect Stripe</>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href="/host/onboard"
                                                        className="w-full bg-black text-white font-bold py-3 rounded-xl inline-block hover:bg-gray-800 transition shadow-lg"
                                                    >
                                                        <i className="fa-solid fa-plus mr-2"></i>Become a Host
                                                    </Link>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Help */}
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <div className="flex items-start">
                                        <i className="fa-solid fa-circle-info text-blue-500 mt-1 mr-3"></i>
                                        <div>
                                            <p className="text-sm font-medium text-blue-700">How payouts work</p>
                                            <p className="text-xs text-blue-600 mt-1">
                                                After each session, earnings (minus 15% fee) are deposited within 2-7 days.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        }>
            <ProfilePageContent />
        </Suspense>
    )
}
