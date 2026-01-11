import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use any for now since Database types may not be generated yet
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role for admin operations
export const createServerClient = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
