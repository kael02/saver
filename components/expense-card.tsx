'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trash2, Edit, Mail } from 'lucide-react'
import type { Expense } from '@/lib/supabase'

interface ExpenseCardProps {
  expense: Expense
  onDelete?: (id: string) => void
  onEdit?: (expense: Expense) => void
}

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Bills: '💡',
  Health: '🏥',
  Other: '📦',
}

export function ExpenseCard({ expense, onDelete, onEdit }: ExpenseCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-card rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all active:scale-98"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-3xl">
            {CATEGORY_EMOJI[expense.category || 'Other'] || '📦'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{expense.merchant}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(expense.transaction_date)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-destructive whitespace-nowrap">
            {formatCurrency(expense.amount, expense.currency)}
          </p>
        </div>
      </div>

      {expense.notes && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {expense.notes}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Badge variant={expense.source === 'email' ? 'default' : 'secondary'} className="text-xs">
            {expense.source === 'email' ? (
              <>
                <Mail className="w-3 h-3 mr-1" />
                Auto
              </>
            ) : (
              'Manual'
            )}
          </Badge>
          {expense.category && (
            <Badge variant="outline" className="text-xs">
              {expense.category}
            </Badge>
          )}
        </div>

        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(expense)}
              className="h-8 w-8"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(expense.id)}
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
