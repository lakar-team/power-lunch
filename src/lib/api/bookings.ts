import { Booking, CreateBookingInput } from '@/lib/types/supabase'

/**
 * Fetch user's bookings (as guest or host)
 */
export async function getBookings(params?: {
    role?: 'guest' | 'host'
    status?: string
}): Promise<{ bookings: Booking[] | null; error: string | null }> {
    try {
        const searchParams = new URLSearchParams()

        if (params?.role) searchParams.set('role', params.role)
        if (params?.status) searchParams.set('status', params.status)

        const url = `/api/bookings${searchParams.toString() ? `?${searchParams}` : ''}`
        const response = await fetch(url)

        if (!response.ok) {
            const errorData = await response.json()
            return { bookings: null, error: errorData.error || 'Failed to fetch bookings' }
        }

        const data = await response.json()
        return { bookings: data.bookings, error: null }
    } catch (error) {
        console.error('Error fetching bookings:', error)
        return { bookings: null, error: 'Network error' }
    }
}

/**
 * Fetch a single booking by ID
 */
export async function getBooking(id: string): Promise<{ booking: Booking | null; error: string | null }> {
    try {
        const response = await fetch(`/api/bookings/${id}`)

        if (!response.ok) {
            const errorData = await response.json()
            return { booking: null, error: errorData.error || 'Failed to fetch booking' }
        }

        const data = await response.json()
        return { booking: data.booking, error: null }
    } catch (error) {
        console.error('Error fetching booking:', error)
        return { booking: null, error: 'Network error' }
    }
}

/**
 * Create a new booking
 */
export async function createBooking(
    bookingData: CreateBookingInput
): Promise<{ booking: any; payment: any; qrCode: string | null; error: string | null }> {
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        })

        if (!response.ok) {
            const errorData = await response.json()
            return { booking: null, payment: null, qrCode: null, error: errorData.error || 'Failed to create booking' }
        }

        const data = await response.json()
        return {
            booking: data.booking,
            payment: data.payment,
            qrCode: data.qrCode,
            error: null,
        }
    } catch (error) {
        console.error('Error creating booking:', error)
        return { booking: null, payment: null, qrCode: null, error: 'Network error' }
    }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
            method: 'POST',
        })

        if (!response.ok) {
            const errorData = await response.json()
            return { success: false, error: errorData.error || 'Failed to cancel booking' }
        }

        return { success: true, error: null }
    } catch (error) {
        console.error('Error cancelling booking:', error)
        return { success: false, error: 'Network error' }
    }
}
