import { createClient } from '@supabase/supabase-js'

// Read config from Vite env variables (see .env / .env.example).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  // Helpful during setup: makes a missing .env obvious instead of a silent failure.
  // eslint-disable-next-line no-console
  console.warn(
    '[JKCanopy] Supabase env vars missing. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '')

// True only when both env values are present, so UI can show a setup notice.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
