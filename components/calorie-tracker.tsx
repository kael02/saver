'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Flame, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { AnimatedCounter } from '@/components/animated-counter'
import { useCalorieGoal, useCalorieStats } from '@/lib/hooks'

interface DailyStats {
  calories: number
  protein: number
  carbs: number
  fat: number
  meals: number
}

export function CalorieTracker() {
  // Use React Query hooks for automatic cache management
  const { data: goal, isLoading: loadingGoal, error: goalError } = useCalorieGoal()

  // Get today's date range for stats
  const { todayStart, todayEnd } = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return {
      todayStart: start.toISOString(),
      todayEnd: end.toISOString(),
    }
  }, [])

  const { data: statsData, isLoading: loadingStats, error: statsError } = useCalorieStats({
    startDate: todayStart,
    endDate: todayEnd,
  })

  // Debug logging
  console.log('🔍 CalorieTracker Debug:', {
    loadingGoal,
    loadingStats,
    goal,
    goalError,
    statsError,
    statsData,
  })

  // Extract today's stats from the response
  const today = useMemo<DailyStats>(() => {
    if (!statsData?.byDate) {
      console.log('⚠️ No statsData.byDate, returning zeros')
      return { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 }
    }

    // Get today's date in local timezone (YYYY-MM-DD)
    const todayDate = new Date()
    const year = todayDate.getFullYear()
    const month = String(todayDate.getMonth() + 1).padStart(2, '0')
    const day = String(todayDate.getDate()).padStart(2, '0')
    const todayDateLocal = `${year}-${month}-${day}`

    // Also check UTC date as fallback
    const todayDateUTC = new Date().toISOString().split('T')[0]

    console.log('📅 Date debug:', { todayDateLocal, todayDateUTC, byDate: statsData.byDate })

    // Try local date first, fallback to UTC date
    return (
      statsData.byDate[todayDateLocal] ||
      statsData.byDate[todayDateUTC] ||
      { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 }
    )
  }, [statsData])

  // Show loading state
  if (loadingGoal || loadingStats) {
    console.log('⏳ CalorieTracker loading...')
    return (
      <Card className="frosted-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If no goal is set, don't show the tracker (user hasn't set up calorie tracking yet)
  if (!goal) {
    console.log('❌ No calorie goal found, hiding tracker')
    return null
  }

  console.log('✅ CalorieTracker rendering with goal:', goal, 'and today:', today)

  const progress = (today.calories / goal.daily_calories) * 100
  const remaining = goal.daily_calories - today.calories
  const isOverBudget = remaining < 0

  return (
    <Card className="frosted-card border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="w-5 h-5 text-orange-500" />
          Today's Calories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main calorie counter */}
        <div className="text-center space-y-2">
          <div className="flex items-end justify-center gap-2">
            <AnimatedCounter
              value={today.calories}
              className="text-4xl font-bold"
            />
            <span className="text-muted-foreground text-lg mb-1">
              / {goal.daily_calories.toLocaleString()}
            </span>
          </div>

          <Progress value={Math.min(progress, 100)} className="h-3" />

          <div className="flex items-center justify-center gap-2">
            {isOverBudget ? (
              <>
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {Math.abs(remaining).toLocaleString()} cal over budget
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {remaining.toLocaleString()} cal remaining
                </span>
              </>
            )}
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
          {/* Protein */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Protein</div>
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              {Math.round(today.protein)}g
            </div>
            {goal.protein_target && (
              <div className="text-xs text-muted-foreground">
                / {goal.protein_target}g
              </div>
            )}
          </div>

          {/* Carbs */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Carbs</div>
            <div className="font-semibold text-amber-600 dark:text-amber-400">
              {Math.round(today.carbs)}g
            </div>
            {goal.carbs_target && (
              <div className="text-xs text-muted-foreground">
                / {goal.carbs_target}g
              </div>
            )}
          </div>

          {/* Fat */}
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Fat</div>
            <div className="font-semibold text-green-600 dark:text-green-400">
              {Math.round(today.fat)}g
            </div>
            {goal.fat_target && (
              <div className="text-xs text-muted-foreground">
                / {goal.fat_target}g
              </div>
            )}
          </div>
        </div>

        {/* Meal count */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4" />
          <span>{today.meals} meals logged today</span>
        </div>
      </CardContent>
    </Card>
  )
}
