import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Browser client for client-side usage - uses cookies for session storage
// This allows API routes to read the session via cookies
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Note: For server-side operations (API routes, server components),
// import from '@/lib/supabase/server' instead

