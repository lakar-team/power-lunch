import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// GET /api/hosts/[hostId]/listings - Get all host locations (pins) for a host
export async function GET(
    request: NextRequest,
    { params }: { params: { hostId: string } }
) {
    try {
        const supabase = createAdminClient()

        const { data: listings, error } = await supabase
            .from('host_locations')
            .select('id, name, price_yen, location_area, session_type')
            .eq('host_id', params.hostId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[listings] Error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Map to expected format
        const formattedListings = (listings || []).map(l => ({
            id: l.id,
            title: l.name,
            price_yen: l.price_yen,
            central_address: l.location_area,
            category: l.session_type
        }))

        return NextResponse.json({ listings: formattedListings })
    } catch (err: any) {
        console.error('[listings] Unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
