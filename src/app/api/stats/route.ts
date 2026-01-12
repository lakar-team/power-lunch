import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for stats (public data, no auth needed)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    try {
        // Get total users count
        const { count: usersCount, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        // Get total listings count
        const { count: listingsCount, error: listingsError } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)

        // Get total completed sessions
        const { count: sessionsCount, error: sessionsError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')

        // Get total hosts/experts count
        const { count: hostsCount, error: hostsError } = await supabase
            .from('hosts')
            .select('*', { count: 'exact', head: true })

        // Get total payouts (sum of completed booking amounts)
        const { data: payoutsData, error: payoutsError } = await supabase
            .from('bookings')
            .select('total_price')
            .eq('status', 'completed')

        let totalPayouts = 0
        if (payoutsData && !payoutsError) {
            totalPayouts = payoutsData.reduce((sum, booking) => sum + (booking.total_price || 0), 0)
        }

        if (usersError || listingsError || sessionsError || hostsError) {
            console.error('Stats fetch error:', { usersError, listingsError, sessionsError, hostsError })
        }

        return NextResponse.json({
            users: usersCount || 0,
            listings: listingsCount || 0,
            sessions: sessionsCount || 0,
            hosts: hostsCount || 0,
            payouts: totalPayouts
        })

    } catch (error: any) {
        console.error('Stats API error:', error)
        return NextResponse.json({
            users: 0,
            listings: 0,
            sessions: 0,
            hosts: 0,
            payouts: 0
        })
    }
}

