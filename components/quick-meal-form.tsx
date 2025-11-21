'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, Utensils } from 'lucide-react'
import { toast } from 'sonner'

interface QuickMealFormProps {
  onMealAdded?: () => void
}

export function QuickMealForm({ onMealAdded }: QuickMealFormProps) {
  const [name, setName] = useState('')
  const [mealTime, setMealTime] = useState<string>('other')
  const [isEstimating, setIsEstimating] = useState(false)
  const [isManual, setIsManual] = useState(false)

  // Manual entry fields
  const [manualCalories, setManualCalories] = useState('')

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter a meal name')
      return
    }

    setIsEstimating(true)

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          meal_time: mealTime,
          meal_date: new Date().toISOString(),
          estimate: !isManual, // Use LLM estimation if not manual
          calories: isManual ? parseInt(manualCalories) : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to log meal')
      }

      const meal = await response.json()

      toast.success(
        `Logged: ${meal.name}`,
        {
          description: `${meal.calories} cal • ${meal.protein}g protein`,
        }
      )

      // Reset form
      setName('')
      setManualCalories('')
      onMealAdded?.()
    } catch (error) {
      console.error('Error logging meal:', error)
      toast.error('Failed to log meal')
    } finally {
      setIsEstimating(false)
    }
  }

  return (
    <Card className="frosted-card">
      <CardContent className="p-4">
        <form onSubmit={handleQuickLog} className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Quick Meal Log</h3>
          </div>

          {/* Meal name */}
          <div>
            <Input
              type="text"
              placeholder="What did you eat? (e.g., Phở bò)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base"
              disabled={isEstimating}
            />
            {!isManual && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI will estimate calories for you
              </p>
            )}
          </div>

          {/* Meal time */}
          <Select value={mealTime} onValueChange={setMealTime} disabled={isEstimating}>
            <SelectTrigger>
              <SelectValue placeholder="Meal time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
              <SelectItem value="lunch">☀️ Lunch</SelectItem>
              <SelectItem value="dinner">🌙 Dinner</SelectItem>
              <SelectItem value="snack">🍿 Snack</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Manual entry option */}
          {isManual && (
            <div>
              <Input
                type="number"
                placeholder="Calories (optional)"
                value={manualCalories}
                onChange={(e) => setManualCalories(e.target.value)}
                disabled={isEstimating}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isEstimating || !name.trim()}
            >
              {isEstimating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Estimating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Log Meal
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManual(!isManual)}
              disabled={isEstimating}
            >
              {isManual ? 'AI Mode' : 'Manual'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
