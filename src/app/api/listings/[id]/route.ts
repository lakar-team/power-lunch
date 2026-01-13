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

    const { data: listing, error } = await supabase
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

    if (error) {
        if (error.code === 'PGRST116') {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ listing })
}
