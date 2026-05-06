import { createClient, SupabaseClient as SC } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

let supabase: SC | null = null

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local'
  )
} else {
  supabase = createClient(supabaseUrl, supabasePublishableKey)
}

// Mock client for development when credentials are missing
const createMockClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({
      data: { user: null },
      error: new Error('Supabase not configured'),
    }),
    signUp: async () => ({
      data: { user: null },
      error: new Error('Supabase not configured'),
    }),
    signOut: async () => ({ error: null }),
  },
})

export const supabaseClient = supabase || (createMockClient() as unknown as SC)

export type SupabaseClient = SC
