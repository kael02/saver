'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExpenseCard } from '@/components/expense-card'
import { StatsCard } from '@/components/stats-card'
import { QuickExpenseForm } from '@/components/quick-expense-form'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  Wallet,
  TrendingDown,
  Calendar,
  Plus,
  RefreshCw,
  Mail,
} from 'lucide-react'
import type { Expense } from '@/lib/supabase'

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [syncing, setSyncing] = useState(false)
  const [showAllExpenses, setShowAllExpenses] = useState(false)

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return

    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      await fetchExpenses()
      await fetchStats()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleSubmit = async (data: any) => {
    try {
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

      setShowForm(false)
      setEditingExpense(undefined)
      await fetchExpenses()
      await fetchStats()
    } catch (error) {
      console.error('Error saving expense:', error)
      alert(error instanceof Error ? error.message : 'Failed to save expense. Please try again.')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/email/sync', { method: 'POST' })
      await fetchExpenses()
      await fetchStats()
    } catch (error) {
      console.error('Error syncing:', error)
    } finally {
      setSyncing(false)
    }
  }

  const todayExpenses = expenses.filter((e) => {
    const today = new Date().toDateString()
    const expenseDate = new Date(e.transaction_date).toDateString()
    return today === expenseDate
  })

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">My Expenses</h1>
            <p className="text-blue-100 text-sm">Track your daily spending</p>
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleSync}
            disabled={syncing}
            className="rounded-full h-12 w-12"
          >
            <motion.div
              animate={{ rotate: syncing ? 360 : 0 }}
              transition={{ duration: 1, repeat: syncing ? Infinity : 0, ease: 'linear' }}
            >
              <Mail className="h-5 w-5" />
            </motion.div>
          </Button>
        </div>

        {/* Today's Total */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6">
          <p className="text-blue-100 text-sm mb-2">Today's Spending</p>
          <p className="text-4xl font-bold">
            {formatCurrency(todayTotal, 'VND')}
          </p>
          <p className="text-blue-100 text-sm mt-2">
            {todayExpenses.length} {todayExpenses.length === 1 ? 'expense' : 'expenses'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="px-4 -mt-6 mb-6">
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

      {/* Expenses List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Expenses</h2>
          {expenses.length > 10 && (
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : expenses.length === 0 ? (
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
              Add your first expense or sync from emails
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {(showAllExpenses ? expenses : expenses.slice(0, 10)).map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
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
    </div>
  )
}
