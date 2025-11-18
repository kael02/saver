'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import type { Expense } from '@/lib/supabase'

const CATEGORIES = [
  { name: 'Food', emoji: '🍔' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Shopping', emoji: '🛍️' },
  { name: 'Entertainment', emoji: '🎬' },
  { name: 'Bills', emoji: '💡' },
  { name: 'Health', emoji: '🏥' },
  { name: 'Other', emoji: '📦' },
]

interface QuickExpenseFormProps {
  expense?: Expense
  onSubmit: (data: any) => Promise<void>
  onCancel?: () => void
}

export function QuickExpenseForm({ expense, onSubmit, onCancel }: QuickExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: expense?.amount?.toString() || '',
    merchant: expense?.merchant || '',
    category: expense?.category || '',
    notes: expense?.notes || '',
    transactionDate: expense?.transaction_date
      ? new Date(expense.transaction_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        amount: parseFloat(formData.amount),
        merchant: formData.merchant,
        category: formData.category || 'Other',
        notes: formData.notes,
        transactionDate: new Date(formData.transactionDate).toISOString(),
        // Backend will fill these from email or use defaults
        cardNumber: expense?.card_number || 'N/A',
        cardholder: expense?.cardholder || 'Manual',
        transactionType: 'Expense',
        currency: 'VND',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-background w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount - Big and prominent */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm text-muted-foreground">
              Amount
            </Label>
            <div className="relative">
              <Input
                id="amount"
                name="amount"
                type="number"
                step="1000"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="text-4xl font-bold h-20 pr-16 text-right"
                required
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
                ₫
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="merchant" className="text-sm text-muted-foreground">
              What did you buy?
            </Label>
            <Input
              id="merchant"
              name="merchant"
              placeholder="e.g., Lunch, Coffee, Groceries"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              className="text-lg h-12"
              required
            />
          </div>

          {/* Category Pills */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.name })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.category === cat.name
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="transactionDate" className="text-sm text-muted-foreground">
              Date
            </Label>
            <Input
              id="transactionDate"
              name="transactionDate"
              type="datetime-local"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              className="h-12"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm text-muted-foreground">
              Notes (optional)
            </Label>
            <Input
              id="notes"
              name="notes"
              placeholder="Add a note..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="h-12"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-12 text-base"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 text-base font-semibold"
            >
              {loading ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
