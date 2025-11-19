import { NextResponse } from 'next/server'
import { getEmailServices } from '@/lib/email-service'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const emailServices = getEmailServices()

    // Check if any email accounts are configured
    if (emailServices.length === 0) {
      return NextResponse.json(
        { error: 'No email accounts configured' },
        { status: 400 }
      )
    }

    console.log(`Syncing from ${emailServices.length} email account(s)...`)

    // Fetch expenses from all configured email accounts
    const fetchPromises = emailServices.map((service, index) => {
      console.log(`Fetching from email account ${index + 1}...`)
      return service.fetchUnreadExpenses()
    })

    const allExpensesArrays = await Promise.all(fetchPromises)
    const expenses = allExpensesArrays.flat()

    if (expenses.length === 0) {
      return NextResponse.json({
        message: 'No new expenses found',
        count: 0,
        expenses: [],
      })
    }

    console.log(`Found ${expenses.length} total expenses from all accounts`)

    // Insert expenses into database
    const insertResults = []
    let successful = 0
    let failed = 0
    let duplicates = 0

    for (const expense of expenses) {
      console.log(`Attempting to insert: ${expense.amount} ${expense.currency} at ${expense.merchant}`)

      const { data, error } = await supabase.from('expenses').insert([
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
      ]).select()

      if (error) {
        console.error(`Failed to insert expense:`, error)

        // Check if it's a duplicate (unique constraint violation)
        if (error.code === '23505') {
          console.log(`Duplicate expense detected (already exists in database)`)
          duplicates++
        } else {
          failed++
        }

        insertResults.push({ success: false, error: error.message, expense })
      } else {
        console.log(`✓ Successfully inserted expense with ID: ${data[0]?.id}`)
        successful++
        insertResults.push({ success: true, data, expense })
      }
    }

    console.log(`\n=== SYNC SUMMARY ===`)
    console.log(`Total parsed: ${expenses.length}`)
    console.log(`Successfully inserted: ${successful}`)
    console.log(`Duplicates skipped: ${duplicates}`)
    console.log(`Failed: ${failed}`)

    return NextResponse.json({
      message: `Synced ${successful} new expenses (${duplicates} duplicates skipped, ${failed} failed)`,
      count: successful,
      duplicates,
      failed,
      accounts: emailServices.length,
      results: insertResults,
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
