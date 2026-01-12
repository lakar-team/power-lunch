'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'

const defaultVenues = [
    { id: 'host_choice', name: "Host's Choice", type: 'flexible', description: "I'll pick a great spot", icon: 'fa-location-dot', color: 'bg-blue-100 text-blue-600' },
    { id: 'guest_choice', name: "Guest's Choice", type: 'flexible', description: 'Guest picks the venue', icon: 'fa-user', color: 'bg-purple-100 text-purple-600' },
    { id: 'specific', name: 'Specific Location', type: 'fixed', description: 'Always meet here', icon: 'fa-map-pin', color: 'bg-green-100 text-green-600' },
]

const durations = [30, 45, 60, 90]

export default function NewLocationPage() {
    const { t } = useTranslation()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [host, setHost] = useState<any>(null)
    const [step, setStep] = useState(1)

    // Form data
    const [name, setName] = useState('')
    const [locationArea, setLocationArea] = useState('')
    const [sessionType, setSessionType] = useState<'in_person' | 'online' | 'both'>('both')
    const [meetLink, setMeetLink] = useState('')
    const [venueType, setVenueType] = useState('host_choice')
    const [specificLocation, setSpecificLocation] = useState('')
    const [price, setPrice] = useState(1500)
    const [duration, setDuration] = useState(60)
    const [dateStart, setDateStart] = useState('')
    const [dateEnd, setDateEnd] = useState('')
    const [isTemporary, setIsTemporary] = useState(false)

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

    const handleSubmit = async () => {
        if (!host) return

        setLoading(true)
        setError(null)

        try {
            const venueOptions = sessionType === 'online' ? [{
                id: 'online',
                name: 'Online Session',
                type: 'online',
                description: 'Video call via Google Meet',
                icon: 'fa-video',
                color: 'bg-blue-100 text-blue-600',
            }] : [{
                id: venueType,
                name: defaultVenues.find(v => v.id === venueType)?.name,
                type: defaultVenues.find(v => v.id === venueType)?.type,
                description: venueType === 'specific' ? specificLocation : defaultVenues.find(v => v.id === venueType)?.description,
                icon: defaultVenues.find(v => v.id === venueType)?.icon,
                color: defaultVenues.find(v => v.id === venueType)?.color,
            }]

            const res = await fetch('/api/host-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host_id: host.id,
                    name,
                    location_area: sessionType === 'online' ? 'Online' : locationArea,
                    location_lat: sessionType === 'online' ? null : 38.2682, // Default to Sendai
                    location_lng: sessionType === 'online' ? null : 140.8694,
                    session_type: sessionType,
                    meet_link: sessionType !== 'in_person' ? meetLink : null,
                    venue_options: venueOptions,
                    price_yen: price,
                    duration_minutes: duration,
                    date_start: isTemporary ? dateStart : null,
                    date_end: isTemporary ? dateEnd : null,
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create location')
            }

            router.push('/host/dashboard?location=created')
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
                    <span className="font-bold">Add Location Pin</span>
                </div>
                <LanguageToggle />
            </header>

            {/* Progress */}
            <div className="bg-white border-b border-gray-100 px-4 py-3">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">Step {step} of 3</span>
                        <span className="text-sm text-gray-400">
                            {step === 1 ? 'Location' : step === 2 ? 'Session Type' : 'Pricing'}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-black transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Step 1: Location Details */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">Where will you host?</h2>
                            <p className="text-gray-500">Give this location a name and area.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Location Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Tokyo Office, Sendai Base"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">This is for your reference only</p>
                        </div>

                        {/* Temporary Location Toggle */}
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <i className="fa-solid fa-plane text-blue-500 mr-3"></i>
                                    <div>
                                        <p className="font-medium">Temporary Location</p>
                                        <p className="text-xs text-gray-400">For travel or limited time availability</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isTemporary}
                                        onChange={(e) => setIsTemporary(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                        </div>

                        {isTemporary && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateStart}
                                        onChange={(e) => setDateStart(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateEnd}
                                        onChange={(e) => setDateEnd(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setStep(2)}
                            disabled={!name}
                            className="w-full pl-btn pl-btn-primary disabled:opacity-50"
                        >
                            Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                )}

                {/* Step 2: Session Type */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">How will you meet?</h2>
                            <p className="text-gray-500">Choose if you'll meet in person, online, or both.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => setSessionType('in_person')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center ${sessionType === 'in_person'
                                    ? 'border-black bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mr-4">
                                    <i className="fa-solid fa-utensils text-xl"></i>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">In-Person Only</p>
                                    <p className="text-sm text-gray-500">Meet at a cafe or restaurant</p>
                                </div>
                                {sessionType === 'in_person' && (
                                    <i className="fa-solid fa-check text-green-500"></i>
                                )}
                            </button>

                            <button
                                onClick={() => setSessionType('online')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center ${sessionType === 'online'
                                    ? 'border-black bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                                    <i className="fa-solid fa-video text-xl"></i>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">Online Only</p>
                                    <p className="text-sm text-gray-500">Connect via Google Meet</p>
                                </div>
                                {sessionType === 'online' && (
                                    <i className="fa-solid fa-check text-green-500"></i>
                                )}
                            </button>

                            <button
                                onClick={() => setSessionType('both')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center ${sessionType === 'both'
                                    ? 'border-black bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mr-4">
                                    <i className="fa-solid fa-people-arrows text-xl"></i>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">Both Options</p>
                                    <p className="text-sm text-gray-500">Let guests choose</p>
                                </div>
                                {sessionType === 'both' && (
                                    <i className="fa-solid fa-check text-green-500"></i>
                                )}
                            </button>
                        </div>

                        {/* Meet Link for online */}
                        {(sessionType === 'online' || sessionType === 'both') && (
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    <i className="fa-brands fa-google mr-2"></i>
                                    Google Meet Link
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

                        {/* Venue options for in-person */}
                        {(sessionType === 'in_person' || sessionType === 'both') && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Area
                                    </label>
                                    <input
                                        type="text"
                                        value={locationArea}
                                        onChange={(e) => setLocationArea(e.target.value)}
                                        placeholder="e.g., Shibuya, Tokyo"
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Venue Preference</label>
                                    <div className="space-y-2">
                                        {defaultVenues.map(venue => (
                                            <button
                                                key={venue.id}
                                                onClick={() => setVenueType(venue.id)}
                                                className={`w-full p-3 rounded-xl border-2 text-left transition flex items-center ${venueType === venue.id
                                                    ? 'border-black bg-gray-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 ${venue.color} rounded-lg flex items-center justify-center mr-3`}>
                                                    <i className={`fa-solid ${venue.icon}`}></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm">{venue.name}</p>
                                                    <p className="text-xs text-gray-500">{venue.description}</p>
                                                </div>
                                                {venueType === venue.id && (
                                                    <i className="fa-solid fa-check text-green-500"></i>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {venueType === 'specific' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Venue Name
                                        </label>
                                        <input
                                            type="text"
                                            value={specificLocation}
                                            onChange={(e) => setSpecificLocation(e.target.value)}
                                            placeholder="e.g., Starbucks Shibuya"
                                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(1)} className="pl-btn pl-btn-secondary">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={(sessionType !== 'online' && !locationArea) || ((sessionType === 'online' || sessionType === 'both') && !meetLink)}
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
                            <h2 className="text-2xl font-black mb-2">Set your price</h2>
                            <p className="text-gray-500">Choose a fair price for your time.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Price (¥)
                            </label>
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
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Duration
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {durations.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        className={`py-3 rounded-xl font-bold transition ${duration === d
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {d}min
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(2)} className="pl-btn pl-btn-secondary">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="pl-btn pl-btn-success disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check mr-2"></i>
                                        Create Location
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
