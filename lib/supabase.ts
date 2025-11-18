import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Expense = {
  id: string
  card_number: string
  cardholder: string
  transaction_type: string
  amount: number
  currency: string
  transaction_date: string
  merchant: string
  category?: string
  notes?: string
  source: 'manual' | 'email'
  email_subject?: string
  created_at: string
  updated_at: string
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
