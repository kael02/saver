import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json()
    const supabase = createClient()

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Error removing subscription:', error)
      return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing unsubscribe:', error)
    return NextResponse.json({ error: 'Failed to process unsubscribe' }, { status: 500 })
  }
}
