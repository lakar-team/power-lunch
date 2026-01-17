import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// GET /api/hosts/profiles/[id] - Get a single profile
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const supabase = createAdminClient()

    const { data: profile, error } = await supabase
        .from('host_profiles')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
}

// PATCH /api/hosts/profiles/[id] - Update a profile
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authClient = createServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, content } = body

    const supabase = createAdminClient()

    // Verify ownership
    const { data: profile } = await supabase
        .from('host_profiles')
        .select('*, host:hosts!inner(user_id)')
        .eq('id', params.id)
        .single()

    if (!profile || (profile as any).host?.user_id !== user.id) {
        return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 })
    }

    // Update
    const updateData: any = { updated_at: new Date().toISOString() }
    if (name) updateData.name = name.substring(0, 100)
    if (content) updateData.content = content

    const { data: updated, error } = await supabase
        .from('host_profiles')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: updated })
}

// DELETE /api/hosts/profiles/[id] - Delete a sub-profile
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authClient = createServerClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Verify ownership and check if main
    const { data: profile } = await supabase
        .from('host_profiles')
        .select('*, host:hosts!inner(user_id)')
        .eq('id', params.id)
        .single()

    if (!profile || (profile as any).host?.user_id !== user.id) {
        return NextResponse.json({ error: 'Profile not found or unauthorized' }, { status: 404 })
    }

    if (profile.is_main) {
        return NextResponse.json({ error: 'Cannot delete main profile' }, { status: 400 })
    }

    // Delete
    const { error } = await supabase
        .from('host_profiles')
        .delete()
        .eq('id', params.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
