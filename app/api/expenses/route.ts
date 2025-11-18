import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all expenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '100'
    const offset = searchParams.get('offset') || '0'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const merchant = searchParams.get('merchant')
    const category = searchParams.get('category')

    let query = supabase
      .from('expenses')
      .select('*')
      .order('transaction_date', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (startDate) {
      query = query.gte('transaction_date', startDate)
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate)
    }

    if (merchant) {
      query = query.ilike('merchant', `%${merchant}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ expenses: data })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST create new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          card_number: body.cardNumber,
          cardholder: body.cardholder,
          transaction_type: body.transactionType,
          amount: body.amount,
          currency: body.currency || 'VND',
          transaction_date: body.transactionDate,
          merchant: body.merchant,
          category: body.category,
          notes: body.notes,
          source: body.source || 'manual',
          email_subject: body.emailSubject,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ expense: data[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
