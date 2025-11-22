'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Flame, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { AnimatedCounter } from '@/components/animated-counter'

interface CalorieGoal {
  daily_calories: number
  protein_target?: number
  carbs_target?: number
  fat_target?: number
}

interface DailyStats {
  calories: number
  protein: number
  carbs: number
  fat: number
  meals: number
}

export function CalorieTracker() {
  const [goal, setGoal] = useState<CalorieGoal | null>(null)
  const [today, setToday] = useState<DailyStats>({ calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch calorie goal
      const goalRes = await fetch('/api/calorie-goals')

      // Check for authentication error
      if (goalRes.status === 401) {
        console.log('User not authenticated for calorie tracking')
        setGoal(null)
        setLoading(false)
        return
      }

      if (!goalRes.ok) {
        throw new Error(`Failed to fetch goal: ${goalRes.statusText}`)
      }

      const goalData = await goalRes.json()
      setGoal(goalData)

      // Fetch today's stats
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const statsRes = await fetch(
        `/api/calorie-stats?startDate=${todayStart.toISOString()}&endDate=${todayEnd.toISOString()}`
      )

      if (statsRes.status === 401) {
        console.log('User not authenticated for calorie stats')
        setLoading(false)
        return
      }

      if (!statsRes.ok) {
        throw new Error(`Failed to fetch stats: ${statsRes.statusText}`)
      }

      const statsData = await statsRes.json()

      // Get today's totals
      const todayDate = todayStart.toISOString().split('T')[0]
      const todayStats = statsData.byDate?.[todayDate] || { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 }
      setToday(todayStats)
    } catch (error) {
      console.error('Error fetching calorie data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  if (!goal) return null

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
