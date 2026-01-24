import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = createServerClient()
    const { id } = params

    // 1. Try fetching from 'listings' table (legacy)
    let { data: item, error } = await supabase
        .from('listings')
        .select(`
            *,
            host:hosts (
                id,
                bio,
                topics,
                rating_avg,
                total_sessions,
                is_verified,
                profile:profiles (
                    id,
                    full_name,
                    avatar_url
                )
            ),
            availability_slots (*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

    // 2. If not found, try 'host_locations' table (new system)
    if (error || !item) {
        const { data: location, error: locError } = await supabase
            .from('host_locations')
            .select(`
                *,
                host:hosts (
                    id,
                    bio,
                    topics,
                    rating_avg,
                    total_sessions,
                    is_verified,
                    profile:profiles (
                        id,
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('id', id)
            .eq('is_active', true)
            .single()

        if (locError) {
            console.error('[listings [id] GET] Not found in either table:', id)
            return NextResponse.json({ error: 'Listing or Location not found' }, { status: 404 })
        }

        // Map host_location to listing-like structure for the frontend
        item = {
            ...location,
            __type: 'host_location',
            title: location.name, // host_locations.name -> listings.title
            // description is the same
            category: location.host?.topics?.[0]?.split(':')[0] || 'Lunch',
        }
    } else {
        item = {
            ...item,
            __type: 'listing'
        }
    }

    return NextResponse.json({ listing: item })
}
