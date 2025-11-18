'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trash2, Edit } from 'lucide-react'
import type { Expense } from '@/lib/supabase'

interface ExpenseCardProps {
  expense: Expense
  onDelete?: (id: string) => void
  onEdit?: (expense: Expense) => void
}

export function ExpenseCard({ expense, onDelete, onEdit }: ExpenseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{expense.merchant}</h3>
                <Badge variant={expense.source === 'email' ? 'default' : 'secondary'}>
                  {expense.source === 'email' ? '📧 Auto' : '✍️ Manual'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {expense.transaction_type}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Card</span>
              <span className="font-mono">{expense.card_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cardholder</span>
              <span>{expense.cardholder}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(expense.transaction_date)}</span>
            </div>
            {expense.category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="outline">{expense.category}</Badge>
              </div>
            )}
            {expense.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-muted-foreground text-xs">Notes:</p>
                <p className="mt-1">{expense.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(expense)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(expense.id)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
