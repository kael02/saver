'use client'

import { AnalyticsCharts } from '@/components/analytics-charts';
import { AnimatedCounter } from '@/components/animated-counter';
import { BottomNavigation } from '@/components/bottom-navigation';
import { BudgetTracker } from '@/components/budget-tracker';
import { CategoryInsights } from '@/components/category-insights';
import { celebrateSuccess } from '@/components/confetti';
import { ExpandableExpenseCard } from '@/components/expandable-expense-card';
import { FloatingActionMenu } from '@/components/floating-action-menu';
import { NetworkStatus } from '@/components/network-status';
import { Onboarding } from '@/components/onboarding';
import { ProgressIndicator } from '@/components/progress-indicator';
import { PushNotificationManager } from '@/components/push-notification-manager';
import { QuickExpenseForm } from '@/components/quick-expense-form';
import { SavingsGoals } from '@/components/savings-goals';
import { SearchBar } from '@/components/search-bar';
import {
  BudgetCardSkeleton,
  ChartSkeleton,
  ExpenseCardSkeleton,
  InsightCardSkeleton,
  StatsCardSkeleton,
} from '@/components/skeleton-loader';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import { WeeklySummary } from '@/components/weekly-summary';
import { exportToCSV } from '@/lib/export';
import {
  useExpenses,
  useStats,
  useBudgets,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useEmailSync,
} from '@/lib/hooks';
import type { Expense } from '@/lib/supabase';
import { formatCurrency, hapticFeedback } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Filter,
  Plus,
  RefreshCw,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const QUICK_FILTERS = [
  { id: 'all', label: 'All', dateRange: 'all' as const },
  { id: 'today', label: 'Today', dateRange: 'today' as const },
  { id: 'week', label: 'Week', dateRange: 'week' as const },
  { id: 'month', label: 'Month', dateRange: 'month' as const },
];

const CATEGORY_FILTERS = [
  'All',
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Other',
];

const VIEW_ORDER: Array<'expenses' | 'analytics' | 'budget' | 'insights'> = [
  'expenses',
  'analytics',
  'budget',
  'insights',
];

