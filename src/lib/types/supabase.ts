// TypeScript interfaces for Supabase data

export interface Profile {
    id: string
    full_name: string | null
    avatar_url: string | null
}

export interface Host {
    id: string
    bio: string | null
    topics: string[] | null
    rating_avg: number | null
    total_sessions: number
    is_verified: boolean
    profile: Profile
}

export interface AvailabilitySlot {
    id: string
    listing_id: string
    day_of_week: number // 0-6 (Sunday-Saturday)
    start_time: string // HH:MM format
    end_time: string // HH:MM format
}

export interface Listing {
    id: string
    host_id: string
    title: string
    description: string | null
    category: string
    price_yen: number
    duration_minutes: number
    location_lat: number | null
    location_lng: number | null
    location_area: string | null
    venue_options: VenueOption[]
    cover_image_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
    host?: Host
    availability_slots?: AvailabilitySlot[]
}

export interface VenueOption {
    id: string
    name: string
    type: string
    description: string
    icon: string
    color: string
}

export interface Booking {
    id: string
    listing_id: string
    guest_id: string
    host_id: string
    booking_date: string
    start_time: string
    end_time: string
    venue_selected: string
    guest_note: string | null
    qr_code_hash: string
    stripe_payment_intent_id: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    created_at: string
    listing?: Listing
    host?: Host
    guest?: Profile
}

export interface CreateListingInput {
    title: string
    description?: string
    category: string
    price_yen: number
    duration_minutes?: number
    location_lat?: number
    location_lng?: number
    location_area?: string
    venue_options?: VenueOption[]
    cover_image_url?: string
    availability_slots?: Omit<AvailabilitySlot, 'id' | 'listing_id'>[]
}

export interface CreateBookingInput {
    listing_id: string
    booking_date: string
    start_time: string
    venue_selected: string
    guest_note?: string
}
