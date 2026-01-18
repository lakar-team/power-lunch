'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'

// Types
interface Venue {
    id: string
    name: string
    lat: number
    lng: number
}

interface WeeklySlot {
    day: number // 0 = Sunday, 6 = Saturday
    startTime: string
    endTime: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const durations = [30, 45, 60, 90]

export default function NewLocationPage() {
    const { t, language } = useTranslation()
    const router = useRouter()
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [host, setHost] = useState<any>(null)
    const [step, setStep] = useState(1)
    const [mapReady, setMapReady] = useState(false)

    // Step 1: Central Location
    const [name, setName] = useState('')
    const [centralLat, setCentralLat] = useState<number>(35.6762) // Default: Tokyo
    const [centralLng, setCentralLng] = useState<number>(139.6503)
    const [locationArea, setLocationArea] = useState('')
    const [isGeocodingLoading, setIsGeocodingLoading] = useState(false)

    // Step 2: Session Type & Venues
    const [sessionType, setSessionType] = useState<'in_person' | 'online' | 'both'>('both')
    const [meetLink, setMeetLink] = useState('')
    const [venues, setVenues] = useState<Venue[]>([])
    const [newVenueName, setNewVenueName] = useState('')
    const [isAddingVenue, setIsAddingVenue] = useState(false)
    const [tempVenueMarker, setTempVenueMarker] = useState<{ lat: number; lng: number } | null>(null)

    // Step 3: Pricing
    const [price, setPrice] = useState(1500)
    const [duration, setDuration] = useState(60)

    // Step 4: Availability
    const [validFrom, setValidFrom] = useState('')
    const [validUntil, setValidUntil] = useState('')
    const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([])
    const [blockedDates, setBlockedDates] = useState<string[]>([])

    // Reverse geocode function
    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        setIsGeocodingLoading(true)
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
                { headers: { 'Accept-Language': language } }
            )
            const data = await res.json()
            if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.county || ''
                const area = data.address.suburb || data.address.neighbourhood || data.address.district || ''
                const country = data.address.country || ''
                setLocationArea(area ? `${area}, ${city}` : city || country)
            }
        } catch (err) {
            console.error('Geocoding failed:', err)
        } finally {
            setIsGeocodingLoading(false)
        }
    }, [language])

    // Check host auth
    useEffect(() => {
        async function checkHost() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/auth/login?redirect=/host/locations/new')
                return
            }

            const { data: hostData } = await supabase
                .from('hosts')
                .select('id, stripe_account_id')
                .eq('user_id', session.user.id)
                .single()

            if (!hostData) {
                router.push('/host/onboard')
                return
            }

            setHost(hostData)
        }
        checkHost()
    }, [router])

    // Initialize map (only when step 1 is active)
    useEffect(() => {
        if (step !== 1 || !mapContainerRef.current || mapRef.current) return

        const initMap = async () => {
            try {
                // Load Leaflet CSS and JS
                if (!document.getElementById('leaflet-css')) {
                    const link = document.createElement('link')
                    link.id = 'leaflet-css'
                    link.rel = 'stylesheet'
                    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
                    document.head.appendChild(link)
                }

                if (!window.L) {
                    const script = document.createElement('script')
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
                    document.head.appendChild(script)
                    await new Promise((resolve) => {
                        script.onload = resolve
                    })
                } else {
                    // Slight delay to ensure CSS applies if it was just added
                    await new Promise(r => setTimeout(r, 100))
                }

                const L = window.L

                // Fix default icon issues in Next.js
                delete (L.Icon.Default.prototype as any)._getIconUrl
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                })

                const map = L.map(mapContainerRef.current!, {
                    zoomControl: false, // We'll add it manually or leave it off for cleaner look
                    attributionControl: false
                }).setView([centralLat, centralLng], 13)

                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 20
                }).addTo(map)

                // Central marker
                const marker = L.marker([centralLat, centralLng], {
                    draggable: true
                }).addTo(map)

                // Update state on drag end
                marker.on('dragend', () => {
                    const { lat, lng } = marker.getLatLng()
                    setCentralLat(lat)
                    setCentralLng(lng)
                    reverseGeocode(lat, lng)
                    map.panTo([lat, lng])
                })

                // Click to move marker
                map.on('click', (e: any) => {
                    const { lat, lng } = e.latlng
                    marker.setLatLng([lat, lng])
                    setCentralLat(lat)
                    setCentralLng(lng)
                    reverseGeocode(lat, lng)
                    map.panTo([lat, lng])
                })

                mapRef.current = map
                setMapReady(true)

                // Initial geocode
                reverseGeocode(centralLat, centralLng)

                // Invalid size check after brief delay
                setTimeout(() => {
                    map.invalidateSize()
                }, 250)

            } catch (error) {
                console.error('Error initializing map:', error)
                setError('Failed to load map. Please refresh the page.')
            }
        }

        initMap()

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [step, centralLat, centralLng, reverseGeocode])

    // Calculate distance between two points (Haversine formula)
    const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLng = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Add venue
    const addVenue = () => {
        if (!tempVenueMarker || !newVenueName.trim()) return

        const distance = getDistanceKm(centralLat, centralLng, tempVenueMarker.lat, tempVenueMarker.lng)
        if (distance > 3) {
            setError('Venue must be within 3km of central location')
            return
        }

        setVenues([...venues, {
            id: `venue_${Date.now()}`,
            name: newVenueName.trim(),
            lat: tempVenueMarker.lat,
            lng: tempVenueMarker.lng,
        }])
        setNewVenueName('')
        setTempVenueMarker(null)
        setIsAddingVenue(false)
        setError(null)
    }

    // Remove venue
    const removeVenue = (id: string) => {
        setVenues(venues.filter(v => v.id !== id))
    }

    // Toggle weekly slot
    const toggleSlot = (day: number, time: string) => {
        const existing = weeklySlots.find(s => s.day === day && s.startTime === time)
        if (existing) {
            setWeeklySlots(weeklySlots.filter(s => !(s.day === day && s.startTime === time)))
        } else {
            setWeeklySlots([...weeklySlots, {
                day,
                startTime: time,
                endTime: `${parseInt(time) + 1}:00`,
            }])
        }
    }

    // Check if slot is selected
    const isSlotSelected = (day: number, time: string): boolean => {
        return weeklySlots.some(s => s.day === day && s.startTime === time)
    }

    // Generate dates between validFrom and validUntil
    const generateDateRange = (): string[] => {
        if (!validFrom || !validUntil) return []
        const dates: string[] = []
        const start = new Date(validFrom)
        const end = new Date(validUntil)
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0])
        }
        return dates
    }

    // Toggle blocked date
    const toggleBlockedDate = (date: string) => {
        if (blockedDates.includes(date)) {
            setBlockedDates(blockedDates.filter(d => d !== date))
        } else {
            setBlockedDates([...blockedDates, date])
        }
    }

    // Check if date should be available based on weekly slots
    const isDateAvailable = (dateStr: string): boolean => {
        const date = new Date(dateStr)
        const dayOfWeek = date.getDay()
        return weeklySlots.some(s => s.day === dayOfWeek)
    }

    // Submit
    const handleSubmit = async () => {
        if (!host) return

        setLoading(true)
        setError(null)

        try {
            const venueOptions = sessionType === 'online' ? [] : venues

            const res = await fetch('/api/host-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host_id: host.id,
                    name,
                    location_area: sessionType === 'online' ? 'Online' : locationArea,
                    location_lat: sessionType === 'online' ? null : centralLat,
                    location_lng: sessionType === 'online' ? null : centralLng,
                    session_type: sessionType,
                    meet_link: sessionType !== 'in_person' ? meetLink : null,
                    venue_options: venueOptions,
                    price_yen: price,
                    duration_minutes: duration,
                    availability: {
                        valid_from: validFrom || null,
                        valid_until: validUntil || null,
                        weekly: weeklySlots,
                    },
                    blocked_dates: blockedDates,
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create location')
            }

            router.push('/profile?tab=host')
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    if (!host) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center">
                    <Link href="/host/dashboard" className="text-gray-500 hover:text-black mr-4">
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </Link>
                    <span className="font-bold">Add Location</span>
                </div>
                <LanguageToggle />
            </header>

            {/* Progress */}
            <div className="bg-white border-b border-gray-100 px-4 py-3">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">Step {step} of 4</span>
                        <span className="text-sm text-gray-400">
                            {step === 1 ? 'Location' : step === 2 ? 'Session & Venues' : step === 3 ? 'Pricing' : 'Schedule'}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-black transition-all duration-300"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Step 1: Central Location */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">Set Your Location</h2>
                            <p className="text-gray-500">Drag the pin or click on the map to set your central area.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Event/Lesson Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Tokyo Sessions, Sendai Lunches"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                        </div>

                        {/* Map Container */}
                        <div className="relative">
                            <div className="relative">
                                <div
                                    ref={mapContainerRef}
                                    className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
                                    style={{ minHeight: '256px' }}
                                />
                                {!mapReady && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
                                        <div className="text-gray-500">
                                            <i className="fa-solid fa-map-location-dot mr-2 animate-pulse"></i>
                                            Loading map...
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-3 left-3 bg-white px-3 py-2 rounded-lg shadow text-sm">
                                <i className="fa-solid fa-location-dot mr-2 text-black"></i>
                                {isGeocodingLoading ? (
                                    <span className="text-gray-400">Detecting...</span>
                                ) : (
                                    <span className="font-medium">{locationArea || 'Click or drag to set'}</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Area (auto-detected)
                            </label>
                            <input
                                type="text"
                                value={locationArea}
                                onChange={(e) => setLocationArea(e.target.value)}
                                placeholder="Will be filled automatically"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">Edit if the auto-detection isn't accurate</p>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!name || !locationArea}
                            className="w-full pl-btn pl-btn-primary disabled:opacity-50"
                        >
                            Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                )}

                {/* Step 2: Session Type & Venues */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">How Will You Meet?</h2>
                            <p className="text-gray-500">Choose meeting type and add venue options.</p>
                        </div>

                        {/* Session Type Selection */}
                        <div className="space-y-3">
                            {[
                                { type: 'in_person', icon: 'fa-utensils', color: 'bg-green-100 text-green-600', label: 'In-Person Only', desc: 'Meet at a cafe or restaurant' },
                                { type: 'online', icon: 'fa-video', color: 'bg-blue-100 text-blue-600', label: 'Online Only', desc: 'Connect via video call' },
                                { type: 'both', icon: 'fa-people-arrows', color: 'bg-purple-100 text-purple-600', label: 'Both Options', desc: 'Let guests choose' },
                            ].map(opt => (
                                <button
                                    key={opt.type}
                                    onClick={() => setSessionType(opt.type as typeof sessionType)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center ${sessionType === opt.type ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className={`w-12 h-12 ${opt.color} rounded-xl flex items-center justify-center mr-4`}>
                                        <i className={`fa-solid ${opt.icon} text-xl`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold">{opt.label}</p>
                                        <p className="text-sm text-gray-500">{opt.desc}</p>
                                    </div>
                                    {sessionType === opt.type && <i className="fa-solid fa-check text-green-500"></i>}
                                </button>
                            ))}
                        </div>

                        {/* Meet Link for online */}
                        {(sessionType === 'online' || sessionType === 'both') && (
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <i className="fa-brands fa-google mr-2"></i>Video Call Link
                                </label>
                                <input
                                    type="url"
                                    value={meetLink}
                                    onChange={(e) => setMeetLink(e.target.value)}
                                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {/* Venue Options for in-person */}
                        {(sessionType === 'in_person' || sessionType === 'both') && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Venue Options (up to 3)
                                    <span className="font-normal text-gray-400 ml-2">within 3km</span>
                                </label>

                                {/* Existing venues */}
                                <div className="space-y-2 mb-3">
                                    {venues.map((venue, idx) => (
                                        <div key={venue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-3 text-sm font-bold">
                                                    {idx + 1}
                                                </div>
                                                <span className="font-medium">{venue.name}</span>
                                            </div>
                                            <button onClick={() => removeVenue(venue.id)} className="text-red-500 hover:text-red-700">
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add venue */}
                                {venues.length < 3 && (
                                    isAddingVenue ? (
                                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 space-y-3">
                                            <input
                                                type="text"
                                                value={newVenueName}
                                                onChange={(e) => setNewVenueName(e.target.value)}
                                                placeholder="Venue name (e.g., Starbucks Shibuya)"
                                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                autoFocus
                                            />
                                            <p className="text-xs text-gray-500">
                                                <i className="fa-solid fa-info-circle mr-1"></i>
                                                For now, venues share the central location. Map pin selection coming soon!
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (newVenueName.trim()) {
                                                            setVenues([...venues, {
                                                                id: `venue_${Date.now()}`,
                                                                name: newVenueName.trim(),
                                                                lat: centralLat,
                                                                lng: centralLng,
                                                            }])
                                                            setNewVenueName('')
                                                            setIsAddingVenue(false)
                                                        }
                                                    }}
                                                    disabled={!newVenueName.trim()}
                                                    className="flex-1 py-2 bg-black text-white rounded-lg font-bold disabled:opacity-50"
                                                >
                                                    Add Venue
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsAddingVenue(false)
                                                        setNewVenueName('')
                                                    }}
                                                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsAddingVenue(true)}
                                            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 transition"
                                        >
                                            <i className="fa-solid fa-plus mr-2"></i>
                                            Add Venue Option
                                        </button>
                                    )
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(1)} className="pl-btn pl-btn-secondary">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={(sessionType !== 'online' && venues.length === 0) || ((sessionType === 'online' || sessionType === 'both') && !meetLink)}
                                className="pl-btn pl-btn-primary disabled:opacity-50"
                            >
                                Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Pricing */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">Set Your Price</h2>
                            <p className="text-gray-500">Choose a fair price for your time.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Price (¥)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">¥</span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    min={500}
                                    max={10000}
                                    step={100}
                                    className="w-full p-4 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-2xl font-bold"
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>Min ¥500</span>
                                <span>You'll receive ¥{Math.round(price * 0.85).toLocaleString()} after 15% fee</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
                            <div className="grid grid-cols-4 gap-2">
                                {durations.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        className={`py-3 rounded-xl font-bold transition ${duration === d ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        {d}min
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(2)} className="pl-btn pl-btn-secondary">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back
                            </button>
                            <button onClick={() => setStep(4)} className="pl-btn pl-btn-primary">
                                Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Availability Schedule */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">Set Your Availability</h2>
                            <p className="text-gray-500">Choose when you're available to host.</p>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={validFrom}
                                    onChange={(e) => setValidFrom(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Weekly Schedule Grid */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                                Weekly Schedule
                                <span className="font-normal text-gray-400 ml-2">(click to toggle)</span>
                            </label>
                            <div className="overflow-x-auto">
                                <div className="inline-grid gap-1" style={{ gridTemplateColumns: 'auto repeat(7, 1fr)' }}>
                                    {/* Header row */}
                                    <div></div>
                                    {DAYS.map((day, idx) => (
                                        <div key={day} className="text-center text-xs font-bold text-gray-500 py-2 min-w-[40px]">
                                            {day}
                                        </div>
                                    ))}

                                    {/* Time rows */}
                                    {TIME_SLOTS.map(time => (
                                        <>
                                            <div key={`label-${time}`} className="text-xs text-gray-400 py-2 pr-2 text-right">
                                                {time}
                                            </div>
                                            {DAYS.map((_, dayIdx) => (
                                                <button
                                                    key={`${dayIdx}-${time}`}
                                                    onClick={() => toggleSlot(dayIdx, time)}
                                                    className={`w-10 h-10 rounded-lg transition ${isSlotSelected(dayIdx, time)
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {isSlotSelected(dayIdx, time) && <i className="fa-solid fa-check text-xs"></i>}
                                                </button>
                                            ))}
                                        </>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Blocked Dates (simplified) */}
                        {validFrom && validUntil && weeklySlots.length > 0 && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Block Specific Dates
                                    <span className="font-normal text-gray-400 ml-2">(click to toggle off)</span>
                                </label>
                                <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {generateDateRange().filter(d => isDateAvailable(d)).slice(0, 30).map(date => (
                                            <button
                                                key={date}
                                                onClick={() => toggleBlockedDate(date)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${blockedDates.includes(date)
                                                    ? 'bg-red-100 text-red-700 line-through'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}
                                            >
                                                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </button>
                                        ))}
                                    </div>
                                    {generateDateRange().filter(d => isDateAvailable(d)).length > 30 && (
                                        <p className="text-xs text-gray-400 mt-2">Showing first 30 available dates</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(3)} className="pl-btn pl-btn-secondary">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || weeklySlots.length === 0}
                                className="pl-btn pl-btn-success disabled:opacity-50"
                            >
                                {loading ? (
                                    <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Creating...</>
                                ) : (
                                    <><i className="fa-solid fa-check mr-2"></i>Create Location</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
