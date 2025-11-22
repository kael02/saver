'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, type MealFilters } from './query-keys'
import type { Meal } from '../supabase'
import { toast } from 'sonner'

// Re-export Meal type for use in components
export type { Meal }

// Meal insert type for creating new meals
export interface MealInsert {
  name: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  meal_time: string
  meal_date: string
  source?: 'manual' | 'llm' | 'usda' | 'saved' | 'email'
  confidence?: 'high' | 'medium' | 'low' | null
  expense_id?: string | null
  notes?: string | null
  llm_reasoning?: string | null
  estimate?: boolean // If true, use LLM to estimate calories
  portionSize?: string // For LLM estimation context
}

export interface CalorieStats {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  mealCount: number
  averageCaloriesPerDay: number
  byMealTime: {
    breakfast: { count: number; calories: number }
    lunch: { count: number; calories: number }
    dinner: { count: number; calories: number }
    snack: { count: number; calories: number }
    other: { count: number; calories: number }
  }
  byDate: Record<string, { calories: number; protein: number; carbs: number; fat: number; meals: number }>
}

/**
 * Fetch meals with optional filters
 */
async function fetchMeals(filters?: MealFilters): Promise<Meal[]> {
  const params = new URLSearchParams()

  if (filters?.limit) params.append('limit', filters.limit.toString())
  if (filters?.offset) params.append('offset', filters.offset.toString())
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.mealTime) params.append('mealTime', filters.mealTime)

  const response = await fetch(`/api/meals?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch meals')
  }

  const data = await response.json()
  return data.meals || []
}

/**
 * Hook to fetch meals with optional filters
 */
export function useMeals(
  filters?: MealFilters,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: queryKeys.meals.list(filters),
    queryFn: () => fetchMeals(filters),
    ...options,
  })
}

/**
 * Fetch calorie stats
 */
async function fetchCalorieStats(filters?: MealFilters): Promise<CalorieStats> {
  const params = new URLSearchParams()

  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)

  const response = await fetch(`/api/calorie-stats?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch calorie stats')
  }

  return response.json()
}

/**
 * Hook to fetch calorie stats
 */
export function useCalorieStats(
  filters?: MealFilters,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: queryKeys.calorieStats.summary(filters),
    queryFn: () => fetchCalorieStats(filters),
    ...options,
  })
}

/**
 * Create meal mutation
 */
async function createMeal(meal: MealInsert): Promise<Meal> {
  const response = await fetch('/api/meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meal),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create meal')
  }

  return response.json()
}

/**
 * Hook with optimistic update for creating meals
 */
export function useCreateMealOptimistic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeal,
    onMutate: async (newMeal) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.meals.all })

      // Snapshot previous value
      const previousMeals = queryClient.getQueryData(queryKeys.meals.lists())

      // Create optimistic meal with temporary ID
      const optimisticMeal: Meal = {
        id: `temp-${Date.now()}`,
        name: newMeal.name,
        calories: newMeal.calories || 0, // Will be estimated by AI
        protein: newMeal.protein || 0,
        carbs: newMeal.carbs || 0,
        fat: newMeal.fat || 0,
        meal_time: newMeal.meal_time as any,
        meal_date: newMeal.meal_date,
        source: newMeal.source || 'manual',
        confidence: null,
        expense_id: null,
        llm_reasoning: null,
        notes: newMeal.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Optimistically update all meal lists
      queryClient.setQueriesData({ queryKey: queryKeys.meals.lists() }, (old: Meal[] | undefined) => {
        if (!old) return [optimisticMeal]
        return [optimisticMeal, ...old]
      })

      return { previousMeals }
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousMeals) {
        queryClient.setQueryData(queryKeys.meals.lists(), context.previousMeals)
      }
      toast.error(error.message || 'Failed to log meal')
    },
    onSuccess: (data) => {
      toast.success('Meal logged!', {
        description: `${data.calories} cal • ${data.protein}g protein`,
      })
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server (gets actual AI estimates)
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.calorieStats.all })
    },
  })
}

/**
 * Delete meal mutation
 */
async function deleteMeal(id: string): Promise<void> {
  const response = await fetch(`/api/meals/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete meal')
  }
}

/**
 * Hook with optimistic update for deleting meals
 */
export function useDeleteMealOptimistic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMeal,
    onMutate: async (mealId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.meals.all })

      // Snapshot previous value
      const previousMeals = queryClient.getQueryData(queryKeys.meals.lists())

      // Optimistically update all meal lists
      queryClient.setQueriesData({ queryKey: queryKeys.meals.lists() }, (old: Meal[] | undefined) => {
        if (!old) return []
        return old.filter((meal) => meal.id !== mealId)
      })

      return { previousMeals }
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousMeals) {
        queryClient.setQueryData(queryKeys.meals.lists(), context.previousMeals)
      }
      toast.error('Failed to delete meal')
    },
    onSuccess: () => {
      toast.success('Meal deleted')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.meals.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.calorieStats.all })
    },
  })
}
