'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getListing } from '@/lib/api/listings'
import { Listing } from '@/lib/types/supabase'

const timeSlots = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM']

export default function ListingPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { t } = useTranslation()

    // Data state
    const [listing, setListing] = useState<Listing | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // UI state
    const [selectedVenue, setSelectedVenue] = useState<string>('')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [isFavorited, setIsFavorited] = useState(false)
    const [bookingLoading, setBookingLoading] = useState(false)

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    // Fetch listing data
    useEffect(() => {
        async function fetchListing() {
            setLoading(true)
            const { listing: data, error: fetchError } = await getListing(params.id)

            if (fetchError) {
                setError(fetchError)
                setLoading(false)
                return
            }

            if (data) {
                setListing(data)
                // Set default venue if available
                if (data.venue_options && data.venue_options.length > 0) {
                    setSelectedVenue(data.venue_options[0].id)
                }
            }

            setLoading(false)
        }

        fetchListing()
    }, [params.id])

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const today = new Date()

        const days: (number | null)[] = []

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            days.push(null)
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day)
        }

        return { days, year, month, today }
    }

    const { days, year, month, today } = generateCalendarDays()

    const handleDayClick = (day: number) => {
        const date = new Date(year, month, day)
        if (date >= today || date.toDateString() === today.toDateString()) {
            setSelectedDate(date)
        }
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: 'Power Lunch', url: window.location.href })
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied!')
        }
    }

    const handleBook = async () => {
        if (!selectedDate || !selectedTime) {
            alert('Please select a date and time')
            return
        }

        setBookingLoading(true)
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            // Redirect to login with return URL
            const returnUrl = encodeURIComponent(`/listing/${params.id}?date=${selectedDate.toISOString()}&time=${selectedTime}&venue=${selectedVenue}`)
            router.push(`/auth/login?redirect=${returnUrl}`)
            return
        }

        // Go to checkout if authenticated
        router.push(`/checkout?listing=${params.id}&date=${selectedDate.toISOString()}&time=${selectedTime}&venue=${selectedVenue}`)
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading listing...</p>
                </div>
            </div>
        )
    }

    // Error state  
    if (error || !listing) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-exclamation-triangle text-red-500 text-2xl"></i>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || 'This listing may have been removed or is no longer available.'}</p>
                    <Link href="/search" className="pl-btn pl-btn-primary inline-block">
                        Browse Other Sessions
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center space-x-4">
                    <Link href="/search" className="text-gray-500 hover:text-black transition">
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </Link>
                    <Link href="/" className="pl-logo text-sm">
                        POWER<span>LUNCH</span>.
                    </Link>
                </div>
                <div className="flex items-center space-x-3">
                    <LanguageToggle />
                    <i
                        onClick={handleShare}
                        className="fa-regular fa-share-from-square text-gray-500 cursor-pointer hover:text-black transition"
                    ></i>
                    <i
                        onClick={() => setIsFavorited(!isFavorited)}
                        className={`cursor-pointer transition ${isFavorited ? 'fa-solid fa-heart text-red-500' : 'fa-regular fa-heart text-gray-500 hover:text-red-500'}`}
                    ></i>
                </div>
            </div>

            {/* Hero Image */}
            <div className="relative w-full h-64 bg-gray-200">
                <img
                    src={listing.cover_image_url || '/images/default-listing.jpg'}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                />
                <button className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm hover:bg-white transition">
                    <i className="fa-solid fa-star text-yellow-400"></i> {listing.host?.rating_avg?.toFixed(1) || '5.0'} ({listing.host?.total_sessions || 0} sessions)
                </button>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6 -mt-6 relative z-10">
                {/* Title & Host */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                        <h1 className="text-xl font-black leading-tight text-gray-900">{listing.title}</h1>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-bold">¥{listing.price_yen.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400">per {listing.duration_minutes} mins</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {listing.category}
                        </span>
                    </div>

                    <div className="flex items-center border-t border-gray-100 pt-4">
                        <img
                            src={listing.host?.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.host?.profile?.full_name || 'Host')}&background=0D8ABC&color=fff`}
                            alt={listing.host?.profile?.full_name || 'Host'}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm mr-3"
                        />
                        <div>
                            <h3 className="font-bold text-sm text-gray-900">Hosted by {listing.host?.profile?.full_name || 'Host'}</h3>
                            <p className="text-xs text-gray-500">{listing.host?.bio || 'Power Lunch Host'}</p>
                        </div>
                        <button className="ml-auto text-blue-600 text-xs font-bold border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-50">
                            View Profile
                        </button>
                    </div>
                </section>

                {/* Description */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-2">About this Lunch</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">{listing.description || 'No description available.'}</p>
                </section>

                {/* Location */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-3">Meeting Area</h2>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 mb-3 bg-gray-100">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fa-solid fa-location-dot text-3xl text-gray-400"></i>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-[10px] font-bold shadow">
                            {listing.location_area || 'Location TBD'}
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Meeting Venue</h3>
                    <div className="space-y-3">
                        {listing.venue_options && listing.venue_options.length > 0 ? listing.venue_options.map(venue => (
                            <label
                                key={venue.id}
                                className={`flex items-center p-3 rounded-xl cursor-pointer transition ${selectedVenue === venue.id
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="venue"
                                    value={venue.id}
                                    checked={selectedVenue === venue.id}
                                    onChange={() => setSelectedVenue(venue.id)}
                                    className="mr-3 w-5 h-5 text-blue-600"
                                />
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${venue.color}`}>
                                    <i className={`fa-solid ${venue.icon}`}></i>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800">{venue.name}</div>
                                    <div className="text-xs text-gray-500">{venue.type} · {venue.description}</div>
                                </div>
                            </label>
                        )) : (
                            <p className="text-sm text-gray-500">Venue to be determined with host</p>
                        )}
                    </div>
                </section>

                {/* Schedule Picker */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-3">Select Date & Time</h2>

                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setCurrentMonth(new Date(year, month - 1))}
                            className="text-gray-400 hover:text-black p-2"
                        >
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <span className="font-bold text-sm">{months[month]} {year}</span>
                        <button
                            onClick={() => setCurrentMonth(new Date(year, month + 1))}
                            className="text-gray-400 hover:text-black p-2"
                        >
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-4">
                        {daysOfWeek.map(d => (
                            <span key={d} className="text-[10px] text-gray-400 font-bold">{d}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {days.map((day, i) => {
                            if (day === null) return <span key={i}></span>

                            const date = new Date(year, month, day)
                            const isPast = date < today && date.toDateString() !== today.toDateString()
                            const isSelected = selectedDate?.toDateString() === date.toDateString()

                            return (
                                <span
                                    key={i}
                                    onClick={() => !isPast && handleDayClick(day)}
                                    className={`py-2 rounded-lg cursor-pointer transition ${isPast ? 'text-gray-300 cursor-not-allowed' :
                                        isSelected ? 'bg-black text-white font-bold' :
                                            'hover:bg-blue-100 font-medium'
                                        }`}
                                >
                                    {day}
                                </span>
                            )
                        })}
                    </div>

                    {/* Time Slots */}
                    {selectedDate && (
                        <div className="mt-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Times</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {timeSlots.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={`py-2 rounded-lg text-xs font-bold transition ${selectedTime === time
                                            ? 'bg-black text-white border-black'
                                            : 'bg-gray-50 border border-gray-200 hover:bg-black hover:text-white hover:border-black'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selection Display */}
                    {selectedDate && selectedTime && (
                        <p className="text-center text-xs text-blue-600 font-bold mt-3">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedTime}
                        </p>
                    )}
                </section>
            </div>

            {/* Booking Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-bold">Total</span>
                        <span className="text-lg font-black text-gray-900">¥{listing.price_yen.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={handleBook}
                        disabled={bookingLoading}
                        className="pl-btn pl-btn-primary min-w-[140px]"
                    >
                        {bookingLoading ? 'Checking...' : 'Book Ticket'}
                    </button>
                </div>
            </div>
        </div>
    )
}
