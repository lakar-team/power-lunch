'use client'

import Link from 'next/link'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { useEffect, useRef, useState } from 'react'
import { HostLocation } from '@/lib/types/supabase'

import { categories } from '@/lib/categories'

// Quick filter buttons at the top of the search page
const quickFilters = [
    { key: 'all', label: 'All', icon: null },
    { key: 'language', label: 'Language', icon: 'fa-language', color: 'text-blue-500' },
    { key: 'technology', label: 'Tech', icon: 'fa-laptop-code', color: 'text-purple-500' },
    { key: 'creative', label: 'Design', icon: 'fa-palette', color: 'text-orange-500' },
    { key: 'cheap', label: 'Under ¥1000', icon: null },
]

export default function SearchPage() {
    const { t } = useTranslation()
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const [activeFilter, setActiveFilter] = useState('all')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
    const [showOnlineOnly, setShowOnlineOnly] = useState(false)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
    const [mapLoaded, setMapLoaded] = useState(false)
    const [locations, setLocations] = useState<(HostLocation & { host?: any })[]>([])
    const [loading, setLoading] = useState(true)

    // Get the selected category's subcategories
    const selectedCategoryData = selectedCategory ? categories.find(c => c.id === selectedCategory) : null

    // Load Leaflet from CDN
    useEffect(() => {
        if (typeof window === 'undefined') return

        // Add Leaflet CSS
        const linkEl = document.createElement('link')
        linkEl.rel = 'stylesheet'
        linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(linkEl)

        // Add Leaflet JS
        const scriptEl = document.createElement('script')
        scriptEl.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        scriptEl.onload = () => setMapLoaded(true)
        document.head.appendChild(scriptEl)

        return () => {
            document.head.removeChild(linkEl)
            if (scriptEl.parentNode) document.head.removeChild(scriptEl)
        }
    }, [])

    // Fetch host locations (cached - only fetch once)
    const [hasFetched, setHasFetched] = useState(false)

    useEffect(() => {
        // Skip if already fetched (prevents refetch on filter changes)
        if (hasFetched) return

        async function fetchLocations() {
            setLoading(true)
            try {
                const res = await fetch('/api/host-locations')
                if (res.ok) {
                    const data = await res.json()
                    setLocations(data)
                }
            } catch (err) {
                console.error('Failed to fetch locations:', err)
            }
            setLoading(false)
            setHasFetched(true)
        }
        fetchLocations()
    }, [hasFetched])

    // Initialize map
    useEffect(() => {
        if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return

        const L = (window as any).L
        if (!L) return

        // Default to Sendai, Japan if no user location
        const defaultLat = 38.2610
        const defaultLng = 140.8820

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([defaultLat, defaultLng], 15)

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(map)

        mapInstanceRef.current = map

        // Try geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    map.setView([position.coords.latitude, position.coords.longitude], 15)
                    // Add user location marker
                    L.circleMarker([position.coords.latitude, position.coords.longitude], {
                        radius: 8,
                        fillColor: "#3B82F6",
                        color: "#fff",
                        weight: 3,
                        opacity: 1,
                        fillOpacity: 1
                    }).addTo(map)
                },
                () => console.log('Geolocation denied')
            )
        }

    }, [mapLoaded])

    // Update markers when locations or filter changes
    useEffect(() => {
        if (!mapInstanceRef.current || !mapLoaded || loading) return

        const L = (window as any).L
        if (!L) return

        addMarkers(L, mapInstanceRef.current, locations)

    }, [mapLoaded, locations, loading, activeFilter, showOnlineOnly, selectedCategory])

    // Add markers function
    const addMarkers = (L: any, map: any, data: (HostLocation & { host?: any })[]) => {
        // Clear existing markers
        markersRef.current.forEach(m => map.removeLayer(m))
        markersRef.current = []

        data.forEach(location => {
            // Apply client-side filtering
            let shouldShow = true

            // Filter by online only
            if (showOnlineOnly) {
                if (location.session_type !== 'online' && location.session_type !== 'both') {
                    shouldShow = false
                }
            }

            // Filter by category/topic (check host's topics array)
            if (activeFilter !== 'all' && activeFilter !== 'cheap') {
                const hostTopics = location.host?.topics || []
                const hasMatchingTopic = hostTopics.some((topic: string) => {
                    const topicLower = topic.toLowerCase()
                    if (activeFilter === 'language') return topicLower.includes('language') || topicLower.includes('english')
                    if (activeFilter === 'technology') return topicLower.includes('tech') || topicLower.includes('code')
                    if (activeFilter === 'creative') return topicLower.includes('design') || topicLower.includes('art')
                    return topicLower.includes(activeFilter)
                })
                if (!hasMatchingTopic) shouldShow = false
            }

            // Filter by price
            if (activeFilter === 'cheap' && location.price_yen >= 1000) {
                shouldShow = false
            }

            if (!shouldShow) return

            // Skip if no coordinates (unless online only)
            if (location.session_type !== 'online' && (!location.location_lat || !location.location_lng)) return

            // Default coordinates for online-only (show at a default spot or skip)
            if (location.session_type === 'online' && (!location.location_lat || !location.location_lng)) return

            const hasOnline = location.session_type === 'online' || location.session_type === 'both'
            const colorClass = hasOnline ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'

            const icon = L.divIcon({
                className: 'custom-pin',
                html: `
                    <div class="flex flex-col items-center group cursor-pointer">
                        <div class="${colorClass} px-2 py-1 rounded-lg shadow-md font-bold text-xs border border-gray-200 group-hover:scale-110 transition whitespace-nowrap flex items-center">
                            ${hasOnline ? '<i class="fa-solid fa-video mr-1"></i>' : ''}
                            ¥${location.price_yen.toLocaleString()}
                        </div>
                        <div class="text-gray-800 mt-[-4px] text-lg drop-shadow-md"><i class="fa-solid fa-location-dot"></i></div>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })

            const marker = L.marker([location.location_lat, location.location_lng], { icon }).addTo(map)
            marker.on('click', () => {
                // TODO: Link to host profile page
                window.location.href = `/host/${location.host_id}`
            })
            markersRef.current.push(marker)
        })
    }

    // Filter markers
    const handleFilterClick = (filterKey: string) => {
        setActiveFilter(filterKey)
        // useEffect handles the redraw
    }

    return (
        <div className="h-screen overflow-hidden relative bg-gray-100">
            {/* Map Container (only show in map mode) */}
            {viewMode === 'map' && <div ref={mapRef} className="absolute inset-0 z-0" />}

            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-30 px-4 py-3 flex justify-between items-center">
                <Link href="/" className="pl-logo">
                    POWER<span>LUNCH</span>.
                </Link>
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-white rounded-full shadow-sm overflow-hidden">
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-1.5 text-xs font-bold ${viewMode === 'map' ? 'bg-black text-white' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-map"></i>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 text-xs font-bold ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-600'}`}
                        >
                            <i className="fa-solid fa-list"></i>
                        </button>
                    </div>
                    <LanguageToggle />
                </div>
            </div>

            {/* Search & Filters */}
            <div className={`absolute top-14 left-0 w-full z-20 px-4 pb-6 ${viewMode === 'map' ? 'bg-gradient-to-b from-white/90 via-white/50 to-transparent' : 'bg-white border-b border-gray-200'}`}>
                {/* Search Input */}
                <div className="relative shadow-lg rounded-full">
                    <input
                        type="text"
                        placeholder={t('search.placeholder')}
                        className="w-full py-3 pl-12 pr-12 rounded-full border-none focus:ring-2 focus:ring-black bg-white text-sm font-medium"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-gray-400"></i>
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="absolute right-2 top-1.5 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200"
                    >
                        <i className="fa-solid fa-sliders text-gray-600 text-sm"></i>
                    </button>
                </div>

                {/* Filter Pills */}
                <div className="flex space-x-2 overflow-x-auto pl-hide-scrollbar mt-3 pb-1">
                    {quickFilters.map(filter => (
                        <button
                            key={filter.key}
                            onClick={() => handleFilterClick(filter.key)}
                            className={`flex items-center px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${activeFilter === filter.key
                                ? 'bg-black text-white shadow-md'
                                : 'bg-white text-gray-700 shadow-sm border border-gray-100'
                                }`}
                        >
                            {filter.icon && <i className={`fa-solid ${filter.icon} mr-1.5 ${filter.color}`}></i>}
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
                <div className="absolute top-44 left-0 right-0 bottom-0 overflow-y-auto bg-gray-50 px-4 pb-24">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        </div>
                    ) : locations.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-map-location-dot text-5xl text-gray-300 mb-4"></i>
                            <p className="font-bold text-gray-700">No hosts found</p>
                            <p className="text-sm text-gray-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-4">
                            {locations
                                .filter(location => {
                                    // Apply same filters as map
                                    if (showOnlineOnly && location.session_type !== 'online' && location.session_type !== 'both') return false
                                    if (activeFilter === 'cheap' && location.price_yen >= 1000) return false
                                    return true
                                })
                                .map(location => (
                                    <Link
                                        key={location.id}
                                        href={`/host/${location.host_id}`}
                                        className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 ${location.session_type === 'online' ? 'bg-blue-100 text-blue-600' :
                                                    location.session_type === 'both' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-green-100 text-green-600'
                                                    }`}>
                                                    <i className={`fa-solid ${location.session_type === 'online' ? 'fa-video' :
                                                        location.session_type === 'both' ? 'fa-people-arrows' :
                                                            'fa-utensils'
                                                        } text-xl`}></i>
                                                </div>
                                                <div>
                                                    <p className="font-bold">{location.host?.profile?.full_name || 'Host'}</p>
                                                    <p className="text-sm text-gray-500">{location.location_area}</p>
                                                    {location.host?.topics && location.host.topics.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {location.host.topics.slice(0, 3).map((topic: string, i: number) => (
                                                                <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                                                    {topic.split(':')[1] || topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">¥{location.price_yen.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400">{location.duration_minutes}min</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            }
                        </div>
                    )}
                </div>
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilterModal(false)}></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-24 max-h-[70vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black">Filters</h2>
                            <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-black">
                                <i className="fa-solid fa-times text-xl"></i>
                            </button>
                        </div>

                        {/* Price Range */}
                        <div className="mb-6">
                            <label className="text-sm font-bold text-gray-700 mb-3 block">Price Range</label>
                            <input
                                type="range"
                                min="0"
                                max="5000"
                                defaultValue="2500"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>¥0</span>
                                <span className="font-bold text-gray-900">¥2,500</span>
                                <span>¥5,000</span>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="mb-6">
                            <label className="text-sm font-bold text-gray-700 mb-3 block">Category</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition ${selectedCategory === null ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    All
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null); }}
                                        className={`px-4 py-2 rounded-full text-sm font-bold transition ${selectedCategory === cat.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        <i className={`fa-solid ${cat.icon} mr-1.5 ${selectedCategory === cat.id ? '' : cat.color.split(' ')[1]}`}></i>
                                        {cat.label.split(' & ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subcategory (shows when category selected) */}
                        {selectedCategoryData && selectedCategoryData.subcategories && (
                            <div className="mb-6">
                                <label className="text-sm font-bold text-gray-700 mb-3 block">Specific Topic</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedSubcategory(null)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${selectedSubcategory === null ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        All {selectedCategoryData.label.split(' & ')[0]}
                                    </button>
                                    {selectedCategoryData.subcategories.map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setSelectedSubcategory(sub.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${selectedSubcategory === sub.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Online Sessions Toggle */}
                        <div className="mb-6">
                            <label className="text-sm font-bold text-gray-700 mb-3 block">Session Type</label>
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                                <div className="flex items-center">
                                    <i className="fa-solid fa-video text-blue-500 mr-3"></i>
                                    <div>
                                        <p className="font-medium">Online Sessions Only</p>
                                        <p className="text-xs text-gray-400">Show hosts available via video call</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showOnlineOnly}
                                        onChange={(e) => setShowOnlineOnly(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                        </div>

                        {/* Distance */}
                        <div className="mb-6">
                            <label className="text-sm font-bold text-gray-700 mb-3 block">Distance</label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                defaultValue="5"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>1km</span>
                                <span className="font-bold text-gray-900">5km</span>
                                <span>20km</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-3 mt-8">
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 py-4 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 py-4 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
