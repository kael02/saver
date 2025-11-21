import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/calorie-goals - Get active calorie goal
export async function GET(request: Request) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabaseAdmin
      .from('calorie_goals')
      .select('*')
      .lte('start_date', today)
      .or(`end_date.gte.${today},end_date.is.null`)
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching calorie goal:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no goal found, return default
    if (!data) {
      return NextResponse.json({
        daily_calories: 2000,
        protein_target: 100,
        carbs_target: 250,
        fat_target: 65,
        goal_type: 'maintenance',
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/calorie-goals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/calorie-goals - Create new calorie goal
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      daily_calories,
      protein_target,
      carbs_target,
      fat_target,
      goal_type,
      notes,
      start_date,
    } = body

    if (!daily_calories) {
      return NextResponse.json(
        { error: 'Missing required field: daily_calories' },
        { status: 400 }
      )
    }

    // End previous goals
    const today = new Date().toISOString().split('T')[0]
    await supabaseAdmin
      .from('calorie_goals')
      .update({ end_date: today })
      .is('end_date', null)

    // Create new goal
    const { data, error } = await supabaseAdmin
      .from('calorie_goals')
      .insert({
        daily_calories,
        protein_target,
        carbs_target,
        fat_target,
        goal_type: goal_type || 'maintenance',
        notes,
        start_date: start_date || today,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating calorie goal:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/calorie-goals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
