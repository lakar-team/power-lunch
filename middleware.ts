import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create supabase client to handle session refreshing
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // IMPORTANT: This call refreshes the session cookie if it's about to expire.
    // We must call this on every request, not just protected ones.
    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes that require authentication
    const protectedPaths = ['/booking', '/host', '/profile', '/messages']
    const path = request.nextUrl.pathname
    const isProtected = protectedPaths.some(p => path.startsWith(p))

    if (isProtected && !user) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('next', path)
        return NextResponse.redirect(redirectUrl)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
    ],
}
