import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration is missing. Please check your .env file.')
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
}

// Verify URL format
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  console.error('❌ VITE_SUPABASE_URL must be a valid URL starting with http:// or https://')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Reduce automatic retries to prevent error flooding
    retryAttempts: 3,
    // Add network timeout
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'bottarot-frontend'
    }
  }
})