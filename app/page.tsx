'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'
import { toast } from 'sonner'
import { ExpandableExpenseCard } from '@/components/expandable-expense-card'
import { StatsCard } from '@/components/stats-card'
import { ExpenseCardSkeleton, StatsCardSkeleton } from '@/components/skeleton-loader'
import { QuickExpenseForm } from '@/components/quick-expense-form'
import { BottomNavigation } from '@/components/bottom-navigation'
import { AnalyticsCharts } from '@/components/analytics-charts'
import { BudgetTracker } from '@/components/budget-tracker'
import { SavingsGoals } from '@/components/savings-goals'
import { WeeklySummary } from '@/components/weekly-summary'
import { CategoryInsights } from '@/components/category-insights'
import { PushNotificationManager } from '@/components/push-notification-manager'
import { SearchBar } from '@/components/search-bar'
import { AnimatedCounter } from '@/components/animated-counter'
import { FloatingActionMenu } from '@/components/floating-action-menu'
import { NetworkStatus } from '@/components/network-status'
import { Onboarding } from '@/components/onboarding'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { formatCurrency, hapticFeedback } from '@/lib/utils'
import { exportToCSV } from '@/lib/export'
import { celebrateSuccess, celebrateMilestone, celebrateGoalComplete } from '@/components/confetti'
import {
  Wallet,
  TrendingDown,
  Calendar,
  Plus,
  RefreshCw,
  Loader2,
  Filter,
  ChevronDown,
  Check,
} from 'lucide-react'
import type { Expense } from '@/lib/supabase'

const QUICK_FILTERS = [
  { id: 'all', label: 'All', dateRange: 'all' as const },
  { id: 'today', label: 'Today', dateRange: 'today' as const },
  { id: 'week', label: 'Week', dateRange: 'week' as const },
  { id: 'month', label: 'Month', dateRange: 'month' as const },
]

const CATEGORY_FILTERS = ['All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other']

