'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, CheckCircle, Edit2, Save, X } from 'lucide-react'
import type { Expense } from '@/lib/supabase'
import { useBudgets, useCreateBudget, useUpdateBudget } from '@/lib/hooks'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other']

interface BudgetTrackerProps {
  expenses: Expense[]
}

export function BudgetTracker({ expenses }: BudgetTrackerProps) {
  const currentMonth = new Date().toISOString().slice(0, 7)

  // Fetch budgets using TanStack Query
  const { data: budgets = [], isLoading: loading } = useBudgets({ month: currentMonth })

  // Mutation hooks
  const createBudgetMutation = useCreateBudget()
  const updateBudgetMutation = useUpdateBudget()

  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const saveBudget = async (category: string, amount: number) => {
    try {
      const existing = budgets.find((b) => b.category === category)

      if (existing) {
        await updateBudgetMutation.mutateAsync({
          id: existing.id,
          updates: { amount },
        })
      } else {
        await createBudgetMutation.mutateAsync({
          category,
          amount,
          month: currentMonth,
        })
      }

      setEditing(null)
    } catch (error) {
      console.error('Error saving budget:', error)
    }
  }

  const getCategorySpent = (category: string) => {
    const monthExpenses = expenses.filter((e) => {
      const expenseMonth = new Date(e.transaction_date).toISOString().slice(0, 7)
      return expenseMonth === currentMonth && e.category === category
    })
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  }

  const getBudgetForCategory = (category: string) => {
    return budgets.find((b) => b.category === category)?.amount || 0
  }

  const getStatus = (spent: number, budget: number) => {
    if (budget === 0) return 'none'
    const percentage = (spent / budget) * 100
    if (percentage >= 100) return 'exceeded'
    if (percentage >= 80) return 'warning'
    return 'good'
  }

  if (loading) {
    return <div className="text-center py-8">Loading budgets...</div>
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Monthly Budget</h3>
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const budget = getBudgetForCategory(category)
          const spent = getCategorySpent(category)
          const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
          const status = getStatus(spent, budget)
          const isEditing = editing === category

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category}</span>
                  {budget > 0 && (
                    <>
                      {status === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      {status === 'exceeded' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-32 h-8 text-sm"
                      placeholder="Budget"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        saveBudget(category, parseFloat(editValue))
                      }}
                      disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(spent, 'VND')} / {budget > 0 ? formatCurrency(budget, 'VND') : '—'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(category)
                        setEditValue(budget.toString())
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {budget > 0 && (
                <Progress
                  value={percentage}
                  className={`h-2 ${
                    status === 'exceeded'
                      ? '[&>div]:bg-red-500'
                      : status === 'warning'
                      ? '[&>div]:bg-yellow-500'
                      : '[&>div]:bg-green-500'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
