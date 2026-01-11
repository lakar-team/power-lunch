'use client'

import Link from 'next/link'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { useEffect, useRef, useState } from 'react'
import { getListings } from '@/lib/api/listings'
import { Listing } from '@/lib/types/supabase'

const filters = [
    { key: 'all', label: 'All', icon: null },
    { key: 'english', label: 'English', icon: 'fa-language', color: 'text-blue-500' },
    { key: 'tech', label: 'Tech', icon: 'fa-laptop-code', color: 'text-purple-500' },
    { key: 'design', label: 'Design', icon: 'fa-compass-drafting', color: 'text-orange-500' },
    { key: 'cheap', label: 'Under ¥1000', icon: null },
]

export default function SearchPage() {
    const { t } = useTranslation()
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const [activeFilter, setActiveFilter] = useState('all')
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [listings, setListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)

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

    // Fetch listings
    useEffect(() => {
        async function fetchListings() {
            setLoading(true)
            const { listings: data } = await getListings() // Fetch all active listings
            if (data) {
                setListings(data)
            }
            setLoading(false)
        }
        fetchListings()
    }, [])

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

    // Update markers when listings or filter changes
    useEffect(() => {
        if (!mapInstanceRef.current || !mapLoaded || loading) return

        const L = (window as any).L
        if (!L) return

        addMarkers(L, mapInstanceRef.current, listings)

    }, [mapLoaded, listings, loading, activeFilter])

    // Add markers function
    const addMarkers = (L: any, map: any, data: Listing[]) => {
        // Clear existing markers
        markersRef.current.forEach(m => map.removeLayer(m))
        markersRef.current = []

        data.forEach(listing => {
            // Apply client-side filtering
            let shouldShow = false
            if (activeFilter === 'all') {
                shouldShow = true
            } else if (activeFilter === 'cheap') {
                shouldShow = listing.price_yen < 1000
            } else {
                // Determine category match (fuzzy matching since DB categories might differ from filter keys)
                const category = listing.category?.toLowerCase() || ''
                if (activeFilter === 'tech') shouldShow = category.includes('tech') || category.includes('code') || category.includes('python')
                else if (activeFilter === 'design') shouldShow = category.includes('design') || category.includes('art')
                else if (activeFilter === 'english') shouldShow = category.includes('english') || category.includes('language')
                else shouldShow = category === activeFilter
            }

            if (!shouldShow) return
            if (!listing.location_lat || !listing.location_lng) return

            const isHighlighted = listing.category?.toLowerCase().includes('english') || false
            const colorClass = isHighlighted ? 'bg-black text-white' : 'bg-white text-gray-800'

            const icon = L.divIcon({
                className: 'custom-pin',
                html: `
                    <div class="flex flex-col items-center group cursor-pointer">
                        <div class="${colorClass} px-2 py-1 rounded-lg shadow-md font-bold text-xs border border-gray-200 group-hover:scale-110 transition whitespace-nowrap">
                            ¥${listing.price_yen.toLocaleString()}
                        </div>
                        <div class="text-gray-800 mt-[-4px] text-lg drop-shadow-md"><i class="fa-solid fa-location-dot"></i></div>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })

            const marker = L.marker([listing.location_lat, listing.location_lng], { icon }).addTo(map)
            marker.on('click', () => {
                window.location.href = `/listing/${listing.id}`
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
            {/* Map Container */}
            <div ref={mapRef} className="absolute inset-0 z-0" />

            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-30 px-4 py-3 flex justify-between items-center">
                <Link href="/" className="pl-logo">
                    POWER<span>LUNCH</span>.
                </Link>
                <LanguageToggle />
            </div>

            {/* Search & Filters */}
            <div className="absolute top-14 left-0 w-full z-20 px-4 bg-gradient-to-b from-white/90 via-white/50 to-transparent pb-6">
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
                    {filters.map(filter => (
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

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilterModal(false)}></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
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
                                {['All', '🇬🇧 English', '💻 Tech', '🎨 Design', '💼 Career'].map(cat => (
                                    <button key={cat} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-black hover:text-white transition">
                                        {cat}
                                    </button>
                                ))}
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

{/* Header */ }
<div className="absolute top-0 left-0 w-full z-30 px-4 py-3 flex justify-between items-center">
    <Link href="/" className="pl-logo">
        POWER<span>LUNCH</span>.
    </Link>
    <LanguageToggle />
</div>

{/* Search & Filters */ }
<div className="absolute top-14 left-0 w-full z-20 px-4 bg-gradient-to-b from-white/90 via-white/50 to-transparent pb-6">
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
        {filters.map(filter => (
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

{/* Filter Modal */ }
{
    showFilterModal && (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilterModal(false)}></div>
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
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
                        {['All', '🇬🇧 English', '💻 Tech', '🎨 Design', '💼 Career'].map(cat => (
                            <button key={cat} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-bold hover:bg-black hover:text-white transition">
                                {cat}
                            </button>
                        ))}
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
    )
}

