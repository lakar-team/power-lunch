import { Listing } from '@/lib/types/supabase'

/**
 * Fetch all active listings with optional filters
 */
export async function getListings(params?: {
    category?: string
    minPrice?: number
    maxPrice?: number
    lat?: number
    lng?: number
    radius?: number
}): Promise<{ listings: Listing[] | null; error: string | null }> {
    try {
        const searchParams = new URLSearchParams()

        if (params?.category) searchParams.set('category', params.category)
        if (params?.minPrice) searchParams.set('minPrice', params.minPrice.toString())
        if (params?.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString())
        if (params?.lat) searchParams.set('lat', params.lat.toString())
        if (params?.lng) searchParams.set('lng', params.lng.toString())
        if (params?.radius) searchParams.set('radius', params.radius.toString())

        const url = `/api/listings${searchParams.toString() ? `?${searchParams}` : ''}`
        const response = await fetch(url)

        if (!response.ok) {
            const errorData = await response.json()
            return { listings: null, error: errorData.error || 'Failed to fetch listings' }
        }

        const data = await response.json()
        return { listings: data.listings, error: null }
    } catch (error) {
        console.error('Error fetching listings:', error)
        return { listings: null, error: 'Network error' }
    }
}

/**
 * Fetch a single listing by ID
 */
export async function getListing(id: string): Promise<{ listing: Listing | null; error: string | null }> {
    try {
        const response = await fetch(`/api/listings/${id}`)

        if (!response.ok) {
            if (response.status === 404) {
                return { listing: null, error: 'Listing not found' }
            }
            const errorData = await response.json()
            return { listing: null, error: errorData.error || 'Failed to fetch listing' }
        }

        const data = await response.json()
        return { listing: data.listing, error: null }
    } catch (error) {
        console.error('Error fetching listing:', error)
        return { listing: null, error: 'Network error' }
    }
}

/**
 * Create a new listing (host only)
 */
export async function createListing(listingData: any): Promise<{ listing: Listing | null; error: string | null }> {
    try {
        const response = await fetch('/api/listings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listingData),
        })

        if (!response.ok) {
            const errorData = await response.json()
            return { listing: null, error: errorData.error || 'Failed to create listing' }
        }

        const data = await response.json()
        return { listing: data.listing, error: null }
    } catch (error) {
        console.error('Error creating listing:', error)
        return { listing: null, error: 'Network error' }
    }
}
