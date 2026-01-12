import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/debug/auth - Debug endpoint to test authentication
export async function GET(request: NextRequest) {
    const supabase = createServerClient()

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            return NextResponse.json({
                authenticated: false,
                error: authError.message,
                errorCode: authError.code || 'unknown',
                hint: 'Check if cookies are being sent with the request'
            }, { status: 401 })
        }

        if (!user) {
            return NextResponse.json({
                authenticated: false,
                error: 'No user session found',
                hint: 'User may not be logged in or session expired'
            }, { status: 401 })
        }

        return NextResponse.json({
            authenticated: true,
            userId: user.id,
            email: user.email,
            createdAt: user.created_at,
            lastSignIn: user.last_sign_in_at,
            message: 'Authentication working correctly!'
        })
    } catch (err: any) {
        return NextResponse.json({
            authenticated: false,
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 })
    }
}
