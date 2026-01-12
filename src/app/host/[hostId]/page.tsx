'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'
import { HostLocation } from '@/lib/types/supabase'
import { categories, getCategoryById } from '@/lib/categories'

export default function HostProfilePage() {
    const { t } = useTranslation()
    const params = useParams()
    const router = useRouter()
    const hostId = params.hostId as string

    const [host, setHost] = useState<any>(null)
    const [locations, setLocations] = useState<HostLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLocation, setSelectedLocation] = useState<HostLocation | null>(null)
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
    const [bookingStep, setBookingStep] = useState<'view' | 'topic' | 'time' | 'confirm'>('view')

    useEffect(() => {
        async function loadHost() {
            // Fetch host data
            const { data: hostData, error } = await supabase
                .from('hosts')
                .select(`
                    *,
                    profile:profiles(full_name, avatar_url)
                `)
                .eq('id', hostId)
                .single()

            if (error || !hostData) {
                console.error('Host not found:', error)
                setLoading(false)
                return
            }

            setHost(hostData)

            // Fetch locations for this host
            const locationsRes = await fetch(`/api/host-locations?host_id=${hostId}`)
            if (locationsRes.ok) {
                const locationsData = await locationsRes.json()
                setLocations(locationsData)
                if (locationsData.length > 0) {
                    setSelectedLocation(locationsData[0])
                }
            }

            setLoading(false)
        }

        if (hostId) {
            loadHost()
        }
    }, [hostId])

    // Parse topics into readable format
    const getTopicLabel = (topicKey: string) => {
        const [catId, subId] = topicKey.split(':')
        const category = getCategoryById(catId)
        const subcategory = category?.subcategories.find(s => s.id === subId)
        return subcategory?.label || topicKey
    }

    const handleStartBooking = (location: HostLocation) => {
        setSelectedLocation(location)
        if (host?.topics && host.topics.length > 0) {
            setBookingStep('topic')
        } else {
            setBookingStep('time')
        }
    }

    const handleSelectTopic = (topic: string) => {
        setSelectedTopic(topic)
        setBookingStep('time')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )
    }

    if (!host) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <i className="fa-solid fa-user-slash text-5xl text-gray-300 mb-4"></i>
                <h1 className="text-xl font-bold mb-2">Host Not Found</h1>
                <Link href="/search" className="text-blue-600 hover:underline">
                    Back to Search
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center">
                    <Link href="/search" className="text-gray-500 hover:text-black mr-4">
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </Link>
                    <span className="font-bold">Host Profile</span>
                </div>
                <LanguageToggle />
            </header>

            {/* Host Header */}
            <div className="bg-white px-4 py-6 border-b border-gray-100">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mr-4">
                            {host.profile?.avatar_url ? (
                                <img src={host.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                host.profile?.full_name?.charAt(0) || 'H'
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black">{host.profile?.full_name || 'Host'}</h1>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                {host.rating_avg ? (
                                    <>
                                        <span className="text-yellow-500 mr-1">⭐</span>
                                        <span className="font-bold">{host.rating_avg.toFixed(1)}</span>
                                        <span className="mx-2">•</span>
                                    </>
                                ) : null}
                                <span>{host.total_sessions || 0} sessions</span>
                                {host.is_verified && (
                                    <>
                                        <span className="mx-2">•</span>
                                        <span className="text-green-600"><i className="fa-solid fa-check-circle mr-1"></i>Verified</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {host.bio && (
                        <p className="text-gray-600 mb-4">{host.bio}</p>
                    )}

                    {/* Topics */}
                    {host.topics && host.topics.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-bold text-gray-700 mb-2">Topics I Can Discuss</p>
                            <div className="flex flex-wrap gap-2">
                                {host.topics.map((topic: string, i: number) => (
                                    <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                        {getTopicLabel(topic)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Locations */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                <h2 className="text-lg font-bold mb-4">
                    <i className="fa-solid fa-location-dot mr-2 text-blue-500"></i>
                    Available Locations
                </h2>

                {locations.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No locations available for booking</p>
                ) : (
                    <div className="space-y-4">
                        {locations.filter(l => l.is_active).map(location => (
                            <div
                                key={location.id}
                                className={`bg-white rounded-xl p-4 border-2 transition ${selectedLocation?.id === location.id ? 'border-black shadow-lg' : 'border-gray-100'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${location.session_type === 'online' ? 'bg-blue-100 text-blue-600' :
                                                location.session_type === 'both' ? 'bg-purple-100 text-purple-600' :
                                                    'bg-green-100 text-green-600'
                                            }`}>
                                            <i className={`fa-solid ${location.session_type === 'online' ? 'fa-video' :
                                                    location.session_type === 'both' ? 'fa-people-arrows' :
                                                        'fa-utensils'
                                                } text-xl`}></i>
                                        </div>
                                        <div>
                                            <p className="font-bold">{location.name}</p>
                                            <p className="text-sm text-gray-500">{location.location_area}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                    {location.duration_minutes}min
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${location.session_type === 'online' ? 'bg-blue-100 text-blue-700' :
                                                        location.session_type === 'both' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {location.session_type === 'online' ? 'Online' :
                                                        location.session_type === 'both' ? 'Online + In-Person' :
                                                            'In-Person'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black">¥{location.price_yen.toLocaleString()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleStartBooking(location)}
                                    className="w-full mt-4 pl-btn pl-btn-primary"
                                >
                                    <i className="fa-solid fa-calendar-check mr-2"></i>
                                    Book This Location
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {bookingStep !== 'view' && selectedLocation && (
                <div className="fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setBookingStep('view')}></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto">
                        {/* Close button */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black">
                                {bookingStep === 'topic' ? 'Select Topic' :
                                    bookingStep === 'time' ? 'Select Time' :
                                        'Confirm Booking'}
                            </h2>
                            <button onClick={() => setBookingStep('view')} className="text-gray-400 hover:text-black">
                                <i className="fa-solid fa-times text-xl"></i>
                            </button>
                        </div>

                        {/* Topic Selection */}
                        {bookingStep === 'topic' && host.topics && (
                            <div className="space-y-3">
                                <p className="text-gray-500 mb-4">What would you like to talk about with {host.profile?.full_name}?</p>
                                {host.topics.map((topic: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectTopic(topic)}
                                        className="w-full p-4 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition flex items-center justify-between"
                                    >
                                        <span className="font-medium">{getTopicLabel(topic)}</span>
                                        <i className="fa-solid fa-chevron-right text-gray-400"></i>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Time Selection */}
                        {bookingStep === 'time' && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                                    <p className="text-sm text-gray-500">Selected:</p>
                                    <p className="font-bold">{selectedLocation.name}</p>
                                    {selectedTopic && (
                                        <p className="text-sm text-gray-700 mt-1">Topic: {getTopicLabel(selectedTopic)}</p>
                                    )}
                                </div>

                                <p className="text-gray-500 mb-4">Choose a time for your session:</p>

                                {/* Quick date buttons */}
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {[0, 1, 2].map(offset => {
                                        const date = new Date()
                                        date.setDate(date.getDate() + offset)
                                        return (
                                            <button
                                                key={offset}
                                                className="p-3 bg-gray-50 rounded-xl text-center hover:bg-gray-100 transition border border-gray-200"
                                            >
                                                <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                                <p className="font-bold">{date.getDate()}</p>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Time slots (placeholder) */}
                                <p className="text-sm font-bold text-gray-700 mb-2">Available Times</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '18:00', '18:30'].map(time => (
                                        <button
                                            key={time}
                                            className="py-2 px-3 bg-gray-50 rounded-lg text-sm font-medium hover:bg-black hover:text-white transition border border-gray-200"
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setBookingStep('confirm')}
                                    className="w-full mt-6 pl-btn pl-btn-primary"
                                >
                                    Continue to Payment
                                </button>
                            </div>
                        )}

                        {/* Confirm */}
                        {bookingStep === 'confirm' && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="font-bold text-lg mb-2">{selectedLocation.name}</p>
                                    <p className="text-sm text-gray-600">{selectedLocation.location_area}</p>
                                    {selectedTopic && (
                                        <p className="text-sm mt-2">Topic: <span className="font-medium">{getTopicLabel(selectedTopic)}</span></p>
                                    )}
                                    <div className="border-t border-gray-200 mt-4 pt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Session fee</span>
                                            <span className="font-bold text-xl">¥{selectedLocation.price_yen.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedLocation.session_type === 'online' || selectedLocation.session_type === 'both' ? (
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-700">
                                            <i className="fa-solid fa-video text-blue-600 mr-2"></i>
                                            You'll receive a Google Meet link after booking
                                        </p>
                                    </div>
                                ) : null}

                                <button className="w-full pl-btn pl-btn-success">
                                    <i className="fa-solid fa-lock mr-2"></i>
                                    Pay ¥{selectedLocation.price_yen.toLocaleString()}
                                </button>
                                <p className="text-xs text-gray-400 text-center">
                                    Secure payment via Stripe
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
