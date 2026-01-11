'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// Sample listing data - in production would come from Supabase
const listingData = {
    id: '1',
    title: 'Design & English Power Lunch',
    description: "Let's grab a coffee and talk about design, architecture, or just life in Sendai. I can help with English conversation or give feedback on your portfolio. Casual and friendly!",
    price: 1500,
    duration: 30,
    categories: ['English', 'Design'],
    rating: 4.9,
    reviewCount: 12,
    host: {
        name: 'Adam',
        title: 'Architect & PhD Student',
        avatar: 'https://ui-avatars.com/api/?name=Adam+Raman&background=0D8ABC&color=fff'
    },
    area: 'Aoba-dori Area',
    venues: [
        { id: 'v1', name: 'Blue Leaf Cafe', type: 'Cafe', description: 'Quiet · 5 min walk from station', icon: 'fa-mug-hot', color: 'bg-blue-100 text-blue-600' },
        { id: 'v2', name: 'Kotodai Park', type: 'Park', description: 'Bring Bento · Outdoor', icon: 'fa-tree', color: 'bg-green-100 text-green-600' },
    ],
    image: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
}

const timeSlots = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM']

export default function ListingPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { t } = useTranslation()
    const [selectedVenue, setSelectedVenue] = useState(listingData.venues[0].id)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [isFavorited, setIsFavorited] = useState(false)
    const [bookingLoading, setBookingLoading] = useState(false)

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

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
                    src={listingData.image}
                    alt={listingData.title}
                    className="w-full h-full object-cover"
                />
                <button className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm hover:bg-white transition">
                    <i className="fa-solid fa-star text-yellow-400"></i> {listingData.rating} ({listingData.reviewCount} reviews)
                </button>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6 -mt-6 relative z-10">
                {/* Title & Host */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                        <h1 className="text-xl font-black leading-tight text-gray-900">{listingData.title}</h1>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-bold">¥{listingData.price.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400">per {listingData.duration} mins</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                        {listingData.categories.map(cat => (
                            <span key={cat} className={`text-[10px] font-bold px-2 py-0.5 rounded ${cat === 'English' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {cat}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center border-t border-gray-100 pt-4">
                        <img
                            src={listingData.host.avatar}
                            alt={listingData.host.name}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm mr-3"
                        />
                        <div>
                            <h3 className="font-bold text-sm text-gray-900">Hosted by {listingData.host.name}</h3>
                            <p className="text-xs text-gray-500">{listingData.host.title}</p>
                        </div>
                        <button className="ml-auto text-blue-600 text-xs font-bold border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-50">
                            View Profile
                        </button>
                    </div>
                </section>

                {/* Description */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-2">About this Lunch</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">{listingData.description}</p>
                </section>

                {/* Location */}
                <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-3">Meeting Area</h2>
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 mb-3 bg-gray-100">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <i className="fa-solid fa-location-dot text-3xl text-gray-400"></i>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-[10px] font-bold shadow">
                            {listingData.area}
                        </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Meeting Venue</h3>
                    <div className="space-y-3">
                        {listingData.venues.map(venue => (
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
                        ))}
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
                        <span className="text-lg font-black text-gray-900">¥{listingData.price.toLocaleString()}</span>
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
