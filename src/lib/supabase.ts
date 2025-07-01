/**
 * Supabase Client Configuration
 * 
 * This file configures the Supabase client for authentication and database operations.
 */

import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tkjjsyrzzmdfdwcxqffu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrampzeXJ6em1kZmR3Y3hxZmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODQwMDQsImV4cCI6MjA2Njk2MDAwNH0.YIYP9KGIvvGe9nz1jdfPLKWEa5dumSA6pyXRm05BDiA'

console.log('Supabase URL:', supabaseUrl)
console.log('Environment variables available:', Object.keys(import.meta.env))

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[EXISTS]' : '[MISSING]')
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}) 