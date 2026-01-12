import { createClient } from '@supabase/supabase-js'
import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server client that reads session from cookies (for API routes and server components)
// Note: This function must be called within a request context where cookies() is available
export const createServerClient = () => {
    const cookieStore = cookies()

    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                const cookie = cookieStore.get(name)
                console.log(`[Supabase] Cookie get "${name}":`, cookie?.value ? `found (${cookie.value.substring(0, 20)}...)` : 'not found')
                return cookie?.value
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value, ...options })
                } catch (error) {
                    // The `set` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing user sessions.
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value: '', ...options })
                } catch (error) {
                    // The `delete` method was called from a Server Component.
                }
            },
        },
    })
}

// Admin client with service role for elevated operations
export const createAdminClient = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

