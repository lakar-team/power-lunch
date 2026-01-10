// Auto-generated types from Supabase schema
// Run `npx supabase gen types typescript` to regenerate

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    language_preference: 'en' | 'ja'
                    phone: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    language_preference?: 'en' | 'ja'
                    phone?: string | null
                }
                Update: {
                    full_name?: string | null
                    avatar_url?: string | null
                    language_preference?: 'en' | 'ja'
                    phone?: string | null
                }
            }
            hosts: {
                Row: {
                    id: string
                    user_id: string
                    bio: string | null
                    topics: string[]
                    rating_avg: number
                    total_sessions: number
                    response_rate: number
                    stripe_account_id: string | null
                    is_verified: boolean
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    bio?: string | null
                    topics?: string[]
                    stripe_account_id?: string | null
                }
                Update: {
                    bio?: string | null
                    topics?: string[]
                    stripe_account_id?: string | null
                    is_verified?: boolean
                    is_active?: boolean
                }
            }
            listings: {
                Row: {
                    id: string
                    host_id: string
                    title: string
                    description: string | null
                    category: string | null
                    price_yen: number
                    duration_minutes: number
                    location_lat: number | null
                    location_lng: number | null
                    location_area: string | null
                    venue_options: Json
                    cover_image_url: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    host_id: string
                    title: string
                    description?: string | null
                    category?: string | null
                    price_yen: number
                    duration_minutes?: number
                    location_lat?: number | null
                    location_lng?: number | null
                    location_area?: string | null
                    venue_options?: Json
                    cover_image_url?: string | null
                }
                Update: {
                    title?: string
                    description?: string | null
                    category?: string | null
                    price_yen?: number
                    duration_minutes?: number
                    location_lat?: number | null
                    location_lng?: number | null
                    location_area?: string | null
                    venue_options?: Json
                    cover_image_url?: string | null
                    is_active?: boolean
                }
            }
            availability_slots: {
                Row: {
                    id: string
                    listing_id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                }
                Insert: {
                    listing_id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                }
                Update: {
                    day_of_week?: number
                    start_time?: string
                    end_time?: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    listing_id: string
                    guest_id: string
                    host_id: string
                    booking_date: string
                    start_time: string
                    end_time: string
                    venue_selected: string | null
                    guest_note: string | null
                    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
                    qr_code_hash: string | null
                    stripe_payment_intent_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    listing_id: string
                    guest_id: string
                    host_id: string
                    booking_date: string
                    start_time: string
                    end_time: string
                    venue_selected?: string | null
                    guest_note?: string | null
                    stripe_payment_intent_id?: string | null
                }
                Update: {
                    venue_selected?: string | null
                    guest_note?: string | null
                    status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
                    qr_code_hash?: string | null
                }
            }
            transactions: {
                Row: {
                    id: string
                    booking_id: string
                    amount_yen: number
                    platform_fee_yen: number
                    host_payout_yen: number
                    stripe_charge_id: string | null
                    stripe_transfer_id: string | null
                    status: 'pending' | 'completed' | 'refunded' | 'failed'
                    refund_amount_yen: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    booking_id: string
                    amount_yen: number
                    platform_fee_yen: number
                    host_payout_yen: number
                    stripe_charge_id?: string | null
                }
                Update: {
                    stripe_transfer_id?: string | null
                    status?: 'pending' | 'completed' | 'refunded' | 'failed'
                    refund_amount_yen?: number
                }
            }
            reviews: {
                Row: {
                    id: string
                    booking_id: string
                    reviewer_id: string
                    reviewee_id: string
                    rating: number
                    comment: string | null
                    is_from_guest: boolean
                    created_at: string
                }
                Insert: {
                    booking_id: string
                    reviewer_id: string
                    reviewee_id: string
                    rating: number
                    comment?: string | null
                    is_from_guest: boolean
                }
                Update: never
            }
            messages: {
                Row: {
                    id: string
                    booking_id: string
                    sender_id: string
                    message_text: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    booking_id: string
                    sender_id: string
                    message_text: string
                }
                Update: {
                    is_read?: boolean
                }
            }
        }
    }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Host = Database['public']['Tables']['hosts']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']
export type AvailabilitySlot = Database['public']['Tables']['availability_slots']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

// Extended types for API responses
export interface ListingWithHost extends Listing {
    host: Host & {
        profile: Profile
    }
    availability_slots: AvailabilitySlot[]
}

export interface BookingWithDetails extends Booking {
    listing: Listing
    guest: Profile
    host: Host & {
        profile: Profile
    }
}
