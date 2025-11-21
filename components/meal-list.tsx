'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Coffee,
  Sun,
  Moon,
  Apple,
  Trash2,
  TrendingUp,
  Sparkles,
  ShoppingBag
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { Meal } from '@/lib/supabase'

interface MealListProps {
  meals: (Meal & { expenses?: any })[]
  onMealDeleted?: () => void
}

const MEAL_TIME_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Apple,
  other: Apple,
}

const MEAL_TIME_COLORS = {
  breakfast: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  lunch: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  dinner: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
  snack: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  other: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
}

const CONFIDENCE_BADGES = {
  high: { color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300', label: 'High confidence' },
  medium: { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300', label: 'Medium confidence' },
  low: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300', label: 'Low confidence' },
}

export function MealList({ meals, onMealDeleted }: MealListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this meal?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/meals/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Meal deleted')
      onMealDeleted?.()
    } catch (error) {
      console.error('Error deleting meal:', error)
      toast.error('Failed to delete meal')
    } finally {
      setDeletingId(null)
    }
  }

  if (meals.length === 0) {
    return (
      <Card className="frosted-card">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Apple className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No meals logged yet</p>
          <p className="text-sm mt-1">Start tracking your meals above</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {meals.map((meal) => {
        const Icon = MEAL_TIME_ICONS[meal.meal_time] || Apple
        const colorClass = MEAL_TIME_COLORS[meal.meal_time] || MEAL_TIME_COLORS.other

        return (
          <Card
            key={meal.id}
            className={`frosted-card border-l-4 ${
              meal.source === 'email' ? 'border-l-purple-500' : 'border-l-blue-500'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base leading-tight mb-1">
                        {meal.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(meal.meal_date), 'h:mm a')}</span>
                        <span>•</span>
                        <span className="capitalize">{meal.meal_time}</span>
                        {meal.expense_id && (
                          <>
                            <span>•</span>
                            <ShoppingBag className="w-3 h-3" />
                            <span className="text-xs">Linked to expense</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Calories */}
                    <div className="text-right">
                      <div className="font-bold text-lg text-primary">
                        {meal.calories.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">calories</div>
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="flex items-center gap-3 mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">P:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {Math.round(meal.protein)}g
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">C:</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {Math.round(meal.carbs)}g
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">F:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {Math.round(meal.fat)}g
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {meal.source === 'email' && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        Auto-tracked
                      </Badge>
                    )}
                    {meal.source === 'llm' && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Estimated
                      </Badge>
                    )}
                    {meal.confidence && CONFIDENCE_BADGES[meal.confidence] && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${CONFIDENCE_BADGES[meal.confidence].color}`}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {CONFIDENCE_BADGES[meal.confidence].label}
                      </Badge>
                    )}
                  </div>

                  {/* Notes/Reasoning */}
                  {(meal.notes || meal.llm_reasoning) && (
                    <div className="mt-2 text-xs text-muted-foreground italic">
                      {meal.notes || meal.llm_reasoning}
                    </div>
                  )}

                  {/* Delete button */}
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(meal.id)}
                      disabled={deletingId === meal.id}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
