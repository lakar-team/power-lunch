import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// R2 Image Upload - Currently disabled until R2 is configured
// To enable: 
// 1. Set up R2 bucket in Cloudflare
// 2. Add R2 environment variables
// 3. Install: npm install @aws-sdk/client-s3
// 4. Uncomment the R2 client import and upload logic

// POST: Upload an image (authenticated)
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // R2 not configured yet - return placeholder response
        return NextResponse.json({
            error: 'Image upload not configured yet. Please set up Cloudflare R2.'
        }, { status: 501 })

        // TODO: Uncomment when R2 is configured
        // const formData = await request.formData()
        // const file = formData.get('file') as File | null
        // ... upload logic
    } catch (err: any) {
        console.error('Upload error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
