import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Browser client for client-side usage only
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Note: For server-side operations (API routes, server components),
// import from '@/lib/supabase/server' instead
