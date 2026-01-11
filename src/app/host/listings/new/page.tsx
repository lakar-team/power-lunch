'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'
import { createListing } from '@/lib/api/listings'

const categories = [
    { id: 'english', label: 'English Conversation', icon: 'fa-language', color: 'bg-blue-100 text-blue-600' },
    { id: 'tech', label: 'Tech & Programming', icon: 'fa-laptop-code', color: 'bg-purple-100 text-purple-600' },
    { id: 'design', label: 'Design & Creative', icon: 'fa-compass-drafting', color: 'bg-orange-100 text-orange-600' },
    { id: 'career', label: 'Career Advice', icon: 'fa-briefcase', color: 'bg-green-100 text-green-600' },
    { id: 'business', label: 'Business & Startup', icon: 'fa-chart-line', color: 'bg-red-100 text-red-600' },
    { id: 'language', label: 'Other Languages', icon: 'fa-globe', color: 'bg-teal-100 text-teal-600' },
]

const durations = [30, 45, 60, 90]

const defaultVenues = [
    { id: 'host_choice', name: "Host's Choice", type: 'flexible', description: 'I\'ll pick a great spot', icon: 'fa-location-dot', color: 'bg-blue-100 text-blue-600' },
    { id: 'guest_choice', name: "Guest's Choice", type: 'flexible', description: 'Guest picks the venue', icon: 'fa-user', color: 'bg-purple-100 text-purple-600' },
    { id: 'specific', name: 'Specific Location', type: 'fixed', description: 'Always meet here', icon: 'fa-map-pin', color: 'bg-green-100 text-green-600' },
]

export default function NewListingPage() {
    const { t } = useTranslation()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [host, setHost] = useState<any>(null)
    const [step, setStep] = useState(1)

    // Form data
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [price, setPrice] = useState(1500)
    const [duration, setDuration] = useState(60)
    const [venueType, setVenueType] = useState('host_choice')
    const [specificLocation, setSpecificLocation] = useState('')
    const [locationArea, setLocationArea] = useState('')

    useEffect(() => {
        async function checkHost() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/auth/login?redirect=/host/listings/new')
                return
            }

            // Check if user is a host
            const { data: hostData } = await supabase
                .from('hosts')
                .select('id, stripe_account_id, is_verified')
                .eq('user_id', session.user.id)
                .single()

            if (!hostData) {
                router.push('/host/onboard')
                return
            }

            if (!hostData.stripe_account_id) {
                router.push('/host/onboard?step=stripe')
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
            const listingData = {
                title,
                description,
                category,
                price_yen: price,
                duration_minutes: duration,
                location_area: locationArea || 'Sendai, Japan',
                venue_options: [
                    {
                        id: venueType,
                        name: defaultVenues.find(v => v.id === venueType)?.name,
                        type: defaultVenues.find(v => v.id === venueType)?.type,
                        description: venueType === 'specific' ? specificLocation : defaultVenues.find(v => v.id === venueType)?.description,
                        icon: defaultVenues.find(v => v.id === venueType)?.icon,
                        color: defaultVenues.find(v => v.id === venueType)?.color,
                    }
                ],
                // Default to Sendai coordinates (we can add location picker later)
                location_lat: 38.2682,
                location_lng: 140.8694,
            }

            const { listing, error: createError } = await createListing(listingData)

            if (createError) {
                throw new Error(createError)
            }

            // Success! Redirect to dashboard
            router.push('/host/dashboard?listing=created')
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
                    <span className="font-bold">Create Listing</span>
                </div>
                <LanguageToggle />
            </header>

            {/* Progress */}
            <div className="bg-white border-b border-gray-100 px-4 py-3">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold">Step {step} of 4</span>
                        <span className="text-sm text-gray-400">
                            {step === 1 ? 'Basics' : step === 2 ? 'Details' : step === 3 ? 'Pricing' : 'Location'}
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

            {/* Form */}
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Step 1: Category & Title */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">What do you want to teach?</h2>
                            <p className="text-gray-500">Choose a category that fits your expertise.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition ${category === cat.id
                                            ? 'border-black bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mb-2`}>
                                        <i className={`fa-solid ${cat.icon}`}></i>
                                    </div>
                                    <span className="font-bold text-sm">{cat.label}</span>
                                    {category === cat.id && (
                                        <i className="fa-solid fa-check ml-2 text-green-500"></i>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Session Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Python Code Review over Ramen"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!category || title.length < 5}
                            className="w-full pl-btn pl-btn-primary disabled:opacity-50"
                        >
                            Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                )}

                {/* Step 2: Description */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">Describe your session</h2>
                            <p className="text-gray-500">Help guests understand what they'll learn.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="In this session, we'll review your Python code together. I'll share best practices, help you debug issues, and answer any questions you have about software development..."
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                                rows={6}
                            />
                            <p className="text-xs text-gray-400 mt-1">{description.length}/1000 characters</p>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(1)} className="pl-btn pl-btn-secondary">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={description.length < 20}
                                className="pl-btn pl-btn-primary disabled:opacity-50"
                            >
                                Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Pricing & Duration */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">Set your price</h2>
                            <p className="text-gray-500">Choose a fair price for your time and expertise.</p>
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

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(2)} className="pl-btn pl-btn-secondary">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                className="pl-btn pl-btn-primary"
                            >
                                Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Location */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black mb-2">Where will you meet?</h2>
                            <p className="text-gray-500">Choose how you'll decide on the venue.</p>
                        </div>

                        <div className="space-y-3">
                            {defaultVenues.map(venue => (
                                <button
                                    key={venue.id}
                                    onClick={() => setVenueType(venue.id)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center ${venueType === venue.id
                                            ? 'border-black bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-12 h-12 ${venue.color} rounded-xl flex items-center justify-center mr-4`}>
                                        <i className={`fa-solid ${venue.icon} text-xl`}></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold">{venue.name}</p>
                                        <p className="text-sm text-gray-500">{venue.description}</p>
                                    </div>
                                    {venueType === venue.id && (
                                        <i className="fa-solid fa-check text-green-500"></i>
                                    )}
                                </button>
                            ))}
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
                                    placeholder="e.g., Starbucks Sendai Station"
                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Area
                            </label>
                            <input
                                type="text"
                                value={locationArea}
                                onChange={(e) => setLocationArea(e.target.value)}
                                placeholder="e.g., Sendai Station Area"
                                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(3)} className="pl-btn pl-btn-secondary">
                                <i className="fa-solid fa-arrow-left mr-2"></i> Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || (venueType === 'specific' && !specificLocation)}
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
                                        Create Listing
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
