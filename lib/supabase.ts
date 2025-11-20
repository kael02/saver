import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client for frontend (respects RLS policies)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Admin client for backend operations (bypasses RLS)
// Use this ONLY in API routes, never expose to frontend
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export type Expense = {
  id: string
  user_id?: string | null  // Added for authentication
  card_number: string | null
  cardholder: string | null
  transaction_type: string | null
  amount: number
  currency: string
  transaction_date: string
  merchant: string
  category?: string | null
  notes?: string | null
  source: string
  email_subject?: string | null
  created_at: string | null
  updated_at: string | null
}

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