export default function Home() {
  // TanStack Query hooks for server state
  const { data: expenses = [], isLoading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStats();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets({ month: currentMonth });

  // Mutations
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const emailSyncMutation = useEmailSync();

  // Derived loading state
  const loading = expensesLoading || statsLoading || budgetsLoading;

  // Client-side state (UI and filtering)
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [syncProgress, setSyncProgress] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [syncDetail, setSyncDetail] = useState<string>('');
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [activeView, setActiveView] = useState<
    'expenses' | 'analytics' | 'budget' | 'goals' | 'summary' | 'insights'
  >('expenses');
  const [quickFilter, setQuickFilter] = useState<
    'all' | 'today' | 'week' | 'month'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletedExpense, setDeletedExpense] = useState<{
    expense: Expense;
    index: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStart = useRef(0);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);

  const applyFilters = (
    expenseList: Expense[],
    search: string = searchQuery
  ) => {
    let filtered = [...expenseList];

    // Search filter
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.merchant.toLowerCase().includes(lowerSearch) ||
          e.category?.toLowerCase().includes(lowerSearch) ||
          e.notes?.toLowerCase().includes(lowerSearch)
      );
    }

    // Category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

    // Date range filter
    const now = new Date();
    if (quickFilter === 'today') {
      filtered = filtered.filter((e) => {
        const expenseDate = new Date(e.transaction_date).toDateString();
        return expenseDate === now.toDateString();
      });
    } else if (quickFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (e) => new Date(e.transaction_date) >= weekAgo
      );
    } else if (quickFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(
        (e) => new Date(e.transaction_date) >= monthAgo
      );
    }

    setFilteredExpenses(filtered);
  };

  useEffect(() => {
    applyFilters(expenses, searchQuery);
  }, [expenses, quickFilter, categoryFilter, searchQuery]);

  const getCategorySpent = (category: string) => {
    const monthExpenses = expenses.filter((e) => {
      const expenseMonth = new Date(e.transaction_date)
        .toISOString()
        .slice(0, 7);
      return expenseMonth === currentMonth && e.category === category;
    });
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getBudgetForCategory = (category: string) => {
    return budgets.find((b: any) => b.category === category)?.amount || 0;
  };

  const getBudgetPercentage = (category: string) => {
    const budget = getBudgetForCategory(category);
    if (budget === 0) return 0;
    const spent = getCategorySpent(category);
    return Math.min((spent / budget) * 100, 100);
  };

  useEffect(() => {
    // Check if should show onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const currentScrollY = contentRef.current.scrollTop;

      if (currentScrollY > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      lastScrollY.current = currentScrollY;
    };

    const ref = contentRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (ref) {
        ref.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleDelete = async (id: string) => {
    const expenseToDelete = expenses.find((e) => e.id === id);
    if (!expenseToDelete) return;

    const index = expenses.findIndex((e) => e.id === id);

    // Store for undo
    setDeletedExpense({ expense: expenseToDelete, index });

    hapticFeedback('medium');

    // Show undo toast (suppress default mutation toast)
    const toastId = toast.success('Expense deleted', {
      action: {
        label: 'Undo',
        onClick: () => handleUndoDelete(),
      },
      duration: 5000,
    });

    try {
      // Use mutation without default toast
      await deleteExpenseMutation.mutateAsync(id, {
        onSuccess: () => {
          // Suppress default toast - we're using our custom one
        },
        onError: () => {
          // Suppress default toast
        },
      });

      // Clear undo after successful delete
      setTimeout(() => setDeletedExpense(null), 5000);
    } catch (error) {
      // Rollback on error (mutation handles cache invalidation)
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
      setDeletedExpense(null);
    }
  };

  const handleUndoDelete = async () => {
    if (!deletedExpense) return;

    hapticFeedback('light');

    try {
      // Re-create the expense using mutation
      await createExpenseMutation.mutateAsync({
        amount: deletedExpense.expense.amount,
        merchant: deletedExpense.expense.merchant,
        category: deletedExpense.expense.category,
        notes: deletedExpense.expense.notes,
        transaction_date: deletedExpense.expense.transaction_date,
        card_number: deletedExpense.expense.card_number,
        cardholder: deletedExpense.expense.cardholder,
        transaction_type: deletedExpense.expense.transaction_type,
        currency: deletedExpense.expense.currency,
        source: deletedExpense.expense.source,
      }, {
        onSuccess: () => {
          toast.success('Expense restored');
          setDeletedExpense(null);
        },
        onError: () => {
          // Error already handled by mutation
          setDeletedExpense(null);
        },
      });
    } catch (error) {
      console.error('Error restoring expense:', error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
    hapticFeedback('light');
  };

  const handleUpdateNotes = async (expense: Expense) => {
    try {
      await updateExpenseMutation.mutateAsync({
        id: expense.id,
        updates: {
          amount: expense.amount,
          merchant: expense.merchant,
          category: expense.category,
          notes: expense.notes,
          transaction_date: expense.transaction_date,
          card_number: expense.card_number,
          cardholder: expense.cardholder,
          transaction_type: expense.transaction_type,
          currency: expense.currency,
        },
      }, {
        onSuccess: () => {
          toast.success('Notes updated');
        },
        onError: () => {
          // Error already handled by mutation
        },
      });
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleSubmit = async (data: any) => {
    hapticFeedback('medium');

    setShowForm(false);
    const previousEditingExpense = editingExpense;
    setEditingExpense(undefined);

    try {
      if (previousEditingExpense) {
        // Update existing expense
        await updateExpenseMutation.mutateAsync({
          id: previousEditingExpense.id,
          updates: data,
        }, {
          onSuccess: () => {
            toast.success('Expense updated!');
          },
          onError: () => {
            // Error already handled by mutation
          },
        });
      } else {
        // Create new expense
        await createExpenseMutation.mutateAsync({
          ...data,
          source: 'manual',
        }, {
          onSuccess: () => {
            toast.success('Expense added!');
            celebrateSuccess(); // Celebrate first expense
          },
          onError: () => {
            // Error already handled by mutation
          },
        });
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      // Re-open form on error
      setShowForm(true);
      setEditingExpense(previousEditingExpense);
    }
  };

  const handleSync = async () => {
    setSyncStatus('loading');
    setSyncProgress('Connecting to email...');
    setSyncDetail('This may take a few moments');
    hapticFeedback('light');

    try {
      const data = await emailSyncMutation.mutateAsync(7, {
        onSuccess: () => {
          // Suppress default toast - we'll show custom ones
        },
        onError: () => {
          // Suppress default toast
        },
      });

      setSyncProgress('Processing emails...');
      setSyncDetail(`Found ${data.newExpenses || 0} new expense(s)`);

      setLastSynced(new Date());
      setSyncStatus('success');
      setSyncProgress('Sync complete!');
      setSyncDetail(`Added ${data.newExpenses || 0} new expense(s)`);

      hapticFeedback('medium');
      toast.success(`Synced ${data.newExpenses || 0} new expenses`);

      if (data.newExpenses > 0) {
        celebrateSuccess();
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress('');
        setSyncDetail('');
      }, 3000);
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncStatus('error');
      setSyncProgress('Sync failed');
      setSyncDetail('Please check your connection and try again');
      toast.error('Failed to sync emails');

      // Hide error message after 5 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress('');
        setSyncDetail('');
      }, 5000);
    }
  };

  // Pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (
      contentRef.current &&
      contentRef.current.scrollTop === 0 &&
      activeView === 'expenses'
    ) {
      touchStart.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current && activeView === 'expenses') {
      const pull = e.touches[0].clientY - touchStart.current;
      if (pull > 0) {
        setPullDistance(Math.min(pull, 100));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 70 && !isRefreshing) {
      setIsRefreshing(true);
      hapticFeedback('medium');
      await refetchExpenses();
      await refetchStats();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    touchStart.current = 0;
  };

  const todayExpenses = expenses.filter((e) => {
    const today = new Date().toDateString();
    const expenseDate = new Date(e.transaction_date).toDateString();
    return today === expenseDate;
  });

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div
      ref={contentRef}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-36 overflow-auto overscroll-behavior-none"
      style={{
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))',
      }}
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
              <RefreshCw
                className={`h-5 w-5 ${
                  pullDistance > 70 ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-high-contrast">
              Expenses
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              {activeView === 'expenses'
                ? 'Track spending'
                : activeView === 'analytics'
                ? 'View insights'
                : activeView === 'budget'
                ? 'Manage budget'
                : activeView === 'goals'
                ? 'Savings goals'
                : activeView === 'summary'
                ? 'Weekly report'
                : 'Spending patterns'}
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
          className="glass rounded-2xl p-4 sm:p-6 overflow-hidden"
        >
          <p className="text-muted-foreground text-xs sm:text-sm mb-2.5">
            Today's Spending
          </p>
          <p className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            <AnimatedCounter value={todayTotal} prefix="₫ " duration={1200} />
          </p>
          <p className="text-muted-foreground text-sm sm:text-base mt-3">
            {todayExpenses.length}{' '}
            {todayExpenses.length === 1 ? 'expense' : 'expenses'}
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
      ) : (
        stats && (
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
        )
      )}

      {/* Sync Progress */}
      <AnimatePresence>
        {syncStatus !== 'idle' && (
          <div className="px-5 mb-6">
            <ProgressIndicator
              status={syncStatus}
              message={syncProgress}
              detail={syncDetail}
            />
          </div>
        )}
      </AnimatePresence>

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
              <Button
                variant={
                  quickFilter !== 'all' || categoryFilter !== 'All'
                    ? 'default'
                    : 'outline'
                }
                className="ripple-effect min-h-touch gap-2 whitespace-nowrap px-4"
                onClick={() => {
                  setShowFilterSheet(true);
                  hapticFeedback('light');
                }}
              >
                <Filter className="h-5 w-5" />
                {(quickFilter !== 'all' || categoryFilter !== 'All') && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-high-contrast">
                {filteredExpenses.length === expenses.length
                  ? 'All Expenses'
                  : `${filteredExpenses.length} of ${expenses.length}`}
              </h2>
              {filteredExpenses.length > 10 && (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => {
                    setShowAllExpenses(!showAllExpenses);
                    hapticFeedback('light');
                  }}
                  className="gap-2 ripple-effect min-h-touch px-4"
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
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                className="text-6xl sm:text-7xl md:text-8xl mb-4"
              >
                💸
              </motion.div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
                No expenses yet
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-sm mx-auto">
                Start tracking your spending by adding an expense manually or
                syncing your emails
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="gap-2 ripple-effect min-h-touch-lg text-sm sm:text-base shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Expense
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={emailSyncMutation.isPending}
                  size="lg"
                  className="gap-2 ripple-effect min-h-touch-lg text-sm sm:text-base"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${emailSyncMutation.isPending ? 'animate-spin' : ''}`}
                  />
                  Or Sync from Email
                </Button>
              </div>
            </motion.div>
          ) : filteredExpenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-4"
            >
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="text-5xl sm:text-6xl md:text-7xl mb-4"
              >
                🔍
              </motion.div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                No matching expenses
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-sm mx-auto">
                Try adjusting your filters or search terms to find what you're
                looking for
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setQuickFilter('all');
                    setCategoryFilter('All');
                    setSearchQuery('');
                    hapticFeedback('light');
                  }}
                  className="ripple-effect min-h-touch text-sm sm:text-base"
                >
                  Clear All Filters
                </Button>
                <Button
                  size="lg"
                  onClick={() => setShowForm(true)}
                  className="gap-2 ripple-effect min-h-touch text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3.5">
              <AnimatePresence mode="popLayout">
                {(showAllExpenses
                  ? filteredExpenses
                  : filteredExpenses.slice(0, 10)
                ).map((expense) => (
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
          loading ? (
            <div className="space-y-6">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          ) : (
            <AnalyticsCharts expenses={expenses} />
          )
        ) : activeView === 'budget' ? (
          loading ? (
            <div className="space-y-4">
              <BudgetCardSkeleton />
              <BudgetCardSkeleton />
              <BudgetCardSkeleton />
              <BudgetCardSkeleton />
            </div>
          ) : (
            <BudgetTracker expenses={expenses} />
          )
        ) : activeView === 'goals' ? (
          loading ? (
            <div className="space-y-4">
              <InsightCardSkeleton />
              <InsightCardSkeleton />
            </div>
          ) : (
            <SavingsGoals />
          )
        ) : activeView === 'summary' ? (
          loading ? (
            <div className="space-y-6">
              <ChartSkeleton />
              <InsightCardSkeleton />
            </div>
          ) : (
            <WeeklySummary expenses={expenses} />
          )
        ) : activeView === 'insights' ? (
          loading ? (
            <div className="space-y-4">
              <InsightCardSkeleton />
              <InsightCardSkeleton />
              <InsightCardSkeleton />
            </div>
          ) : (
            <CategoryInsights expenses={expenses} />
          )
        ) : null}
      </div>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onAddExpense={() => {
          setEditingExpense(undefined);
          setShowForm(true);
        }}
        onSyncEmails={handleSync}
        onExport={() => {
          exportToCSV(
            expenses,
            `expenses-${new Date().toISOString().slice(0, 10)}.csv`
          );
          toast.success('Exported to CSV');
          hapticFeedback('light');
        }}
        syncing={emailSyncMutation.isPending}
      />

      {/* Bottom Navigation */}
      <BottomNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* Network Status */}
      <NetworkStatus syncing={emailSyncMutation.isPending} lastSynced={lastSynced} />

      {/* Expense Form Modal */}
      <AnimatePresence>
        {showForm && (
          <QuickExpenseForm
            expense={editingExpense}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingExpense(undefined);
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
            setShowForm(true);
            setShowOnboarding(false);
          }}
          onSyncEmails={() => {
            handleSync();
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Filter Sheet - Modern iOS Style */}
      <AnimatePresence>
        {showFilterSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setShowFilterSheet(false);
                hapticFeedback('light');
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                duration: 0.35,
                ease: [0.32, 0.72, 0, 1],
              }}
              className="fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-xl rounded-t-[2rem] shadow-2xl border-t border-border/50"
              style={{ maxHeight: '75vh' }}
            >
              <div
                className="overflow-y-auto overscroll-contain"
                style={{ maxHeight: '75vh' }}
              >
                {/* Handle bar */}
                <div className="flex justify-center pt-4 pb-3">
                  <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
                </div>

                <div className="px-6 pb-8">
                  {/* Header */}
                  <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      Filters
                    </h2>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                      Refine your expense view
                    </p>
                  </div>

                  {/* Time Range - Segmented Control Style */}
                  <div className="mb-10">
                    <h3 className="text-sm font-semibold mb-4 text-foreground/80">
                      TIME RANGE
                    </h3>
                    <div className="bg-muted/50 p-1 rounded-xl flex gap-1">
                      {QUICK_FILTERS.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => {
                            setQuickFilter(
                              filter.id as 'all' | 'today' | 'week' | 'month'
                            );
                            hapticFeedback('light');
                          }}
                          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            quickFilter === filter.id
                              ? 'bg-card shadow-sm text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category - Chip Selection with Budget Indicators */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold mb-4 text-foreground/80">
                      CATEGORY
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_FILTERS.map((cat) => {
                        const budget = getBudgetForCategory(cat);
                        const spent = getCategorySpent(cat);
                        const percentage = getBudgetPercentage(cat);
                        const hasBudget = budget > 0 && cat !== 'All';

                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              setCategoryFilter(cat);
                              hapticFeedback('medium');
                            }}
                            className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 overflow-hidden ${
                              categoryFilter === cat
                                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                : 'bg-muted/50 text-foreground/70 hover:bg-muted hover:text-foreground active:scale-95'
                            }`}
                          >
                            {/* Budget progress indicator */}
                            {hasBudget && (
                              <div
                                className={`absolute inset-0 transition-all duration-300 ${
                                  percentage >= 100
                                    ? 'bg-destructive/20'
                                    : percentage >= 80
                                    ? 'bg-yellow-500/20'
                                    : 'bg-green-500/20'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                              {cat}
                              {hasBudget && (
                                <span className="text-[10px] opacity-70">
                                  {Math.round(percentage)}%
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {categoryFilter !== 'All' &&
                      getBudgetForCategory(categoryFilter) > 0 && (
                        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">
                              Spent this month
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                getCategorySpent(categoryFilter),
                                'VND'
                              )}{' '}
                              /{' '}
                              {formatCurrency(
                                getBudgetForCategory(categoryFilter),
                                'VND'
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                getBudgetPercentage(categoryFilter) >= 100
                                  ? 'bg-destructive'
                                  : getBudgetPercentage(categoryFilter) >= 80
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${getBudgetPercentage(
                                  categoryFilter
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1 min-h-touch-lg rounded-xl font-medium"
                      onClick={() => {
                        setQuickFilter('all');
                        setCategoryFilter('All');
                        hapticFeedback('light');
                      }}
                    >
                      Reset All
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 min-h-touch-lg rounded-xl font-medium shadow-lg"
                      onClick={() => {
                        setShowFilterSheet(false);
                        hapticFeedback('medium');
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
