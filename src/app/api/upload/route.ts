import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { uploadImage } from '@/lib/r2/client'

// POST: Upload an image (authenticated)
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Parse multipart form data
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'
            }, { status: 400 })
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'File too large. Maximum 5MB'
            }, { status: 400 })
        }

        // Convert to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate safe filename
        const ext = file.name.split('.').pop() || 'jpg'
        const safeName = `${user.id}-${Date.now()}.${ext}`

        // Upload to R2
        const url = await uploadImage(buffer, safeName, file.type)

        return NextResponse.json({ url }, { status: 201 })
    } catch (err: any) {
        console.error('Upload error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// Config for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
}
