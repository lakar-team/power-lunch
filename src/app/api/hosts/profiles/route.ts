import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// GET /api/hosts/profiles - Get all profiles for current host
export async function GET(request: NextRequest) {
    const authClient = createServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get host record
    const { data: host } = await supabase
        .from('hosts')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!host) {
        return NextResponse.json({ profiles: [], is_host: false })
    }

    // Get all profiles for this host
    const { data: profiles, error } = await supabase
        .from('host_profiles')
        .select('*')
        .eq('host_id', host.id)
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        profiles: profiles || [],
        is_host: true,
        host_id: host.id
    })
}

// POST /api/hosts/profiles - Create a new profile
export async function POST(request: NextRequest) {
    const authClient = createServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, content, is_main } = body

    if (!name || !content) {
        return NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get or create host record
    let { data: host } = await supabase
        .from('hosts')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!host) {
        // Auto-create host record
        const { data: newHost, error: createError } = await supabase
            .from('hosts')
            .insert({ user_id: user.id } as any)
            .select('id')
            .single()

        if (createError) {
            return NextResponse.json({ error: 'Failed to create host record' }, { status: 500 })
        }
        host = newHost
    }

    // Check profile limits
    const { data: existingProfiles } = await supabase
        .from('host_profiles')
        .select('id, is_main')
        .eq('host_id', host.id)

    const profileCount = existingProfiles?.length || 0
    const hasMain = existingProfiles?.some(p => p.is_main)

    // Limit: 1 main + 5 sub = 6 total
    if (profileCount >= 6) {
        return NextResponse.json({ error: 'Maximum 6 profiles allowed (1 main + 5 sub)' }, { status: 400 })
    }

    // If requesting main but one already exists
    if (is_main && hasMain) {
        return NextResponse.json({ error: 'Main profile already exists' }, { status: 400 })
    }

    // Create the profile
    const { data: profile, error } = await supabase
        .from('host_profiles')
        .insert({
            host_id: host.id,
            name: name.substring(0, 100),
            content,
            is_main: is_main || !hasMain, // First profile is always main
        } as any)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile }, { status: 201 })
}
