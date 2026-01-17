import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// GET /api/hosts/[hostId]/listings - Get all listings for a host
export async function GET(
    request: NextRequest,
    { params }: { params: { hostId: string } }
) {
    const supabase = createAdminClient()

    const { data: listings, error } = await supabase
        .from('listings')
        .select('id, title, price_yen, central_address, category, host_profile_id')
        .eq('host_id', params.hostId)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ listings: listings || [] })
}
