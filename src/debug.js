// Debug: Verificar variables de entorno
console.log('=== DEBUG VARIABLES DE ENTORNO ===')
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('==================================')

// Test Supabase connection
import { supabase } from './lib/supabase.js'
console.log('Supabase client:', supabase)

// Test auth
supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session data:', data)
    console.log('Session error:', error)
})