const VIEW_ORDER: Array<'expenses' | 'analytics' | 'budget' | 'insights'> = ['expenses', 'analytics', 'budget', 'insights']

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
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
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
      applyFilters(data.expenses || [], searchQuery)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
    }
  }

  const applyFilters = (expenseList: Expense[], search: string = searchQuery) => {
    let filtered = [...expenseList]

    // Search filter
    if (search.trim()) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter((e) =>
        e.merchant.toLowerCase().includes(lowerSearch) ||
        e.category?.toLowerCase().includes(lowerSearch) ||
        e.notes?.toLowerCase().includes(lowerSearch)
      )
    }

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
    applyFilters(expenses, searchQuery)
  }, [quickFilter, categoryFilter, searchQuery])

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

    // Check if should show onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
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

  const handleUpdateNotes = async (expense: Expense) => {
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: expense.amount,
          merchant: expense.merchant,
          category: expense.category,
          notes: expense.notes,
          transactionDate: expense.transaction_date,
          cardNumber: expense.card_number,
          cardholder: expense.cardholder,
          transactionType: expense.transaction_type,
          currency: expense.currency,
        }),
      })

      if (!response.ok) throw new Error('Failed to update notes')

      await fetchExpenses()
      toast.success('Notes updated')
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('Failed to update notes')
    }
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
      celebrateSuccess() // Celebrate first expense
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

      setLastSynced(new Date())
      hapticFeedback('medium')
      toast.success(`Synced ${data.count || 0} new expenses`)

      if (data.count > 0) {
        celebrateSuccess()
      }
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

  // Gesture navigation - swipe between views
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = VIEW_ORDER.indexOf(activeView as any)
      if (currentIndex < VIEW_ORDER.length - 1) {
        setActiveView(VIEW_ORDER[currentIndex + 1])
        hapticFeedback('light')
      }
    },
    onSwipedRight: () => {
      const currentIndex = VIEW_ORDER.indexOf(activeView as any)
      if (currentIndex > 0) {
        setActiveView(VIEW_ORDER[currentIndex - 1])
        hapticFeedback('light')
      }
    },
    trackMouse: false,
    trackTouch: true,
  })

  const todayExpenses = expenses.filter((e) => {
    const today = new Date().toDateString()
    const expenseDate = new Date(e.transaction_date).toDateString()
    return today === expenseDate
  })

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div
      ref={contentRef}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-36 overflow-auto overscroll-behavior-none"
      style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...(activeView === 'expenses' ? {} : swipeHandlers)}
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

      {/* Header - iOS Safe Area Optimized */}
      <motion.div
        animate={{
          paddingBottom: scrolled ? '1.25rem' : '2rem',
        }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 frosted-card px-5 pt-safe-top pb-8 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-3 pt-4">
          <div>
            <h1 className="text-3xl font-bold text-high-contrast">Expenses</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {activeView === 'expenses' ? 'Track spending' : activeView === 'analytics' ? 'View insights' : activeView === 'budget' ? 'Manage budget' : activeView === 'goals' ? 'Savings goals' : activeView === 'summary' ? 'Weekly report' : 'Spending patterns'}
            </p>
          </div>
        </div>

        {/* Today's Total */}
        <motion.div
          animate={{
            opacity: scrolled ? 0 : 1,
            height: scrolled ? 0 : 'auto',
            marginTop: scrolled ? 0 : '1.25rem',
          }}
          transition={{ duration: 0.3 }}
          className="glass rounded-2xl p-6 overflow-hidden"
        >
          <p className="text-muted-foreground text-sm mb-2.5">Today's Spending</p>
          <p className="text-5xl font-bold leading-tight">
            <AnimatedCounter value={todayTotal} prefix="₫ " duration={1200} />
          </p>
          <p className="text-muted-foreground text-base mt-3">
            {todayExpenses.length} {todayExpenses.length === 1 ? 'expense' : 'expenses'}
          </p>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      {loading ? (
        <div className="px-5 mt-6 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
        </div>
      ) : stats && (
        <div className="px-5 mt-6 mb-6">
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
        <div className="px-5 mb-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-base text-blue-700 dark:text-blue-400">{syncProgress}</span>
          </div>
        </div>
      )}

      {/* Content based on active view */}
      <div className="px-5">
        {activeView === 'expenses' && (
          <>
            {/* Search and Filter Bar - iOS optimized */}
            <div className="mb-6 flex gap-3">
              <div className="flex-1">
                <SearchBar
                  expenses={expenses}
                  onSearch={(query) => setSearchQuery(query)}
                />
              </div>

              {/* Filter Button */}
              <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
                <SheetTrigger asChild>
                  <Button
                    variant={(quickFilter !== 'all' || categoryFilter !== 'All') ? 'default' : 'outline'}
                    className="ripple-effect min-h-[48px] gap-2 whitespace-nowrap px-4"
                    onClick={() => hapticFeedback('light')}
                  >
                    <Filter className="h-5 w-5" />
                    {(quickFilter !== 'all' || categoryFilter !== 'All') && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh]">
                  <SheetHeader className="mb-6">
                    <SheetTitle>Filter Expenses</SheetTitle>
                  </SheetHeader>

                  {/* Time Range Section */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Time Range</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_FILTERS.map((filter) => (
                        <Button
                          key={filter.id}
                          variant={quickFilter === filter.id ? 'default' : 'outline'}
                          size="lg"
                          className="min-h-[56px] text-base"
                          onClick={() => {
                            setQuickFilter(filter.id)
                            hapticFeedback('medium')
                          }}
                        >
                          {quickFilter === filter.id && <Check className="h-5 w-5 mr-2" />}
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Category Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Category</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORY_FILTERS.map((cat) => (
                        <Button
                          key={cat}
                          variant={categoryFilter === cat ? 'default' : 'outline'}
                          size="lg"
                          className="min-h-[56px] text-base"
                          onClick={() => {
                            setCategoryFilter(cat)
                            hapticFeedback('medium')
                          }}
                        >
                          {categoryFilter === cat && <Check className="h-5 w-5 mr-2" />}
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 min-h-[52px]"
                      onClick={() => {
                        setQuickFilter('all')
                        setCategoryFilter('All')
                        hapticFeedback('light')
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 min-h-[52px]"
                      onClick={() => {
                        setShowFilterSheet(false)
                        hapticFeedback('medium')
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-high-contrast">
                {filteredExpenses.length === expenses.length
                  ? 'All Expenses'
                  : `${filteredExpenses.length} of ${expenses.length}`}
              </h2>
              {filteredExpenses.length > 10 && (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => {
                    setShowAllExpenses(!showAllExpenses)
                    hapticFeedback('light')
                  }}
                  className="gap-2 ripple-effect min-h-[44px] px-4"
                >
                  <Calendar className="w-4 h-4" />
                  {showAllExpenses ? 'Less' : 'All'}
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
              <div className="text-8xl mb-4">💸</div>
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="text-muted-foreground text-sm mb-8">
                Track your spending automatically or add manually
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                <Button onClick={() => setShowForm(true)} size="lg" className="gap-2 ripple-effect min-h-[52px] text-base">
                  <Plus className="h-5 w-5" />
                  Add Expense
                </Button>
                <Button variant="outline" onClick={handleSync} disabled={syncing} size="lg" className="gap-2 ripple-effect min-h-[52px] text-base">
                  <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Emails
                </Button>
              </div>
            </motion.div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground mb-6">No expenses match your filters</p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setQuickFilter('all')
                  setCategoryFilter('All')
                  setSearchQuery('')
                  hapticFeedback('light')
                }}
                className="ripple-effect min-h-[48px] text-base"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <AnimatePresence mode="popLayout">
                {(showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 10)).map((expense) => (
                  <ExpandableExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onUpdate={handleUpdateNotes}
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

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onAddExpense={() => {
          setEditingExpense(undefined)
          setShowForm(true)
        }}
        onSyncEmails={handleSync}
        onExport={() => {
          exportToCSV(expenses, `expenses-${new Date().toISOString().slice(0, 10)}.csv`)
          toast.success('Exported to CSV')
          hapticFeedback('light')
        }}
        syncing={syncing}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Network Status */}
      <NetworkStatus syncing={syncing} lastSynced={lastSynced} />

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

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding
          onComplete={() => setShowOnboarding(false)}
          onAddExpense={() => {
            setShowForm(true)
            setShowOnboarding(false)
          }}
          onSyncEmails={() => {
            handleSync()
            setShowOnboarding(false)
          }}
        />
      )}
    </div>
  )
}
