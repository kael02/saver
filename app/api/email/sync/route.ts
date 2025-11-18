import { NextResponse } from 'next/server'
import { getEmailService } from '@/lib/email-service'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return NextResponse.json(
        { error: 'Email credentials not configured' },
        { status: 400 }
      )
    }

    const emailService = getEmailService()
    const expenses = await emailService.fetchUnreadExpenses()

    if (expenses.length === 0) {
      return NextResponse.json({
        message: 'No new expenses found',
        count: 0,
        expenses: [],
      })
    }

    // Insert expenses into database
    const insertPromises = expenses.map((expense) =>
      supabase.from('expenses').insert([
        {
          card_number: expense.cardNumber,
          cardholder: expense.cardholder,
          transaction_type: expense.transactionType,
          amount: expense.amount,
          currency: expense.currency,
          transaction_date: expense.transactionDate,
          merchant: expense.merchant,
          source: expense.source,
          email_subject: expense.emailSubject,
        },
      ])
    )

    const results = await Promise.allSettled(insertPromises)

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      message: `Synced ${successful} expenses`,
      count: successful,
      failed,
      expenses,
    })
  } catch (error) {
    console.error('Error syncing emails:', error)
    // Never expose internal error details that might contain credentials
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return sync status and last sync time
    const { data, error } = await supabase
      .from('expenses')
      .select('created_at')
      .eq('source', 'email')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
      lastSync: data?.[0]?.created_at || null,
    })
  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    )
  }
}
