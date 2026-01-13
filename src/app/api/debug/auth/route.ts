import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Use Edge Runtime for Cloudflare
export const runtime = 'edge'

// GET /api/debug/auth - Debug endpoint to test authentication
export async function GET(request: NextRequest) {
    // Get all cookie names for debugging
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    const cookieNames = allCookies.map(c => c.name)

    // Check for Supabase auth cookies specifically
    const authCookies = allCookies.filter(c =>
        c.name.includes('supabase') ||
        c.name.includes('sb-') ||
        c.name.includes('auth')
    )

    const supabase = createServerClient()

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            return NextResponse.json({
                authenticated: false,
                error: authError.message,
                errorCode: authError.code || 'unknown',
                hint: 'Check if cookies are being sent with the request',
                debug: {
                    totalCookies: allCookies.length,
                    cookieNames: cookieNames,
                    authCookies: authCookies.map(c => ({ name: c.name, length: c.value.length }))
                }
            }, { status: 401 })
        }

        if (!user) {
            return NextResponse.json({
                authenticated: false,
                error: 'No user session found',
                hint: 'User may not be logged in or session expired',
                debug: {
                    totalCookies: allCookies.length,
                    cookieNames: cookieNames,
                    authCookies: authCookies.map(c => ({ name: c.name, length: c.value.length }))
                }
            }, { status: 401 })
        }

        return NextResponse.json({
            authenticated: true,
            userId: user.id,
            email: user.email,
            createdAt: user.created_at,
            lastSignIn: user.last_sign_in_at,
            message: 'Authentication working correctly!',
            debug: {
                totalCookies: allCookies.length,
                authCookies: authCookies.map(c => ({ name: c.name, length: c.value.length }))
            }
        })
    } catch (err: any) {
        return NextResponse.json({
            authenticated: false,
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            debug: {
                totalCookies: allCookies.length,
                cookieNames: cookieNames
            }
        }, { status: 500 })
    }
}
