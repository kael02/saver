'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ExpenseCard } from '@/components/expense-card'
import { StatsCard } from '@/components/stats-card'
import { ExpenseCardSkeleton, StatsCardSkeleton } from '@/components/skeleton-loader'
import { QuickExpenseForm } from '@/components/quick-expense-form'
import { NavigationMenu } from '@/components/navigation-menu'
import { AnalyticsCharts } from '@/components/analytics-charts'
import { BudgetTracker } from '@/components/budget-tracker'
import { SavingsGoals } from '@/components/savings-goals'
import { WeeklySummary } from '@/components/weekly-summary'
import { CategoryInsights } from '@/components/category-insights'
import { ExpenseFilters, type FilterState } from '@/components/expense-filters'
import { PushNotificationManager } from '@/components/push-notification-manager'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, hapticFeedback } from '@/lib/utils'
import { exportToCSV } from '@/lib/export'
import {
  Wallet,
  TrendingDown,
  Calendar,
  Plus,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import type { Expense } from '@/lib/supabase'

const QUICK_FILTERS = [
  { id: 'all', label: 'All', dateRange: 'all' as const },
  { id: 'today', label: 'Today', dateRange: 'today' as const },
  { id: 'week', label: 'Week', dateRange: 'week' as const },
  { id: 'month', label: 'Month', dateRange: 'month' as const },
]

const CATEGORY_FILTERS = ['All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other']

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<string>('')
  const [showAllExpenses, setShowAllExpenses] = useState(false)
  const [activeView, setActiveView] = useState<'expenses' | 'analytics' | 'budget' | 'goals' | 'summary' | 'insights'>('expenses')
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletedExpense, setDeletedExpense] = useState<{expense: Expense, index: number} | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const touchStart = useRef(0)
  const [scrolled, setScrolled] = useState(false)
  const lastScrollY = useRef(0)

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      setExpenses(data.expenses || [])
      applyFilters(data.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    }
  }

  const applyFilters = (expenseList: Expense[]) => {
    let filtered = [...expenseList]

    // Category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter((e) => e.category === categoryFilter)
    }

    // Date range filter
    const now = new Date()
    if (quickFilter === 'today') {
      filtered = filtered.filter((e) => {
        const expenseDate = new Date(e.transaction_date).toDateString()
        return expenseDate === now.toDateString()
      })
    } else if (quickFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter((e) => new Date(e.transaction_date) >= weekAgo)
    } else if (quickFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter((e) => new Date(e.transaction_date) >= monthAgo)
    }

    setFilteredExpenses(filtered)
  }

  useEffect(() => {
    applyFilters(expenses)
  }, [quickFilter, categoryFilter])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
    fetchStats()
  }, [])

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const currentScrollY = contentRef.current.scrollTop

      if (currentScrollY > 100) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }

      lastScrollY.current = currentScrollY
    }

    const ref = contentRef.current
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (ref) {
        ref.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  const handleDelete = async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id)
    if (!expenseToDelete) return

    const index = expenses.findIndex(e => e.id === id)

    // Optimistic update
    setExpenses(prev => prev.filter(e => e.id !== id))
    applyFilters(expenses.filter(e => e.id !== id))
    hapticFeedback('medium')

    // Store for undo
    setDeletedExpense({ expense: expenseToDelete, index })

    // Show undo toast
    toast.success('Expense deleted', {
      action: {
        label: 'Undo',
        onClick: () => handleUndoDelete(),
      },
      duration: 5000,
    })

    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      await fetchStats()

      // Clear undo after successful delete
      setTimeout(() => setDeletedExpense(null), 5000)
    } catch (error) {
      // Rollback on error
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
      if (expenseToDelete) {
        setExpenses(prev => {
          const newExpenses = [...prev]
          newExpenses.splice(index, 0, expenseToDelete)
          return newExpenses
        })
        applyFilters(expenses)
      }
    }
  }

  const handleUndoDelete = async () => {
    if (!deletedExpense) return

    hapticFeedback('light')

    // Restore optimistically
    setExpenses(prev => {
      const newExpenses = [...prev]
      newExpenses.splice(deletedExpense.index, 0, deletedExpense.expense)
      return newExpenses
    })
    applyFilters(expenses)

    try {
      // Re-create the expense
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: deletedExpense.expense.amount,
          merchant: deletedExpense.expense.merchant,
          category: deletedExpense.expense.category,
          notes: deletedExpense.expense.notes,
          transactionDate: deletedExpense.expense.transaction_date,
          cardNumber: deletedExpense.expense.card_number,
          cardholder: deletedExpense.expense.cardholder,
          transactionType: deletedExpense.expense.transaction_type,
          currency: deletedExpense.expense.currency,
          source: deletedExpense.expense.source,
        }),
      })

      toast.success('Expense restored')
      await fetchExpenses()
      await fetchStats()
      setDeletedExpense(null)
    } catch (error) {
      console.error('Error restoring expense:', error)
      toast.error('Failed to restore expense')
      setExpenses(prev => prev.filter(e => e.id !== deletedExpense.expense.id))
      applyFilters(expenses)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
    hapticFeedback('light')
  }

  const handleSubmit = async (data: any) => {
    hapticFeedback('medium')

    const tempId = `temp-${Date.now()}`
    const optimisticExpense: Expense = {
      id: editingExpense?.id || tempId,
      amount: data.amount,
      merchant: data.merchant,
      category: data.category,
      notes: data.notes,
      transaction_date: data.transactionDate,
      card_number: data.cardNumber,
      cardholder: data.cardholder,
      transaction_type: data.transactionType,
      currency: data.currency,
      source: editingExpense?.source || 'manual',
      created_at: editingExpense?.created_at || new Date().toISOString(),
    }

    // Optimistic update
    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? optimisticExpense : e))
    } else {
      setExpenses(prev => [optimisticExpense, ...prev])
    }
    applyFilters(expenses)

    setShowForm(false)
    setEditingExpense(undefined)

    toast.promise(
      async () => {
        const response = editingExpense
          ? await fetch(`/api/expenses/${editingExpense.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
          : await fetch('/api/expenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, source: 'manual' }),
            })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save expense')
        }

        await fetchExpenses()
        await fetchStats()
      },
      {
        loading: editingExpense ? 'Updating...' : 'Adding...',
        success: editingExpense ? 'Expense updated!' : 'Expense added!',
        error: (err) => {
          // Rollback on error
          if (editingExpense) {
            const original = expenses.find(e => e.id === editingExpense.id)
            if (original) {
              setExpenses(prev => prev.map(e => e.id === editingExpense.id ? original : e))
            }
          } else {
            setExpenses(prev => prev.filter(e => e.id !== tempId))
          }
          applyFilters(expenses)
          return err.message || 'Failed to save expense'
        },
      }
    )
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncProgress('Starting sync...')
    hapticFeedback('light')

    try {
      const response = await fetch('/api/email/sync', { method: 'POST' })
      const data = await response.json()

      setSyncProgress(`Found ${data.count || 0} new expenses...`)

      await fetchExpenses()
      await fetchStats()

      hapticFeedback('medium')
      toast.success(`Synced ${data.count || 0} new expenses`)
    } catch (error) {
      console.error('Error syncing:', error)
      toast.error('Failed to sync emails')
    } finally {
      setSyncing(false)
      setSyncProgress('')
    }
  }

  // Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop === 0 && activeView === 'expenses') {
      touchStart.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current && activeView === 'expenses') {
      const pull = e.touches[0].clientY - touchStart.current
      if (pull > 0) {
        setPullDistance(Math.min(pull, 100))
      }
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 70 && !isRefreshing) {
      setIsRefreshing(true)
      hapticFeedback('medium')
      await fetchExpenses()
      await fetchStats()
      setIsRefreshing(false)
      toast.success('Refreshed!')
    }
    setPullDistance(0)
    touchStart.current = 0
  }

  const todayExpenses = expenses.filter((e) => {
    const today = new Date().toDateString()
    const expenseDate = new Date(e.transaction_date).toDateString()
    return today === expenseDate
  })

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div
      ref={contentRef}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-24 overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: pullDistance / 70, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 flex justify-center pt-2 z-50 pointer-events-none"
          >
            <div className="bg-card rounded-full p-2 shadow-lg">
              <RefreshCw className={`h-5 w-5 ${pullDistance > 70 ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        animate={{
          paddingBottom: scrolled ? '1rem' : '2.5rem',
        }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 text-white p-4 pb-10 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <NavigationMenu
              activeView={activeView}
              onViewChange={setActiveView}
              onExport={() => {
                exportToCSV(expenses, `expenses-${new Date().toISOString().slice(0, 10)}.csv`)
                toast.success('Exported to CSV')
                hapticFeedback('light')
              }}
              onSync={handleSync}
              syncing={syncing}
            />
            <div>
              <h1 className="text-2xl font-bold">Expenses</h1>
              <p className="text-blue-100 dark:text-blue-200 text-xs">
                {activeView === 'expenses' ? 'Track spending' : activeView === 'analytics' ? 'View insights' : activeView === 'budget' ? 'Manage budget' : activeView === 'goals' ? 'Savings goals' : activeView === 'summary' ? 'Weekly report' : 'Spending patterns'}
              </p>
            </div>
          </div>
        </div>

        {/* Today's Total */}
        <motion.div
          animate={{
            opacity: scrolled ? 0 : 1,
            height: scrolled ? 0 : 'auto',
            marginTop: scrolled ? 0 : '1rem',
          }}
          transition={{ duration: 0.3 }}
          className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 overflow-hidden"
        >
          <p className="text-blue-100 text-sm mb-2">Today's Spending</p>
          <p className="text-4xl font-bold">
            {formatCurrency(todayTotal, 'VND')}
          </p>
          <p className="text-blue-100 text-sm mt-2">
            {todayExpenses.length} {todayExpenses.length === 1 ? 'expense' : 'expenses'}
          </p>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      {loading ? (
        <div className="px-4 -mt-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        </div>
      ) : stats && (
        <div className="px-4 -mt-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <StatsCard
              title="Total"
              value={formatCurrency(stats.total, 'VND')}
              icon={Wallet}
              description={`${stats.count} total`}
              index={0}
            />
            <StatsCard
              title="Top Merchant"
              value={stats.topMerchants?.[0]?.merchant?.slice(0, 15) || 'N/A'}
              icon={TrendingDown}
              description={
                stats.topMerchants?.[0]
                  ? formatCurrency(stats.topMerchants[0].amount, 'VND')
                  : 'No data'
              }
              index={1}
            />
          </div>
        </div>
      )}

      {/* Sync Progress */}
      {syncing && syncProgress && (
        <div className="px-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-400">{syncProgress}</span>
          </div>
        </div>
      )}

      {/* Content based on active view */}
      <div className="px-4">
        {activeView === 'expenses' && (
          <>
            {/* Quick Filter Chips */}
            <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {QUICK_FILTERS.map((filter) => (
                <Badge
                  key={filter.id}
                  variant={quickFilter === filter.id ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => {
                    setQuickFilter(filter.id)
                    hapticFeedback('light')
                  }}
                >
                  {filter.label}
                </Badge>
              ))}
              <div className="border-l border-border mx-2" />
              {CATEGORY_FILTERS.map((cat) => (
                <Badge
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => {
                    setCategoryFilter(cat)
                    hapticFeedback('light')
                  }}
                >
                  {cat}
                </Badge>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {filteredExpenses.length === expenses.length
                  ? 'All Expenses'
                  : `${filteredExpenses.length} of ${expenses.length} expenses`}
              </h2>
              {filteredExpenses.length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllExpenses(!showAllExpenses)}
                  className="gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {showAllExpenses ? 'Show Less' : 'View All'}
                </Button>
              )}
            </div>
          </>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <ExpenseCardSkeleton key={i} />
            ))}
          </div>
        ) : activeView === 'expenses' ? (
          expenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 px-4"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Wallet className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Track your spending automatically or add manually
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
                <Button variant="outline" onClick={handleSync} disabled={syncing} className="gap-2">
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Emails
                </Button>
              </div>
            </motion.div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No expenses match your filters</p>
              <Button
                variant="outline"
                onClick={() => {
                  setQuickFilter('all')
                  setCategoryFilter('All')
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {(showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 10)).map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        ) : activeView === 'analytics' ? (
          <AnalyticsCharts expenses={expenses} />
        ) : activeView === 'budget' ? (
          <BudgetTracker expenses={expenses} />
        ) : activeView === 'goals' ? (
          <SavingsGoals />
        ) : activeView === 'summary' ? (
          <WeeklySummary expenses={expenses} />
        ) : activeView === 'insights' ? (
          <CategoryInsights expenses={expenses} />
        ) : null}
      </div>

      {/* Floating Add Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-8 right-6 z-50 sm:bottom-6"
      >
        <Button
          size="lg"
          onClick={() => {
            setEditingExpense(undefined)
            setShowForm(true)
            hapticFeedback('light')
          }}
          className="h-16 w-16 sm:h-14 sm:w-14 rounded-full shadow-2xl hover:shadow-xl transition-all bg-gradient-to-br from-blue-600 to-purple-600 hover:scale-110"
        >
          <Plus className="h-8 w-8 sm:h-7 sm:w-7" />
        </Button>
      </motion.div>

      {/* Expense Form Modal */}
      <AnimatePresence>
        {showForm && (
          <QuickExpenseForm
            expense={editingExpense}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingExpense(undefined)
            }}
          />
        )}
      </AnimatePresence>

      {/* Push Notification Manager */}
      <PushNotificationManager />
    </div>
  )
}
