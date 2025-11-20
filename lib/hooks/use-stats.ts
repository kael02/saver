'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys'
import { toast } from 'sonner'

/**
 * Stats/Analytics data interface
 */
export interface StatsData {
  totalExpenses: number
  totalCount: number
  averageExpense: number
  categoryBreakdown: Array<{
    category: string
    total: number
    count: number
    percentage: number
  }>
  merchantBreakdown: Array<{
    merchant: string
    total: number
    count: number
  }>
  dailyTrend: Array<{
    date: string
    total: number
    count: number
  }>
  monthlyComparison?: {
    currentMonth: number
    previousMonth: number
    percentageChange: number
  }
}

/**
 * Fetch analytics/stats data
 */
async function fetchStats(period?: string): Promise<StatsData> {
  const params = new URLSearchParams()

  if (period) params.append('period', period)

  const response = await fetch(`/api/stats?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch stats')
  }

  return response.json()
}

/**
 * Hook to fetch analytics/stats data
 *
 * @param period - Optional period filter (e.g., 'week', 'month', 'year')
 * @param options - React Query options
 *
 * @example
 * const { data: stats, isLoading } = useStats()
 *
 * @example
 * const { data: monthlyStats } = useStats('month')
 */
export function useStats(
  period?: string,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: queryKeys.stats.summary(period),
    queryFn: () => fetchStats(period),
    ...options,
  })
}

/**
 * Email sync response interface
 */
export interface EmailSyncResponse {
  success: boolean
  newExpenses: number
  duplicates: number
  errors: string[]
}

/**
 * Email sync mutation
 */
async function syncEmails(days?: number): Promise<EmailSyncResponse> {
  const response = await fetch('/api/email/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days: days || 7 }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to sync emails')
  }

  return response.json()
}

/**
 * Hook to trigger email sync
 *
 * @example
 * const { mutate: syncEmails, isPending } = useEmailSync()
 *
 * // Sync last 7 days
 * syncEmails()
 *
 * // Sync last 30 days
 * syncEmails(30)
 */
export function useEmailSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncEmails,
    onSuccess: (data) => {
      // Invalidate expenses and stats queries after sync
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all })

      if (data.newExpenses > 0) {
        toast.success(`Synced ${data.newExpenses} new expense${data.newExpenses > 1 ? 's' : ''}`)
      } else {
        toast.info('No new expenses found')
      }

      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} error${data.errors.length > 1 ? 's' : ''} occurred during sync`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to sync emails')
    },
  })
}
