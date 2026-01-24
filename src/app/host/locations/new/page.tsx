'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'

// Declare Leaflet on window for TypeScript
declare global {
    interface Window {
        L: any
    }
}

// Types
interface Venue {
    id: string
    name: string
    lat: number
    lng: number
}

interface WeeklySlot {
    day: number
    startTime: string
    endTime: string
}

// Constants
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const VENUE_RADIUS_KM = 1.0
const VENUE_RADIUS_METERS = VENUE_RADIUS_KM * 1000

const CURRENCIES = [
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.0067 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.0062 },
]

export default function CreateEventWizard() {
    const { t, language } = useTranslation()
    const router = useRouter()
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const radiusCircleRef = useRef<any>(null)
    const venueMarkersRef = useRef<Map<string, any>>(new Map())

    // Wizard state
    const [step, setStep] = useState(1)
    const [host, setHost] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [leafletLoaded, setLeafletLoaded] = useState(false)
    const [mapReady, setMapReady] = useState(false)

    // Step 1: Concept
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    // Step 2: Scope (Location)
    const [centralLat, setCentralLat] = useState<number | null>(null)
    const [centralLng, setCentralLng] = useState<number | null>(null)
    const [locationArea, setLocationArea] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [useManualLocation, setUseManualLocation] = useState(false)

    // Step 3: Venues
    const [venues, setVenues] = useState<Venue[]>([])

    // Step 4: Format
    const [format, setFormat] = useState<'in_person' | 'online' | 'hybrid'>('in_person')
    const [meetLink, setMeetLink] = useState('')

    // Step 5: Logistics
    const [currency, setCurrency] = useState('JPY')
    const [priceInCurrency, setPriceInCurrency] = useState(1500)
    const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([])
    const [isDragging, setIsDragging] = useState(false)

    const TOTAL_STEPS = 5
    const stepTitles = [
        'The Concept',
        'The Scope',
        'Venue Spots',
        'Format',
        'Logistics'
    ]

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

    // Load Leaflet
    useEffect(() => {
        if (typeof window === 'undefined') return

        if (!document.getElementById('leaflet-css-wizard')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css-wizard'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }

        if (!(window as any).L) {
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            script.onload = () => setLeafletLoaded(true)
            document.head.appendChild(script)
        } else {
            setLeafletLoaded(true)
        }
    }, [])

    // Reverse geocode
    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
                { headers: { 'Accept-Language': language } }
            )
            const data = await res.json()
            if (data.address) {
                const city = data.address.city || data.address.town || data.address.county || ''
                const area = data.address.suburb || data.address.neighbourhood || ''
                setLocationArea(area ? `${area}, ${city}` : city)
            }
        } catch (err) {
            console.error('Geocoding failed:', err)
        }
    }, [language])

    // Search location
    const searchLocation = async () => {
        if (!searchQuery.trim()) return
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
            )
            const data = await res.json()
            if (data[0]) {
                const lat = parseFloat(data[0].lat)
                const lng = parseFloat(data[0].lon)
                setCentralLat(lat)
                setCentralLng(lng)
                if (mapRef.current) {
                    mapRef.current.setView([lat, lng], 14)
                    if (radiusCircleRef.current) {
                        radiusCircleRef.current.setLatLng([lat, lng])
                    }
                }
                reverseGeocode(lat, lng)
            }
        } catch (err) {
            console.error('Search failed:', err)
        }
    }

    // Initialize map for Step 2
    useEffect(() => {
        if (!leafletLoaded || step !== 2 || !mapContainerRef.current || mapRef.current) return

        const L = (window as any).L
        if (!L) return

        // Fix icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        const defaultLat = centralLat || 35.6762
        const defaultLng = centralLng || 139.6503

        const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14)

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map)

        // Create radius circle
        const circle = L.circle([defaultLat, defaultLng], {
            radius: VENUE_RADIUS_METERS,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '8, 8'
        }).addTo(map)

        radiusCircleRef.current = circle

        // Click to set location
        map.on('click', (e: any) => {
            const { lat, lng } = e.latlng
            setCentralLat(lat)
            setCentralLng(lng)
            circle.setLatLng([lat, lng])
            reverseGeocode(lat, lng)
        })

        mapRef.current = map
        setMapReady(true)

        if (!centralLat) {
            setCentralLat(defaultLat)
            setCentralLng(defaultLng)
            reverseGeocode(defaultLat, defaultLng)
        }

        setTimeout(() => map.invalidateSize(), 100)
        setTimeout(() => map.invalidateSize(), 500) // Double tap for insurance
    }, [leafletLoaded, step, centralLat, centralLng, reverseGeocode])

    // Invalidate map size on step change
    useEffect(() => {
        if ((step === 2 || step === 3) && mapRef.current) {
            setTimeout(() => mapRef.current.invalidateSize(), 100)
            setTimeout(() => mapRef.current.invalidateSize(), 300)
        }
    }, [step])

    // Distance helper
    const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLng = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    // Step 3: Handle venue click on map
    useEffect(() => {
        if (step !== 3 || !mapRef.current) return

        const map = mapRef.current
        const L = (window as any).L

        map.off('click')
        map.on('click', (e: any) => {
            if (!centralLat || !centralLng) return
            const { lat, lng } = e.latlng
            const distance = getDistanceKm(centralLat, centralLng, lat, lng)

            if (distance > VENUE_RADIUS_KM) {
                setError('Click inside the blue circle')
                setTimeout(() => setError(null), 2000)
                return
            }

            if (venues.length >= 3) {
                setError('Maximum 3 venues')
                setTimeout(() => setError(null), 2000)
                return
            }

            const newVenue: Venue = {
                id: `venue_${Date.now()}`,
                name: '',
                lat,
                lng
            }
            setVenues(prev => [...prev, newVenue])
        })
    }, [step, centralLat, centralLng, venues.length])

    // Update venue markers
    useEffect(() => {
        if (step !== 3) return
        const L = (window as any).L
        const map = mapRef.current
        if (!L || !map) return

        // Clear old
        venueMarkersRef.current.forEach(marker => map.removeLayer(marker))
        venueMarkersRef.current.clear()

        // Add new
        venues.forEach((venue, idx) => {
            const icon = L.divIcon({
                className: 'venue-marker',
                html: `<div style="
                    width:32px;height:32px;
                    background:linear-gradient(135deg,#3b82f6,#1d4ed8);
                    border:3px solid white;border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    color:white;font-weight:bold;font-size:14px;
                    box-shadow:0 2px 8px rgba(0,0,0,0.3);
                ">${idx + 1}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            })

            const marker = L.marker([venue.lat, venue.lng], { icon }).addTo(map)
            venueMarkersRef.current.set(venue.id, marker)
        })
    }, [step, venues])

    // Toggle weekly slot (paint mode)
    const handleSlotInteraction = (day: number, time: string) => {
        const existing = weeklySlots.find(s => s.day === day && s.startTime === time)
        if (existing) {
            setWeeklySlots(weeklySlots.filter(s => !(s.day === day && s.startTime === time)))
        } else {
            setWeeklySlots([...weeklySlots, { day, startTime: time, endTime: `${parseInt(time) + 1}:00` }])
        }
    }

    const isSlotSelected = (day: number, time: string) => weeklySlots.some(s => s.day === day && s.startTime === time)

    // Convert price to JPY for storage
    const getPriceInYen = () => {
        const curr = CURRENCIES.find(c => c.code === currency)
        if (!curr || currency === 'JPY') return priceInCurrency
        return Math.round(priceInCurrency / curr.rate)
    }

    // Validation
    const canProceed = () => {
        switch (step) {
            case 1: return title.trim().length > 0
            case 2: return useManualLocation ? locationArea.trim().length > 0 : (centralLat !== null && locationArea.length > 0)
            case 3: return format === 'online' || (venues.length > 0 && venues.every(v => v.name.trim()))
            case 4: return format === 'online' ? meetLink.trim().length > 0 : true
            case 5: return priceInCurrency > 0 && weeklySlots.length > 0
            default: return false
        }
    }

    // Submit
    const handleSubmit = async () => {
        if (!host) return
        setLoading(true)
        setError(null)

        try {
            const venueOptions = format === 'online' ? [] : venues.map(v => ({
                id: v.id, name: v.name, lat: v.lat, lng: v.lng
            }))

            const res = await fetch('/api/host-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host_id: host.id,
                    name: title,
                    description,
                    location_area: format === 'online' ? 'Online' : locationArea,
                    location_lat: format === 'online' ? null : centralLat,
                    location_lng: format === 'online' ? null : centralLng,
                    session_type: format,
                    meet_link: format !== 'in_person' ? meetLink : null,
                    venue_options: venueOptions,
                    price_yen: getPriceInYen(),
                    duration_minutes: 60,
                    availability: { weekly: weeklySlots },
                    blocked_dates: [],
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create event')
            }

            router.push('/profile?tab=host')
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    if (!host) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b px-4 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center">
                    <Link href="/profile?tab=host" className="text-gray-500 hover:text-black mr-4">
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </Link>
                    <span className="font-bold">Create Event</span>
                </div>
                <LanguageToggle />
            </header>

            {/* Progress */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">Step {step} of {TOTAL_STEPS}</span>
                        <span className="text-sm text-gray-400">{stepTitles[step - 1]}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-black transition-all duration-500"
                            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="max-w-2xl mx-auto px-4 mt-4">
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
                </div>
            )}

            {/* Step Content */}
            <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
                {/* Step 1: Concept */}
                {step === 1 && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center">
                            <h1 className="text-3xl font-black mb-2">What's your Power Lunch about?</h1>
                            <p className="text-gray-500">Give it a name that captures the vibe</p>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Tokyo Coffee Sessions"
                            className="w-full text-2xl font-bold text-center border-0 border-b-2 border-gray-200 focus:border-black py-4 bg-transparent outline-none transition"
                        />
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">Description (optional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Tell guests what to expect..."
                                rows={4}
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Scope */}
                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="text-center">
                            <h1 className="text-3xl font-black mb-2">Where's the general area?</h1>
                            <p className="text-gray-500">Click on the map to set your 1km radius</p>
                        </div>

                        {/* Manual Toggle */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => setUseManualLocation(!useManualLocation)}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                {useManualLocation ? 'Use map instead' : 'Map not working? Enter location manually'}
                            </button>
                        </div>

                        {/* Search or Manual Entry */}
                        {!useManualLocation ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && searchLocation()}
                                    placeholder="Search for a location..."
                                    className="flex-1 p-3 border border-gray-200 rounded-xl"
                                />
                                <button onClick={searchLocation} className="px-4 bg-black text-white rounded-xl">
                                    <i className="fa-solid fa-search"></i>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={locationArea}
                                    onChange={e => setLocationArea(e.target.value)}
                                    placeholder="Enter area name (e.g. Shibuya, Tokyo)"
                                    className="w-full p-3 border border-gray-200 rounded-xl font-bold"
                                />
                                <p className="text-xs text-gray-400">Note: Manual entry won't show a pin on the main map until we verify it.</p>
                            </div>
                        )}

                        {/* Map (hidden if manual) */}
                        {!useManualLocation && (
                            <div className="relative">
                                <div
                                    ref={mapContainerRef}
                                    className="w-full h-96 rounded-xl overflow-hidden border border-gray-200"
                                />
                                {!mapReady && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
                                        <span className="text-gray-400">Loading map...</span>
                                    </div>
                                )}
                                {locationArea && (
                                    <div className="absolute top-3 left-3 bg-white px-3 py-2 rounded-lg shadow text-sm font-medium">
                                        <i className="fa-solid fa-location-dot mr-2"></i>{locationArea}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Venues */}
                {step === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="text-center">
                            <h1 className="text-3xl font-black mb-2">Drop your meetup spots</h1>
                            <p className="text-gray-500">Click inside the circle to add venues (max 3)</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Map */}
                            <div
                                ref={step === 3 && !mapRef.current ? mapContainerRef : undefined}
                                className="h-80 rounded-xl overflow-hidden border border-gray-200"
                            />

                            {/* Venue List */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-sm text-gray-500">Selected Venues ({venues.length}/3)</h3>
                                {venues.length === 0 ? (
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400">
                                        <i className="fa-solid fa-map-pin text-2xl mb-2"></i>
                                        <p>Click on the map to add venues</p>
                                    </div>
                                ) : (
                                    venues.map((venue, idx) => (
                                        <div key={venue.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border">
                                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                                                {idx + 1}
                                            </div>
                                            <input
                                                type="text"
                                                value={venue.name}
                                                onChange={e => setVenues(venues.map(v => v.id === venue.id ? { ...v, name: e.target.value } : v))}
                                                placeholder="Venue name"
                                                className="flex-1 p-2 border border-gray-200 rounded-lg"
                                            />
                                            <button
                                                onClick={() => setVenues(venues.filter(v => v.id !== venue.id))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Format */}
                {step === 4 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="text-center">
                            <h1 className="text-3xl font-black mb-2">How will you meet?</h1>
                            <p className="text-gray-500">Choose your session format</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { key: 'in_person', icon: 'fa-coffee', label: 'In-Person Only', desc: 'Meet at your venues' },
                                { key: 'online', icon: 'fa-video', label: 'Online Only', desc: 'Video call only' },
                                { key: 'hybrid', icon: 'fa-globe', label: 'Hybrid', desc: 'Both options' },
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setFormat(opt.key as any)}
                                    className={`p-6 rounded-2xl border-2 text-center transition-all ${format === opt.key
                                        ? 'border-black bg-black text-white'
                                        : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    <i className={`fa-solid ${opt.icon} text-3xl mb-3`}></i>
                                    <p className="font-bold">{opt.label}</p>
                                    <p className={`text-sm ${format === opt.key ? 'text-gray-300' : 'text-gray-400'}`}>{opt.desc}</p>
                                </button>
                            ))}
                        </div>

                        {format !== 'in_person' && (
                            <div className="mt-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <i className="fa-brands fa-google mr-2"></i>Google Meet Link
                                </label>
                                <input
                                    type="url"
                                    value={meetLink}
                                    onChange={e => setMeetLink(e.target.value)}
                                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                    className="w-full p-4 border border-gray-200 rounded-xl"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Logistics */}
                {step === 5 && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="text-center">
                            <h1 className="text-3xl font-black mb-2">Set your price & schedule</h1>
                            <p className="text-gray-500">When are you available?</p>
                        </div>

                        {/* Price */}
                        <div className="bg-white rounded-2xl p-6 border">
                            <label className="block text-sm font-bold text-gray-500 mb-4">Session Price</label>
                            <div className="flex items-center gap-4">
                                <select
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    className="p-3 border border-gray-200 rounded-xl font-bold"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={priceInCurrency}
                                    onChange={e => setPriceInCurrency(parseInt(e.target.value) || 0)}
                                    className="flex-1 text-3xl font-bold p-3 border border-gray-200 rounded-xl text-center"
                                />
                            </div>
                            {currency !== 'JPY' && (
                                <p className="text-sm text-gray-400 mt-2 text-center">
                                    ≈ ¥{getPriceInYen().toLocaleString()} JPY
                                </p>
                            )}
                        </div>

                        {/* Schedule Grid */}
                        <div className="bg-white rounded-2xl p-6 border">
                            <label className="block text-sm font-bold text-gray-500 mb-4">Weekly Availability</label>
                            <p className="text-xs text-gray-400 mb-4">Click or drag to paint your available times</p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr>
                                            <th className="p-2"></th>
                                            {DAYS.map(day => (
                                                <th key={day} className="p-2 font-bold text-gray-600">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {TIME_SLOTS.map(time => (
                                            <tr key={time}>
                                                <td className="p-2 text-gray-400 text-xs">{time}</td>
                                                {DAYS.map((_, dayIdx) => (
                                                    <td key={dayIdx} className="p-1">
                                                        <button
                                                            onMouseDown={() => { setIsDragging(true); handleSlotInteraction(dayIdx, time) }}
                                                            onMouseEnter={() => isDragging && handleSlotInteraction(dayIdx, time)}
                                                            onMouseUp={() => setIsDragging(false)}
                                                            className={`w-full h-8 rounded transition-all ${isSlotSelected(dayIdx, time)
                                                                ? 'bg-blue-500'
                                                                : 'bg-gray-100 hover:bg-gray-200'
                                                                }`}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-400 mt-4 text-center">
                                {weeklySlots.length} time slots selected
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
                <div className="max-w-2xl mx-auto flex justify-between">
                    <button
                        onClick={() => setStep(s => Math.max(1, s - 1))}
                        className={`px-6 py-3 rounded-xl font-bold ${step === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                        disabled={step === 1}
                    >
                        Back
                    </button>

                    {step < TOTAL_STEPS ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canProceed()}
                            className="px-8 py-3 bg-black text-white rounded-xl font-bold disabled:opacity-30"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed() || loading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-30"
                        >
                            {loading ? 'Creating...' : 'Create Event'}
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
