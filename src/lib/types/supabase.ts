// TypeScript interfaces for Supabase data
// Simplified types to ensure build compatibility

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
    profile?: Profile
}

export interface AvailabilitySlot {
    id: string
    host_location_id: string
    day_of_week: number | null
    specific_date: string | null
    start_time: string
    end_time: string
    is_recurring: boolean
}

export interface VenueOption {
    id: string
    name: string
    type: string
    description: string
    icon: string
    color: string
}

export interface HostLocation {
    id: string
    host_id: string
    name: string
    location_area: string | null
    location_lat: number | null
    location_lng: number | null
    session_type: 'in_person' | 'online' | 'both'
    meet_link: string | null
    venue_options: VenueOption[]
    price_yen: number
    duration_minutes: number
    is_active: boolean
    date_start: string | null
    date_end: string | null
    created_at: string
    updated_at: string
    availability_slots?: AvailabilitySlot[]
    host?: Host
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
    venue_options: VenueOption[] | any[]
    cover_image_url: string | null
    is_active: boolean
    created_at: string
    updated_at: string
    host?: Host
    availability_slots?: AvailabilitySlot[]
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
    status: string
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
    venue_options?: any[]
    cover_image_url?: string
    availability_slots?: any[]
}

export interface CreateBookingInput {
    listing_id: string
    booking_date: string
    start_time: string
    venue_selected: string
    guest_note?: string
}
