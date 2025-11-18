'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExpenseCard } from '@/components/expense-card'
import { StatsCard } from '@/components/stats-card'
import { EmailSyncButton } from '@/components/email-sync-button'
import { ExpenseForm } from '@/components/expense-form'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Plus,
  X,
} from 'lucide-react'
import type { Expense } from '@/lib/supabase'

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()

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
    if (!confirm('Are you sure you want to delete this expense?')) return

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
      if (editingExpense) {
        await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      } else {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, source: 'manual' }),
        })
      }

      setShowForm(false)
      setEditingExpense(undefined)
      await fetchExpenses()
      await fetchStats()
    } catch (error) {
      console.error('Error saving expense:', error)
    }
  }

  const handleSync = async () => {
    await fetchExpenses()
    await fetchStats()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                Expense Tracker
              </h1>
              <p className="text-muted-foreground">
                Manage your daily expenses with automatic email integration
              </p>
            </div>
            <div className="flex gap-3">
              <EmailSyncButton onSync={handleSync} />
              <Button
                onClick={() => {
                  setEditingExpense(undefined)
                  setShowForm(!showForm)
                }}
                variant={showForm ? 'outline' : 'default'}
              >
                {showForm ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {!loading && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatsCard
                title="Total Expenses"
                value={formatCurrency(stats.total, 'VND')}
                icon={Wallet}
                description={`${stats.count} transactions`}
                index={0}
              />
              <StatsCard
                title="Top Merchant"
                value={stats.topMerchants?.[0]?.merchant || 'N/A'}
                icon={CreditCard}
                description={
                  stats.topMerchants?.[0]
                    ? formatCurrency(stats.topMerchants[0].amount, 'VND')
                    : 'No data'
                }
                index={1}
              />
              <StatsCard
                title="Categories"
                value={Object.keys(stats.byCategory || {}).length}
                icon={TrendingUp}
                description="Active categories"
                index={2}
              />
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="mb-8">
              <ExpenseForm
                expense={editingExpense}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false)
                  setEditingExpense(undefined)
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Expenses List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Expenses</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed"
            >
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first expense or sync from emails
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
