'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatDate, getCategoryColor, hapticFeedback } from '@/lib/utils'
import { Trash2, Edit, Mail, ChevronRight, Clock, CreditCard, User, Calendar, AlertTriangle } from 'lucide-react'
import type { Expense } from '@/lib/supabase'

interface ExpandableExpenseCardProps {
  expense: Expense
  onDelete?: (id: string) => void
  onEdit?: (expense: Expense) => void
  onUpdate?: (expense: Expense) => void
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

export function ExpandableExpenseCard({ expense, onDelete, onEdit, onUpdate }: ExpandableExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(expense.notes || '')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const categoryColors = getCategoryColor(expense.category || 'Other')

  const handleDeleteClick = () => {
    hapticFeedback('light')
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    if (onDelete) {
      hapticFeedback('heavy')
      onDelete(expense.id)
    }
    setShowDeleteDialog(false)
  }

  const handleEdit = () => {
    if (onEdit) {
      hapticFeedback('light')
      onEdit(expense)
    }
  }

  const handleCardClick = () => {
    hapticFeedback('light')
    setIsExpanded(!isExpanded)
  }

  const handleSaveNotes = () => {
    if (onUpdate) {
      onUpdate({ ...expense, notes: editedNotes })
    }
    setIsEditing(false)
    hapticFeedback('medium')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.25,
        ease: [0.175, 0.885, 0.32, 1.275]
      }}
      className="ios-card overflow-hidden"
    >
      {/* Main content - iOS list item style */}
      <button
        type="button"
        className="w-full text-left px-4 py-3.5 ios-touch"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3">
          {/* Icon/Emoji */}
          <div className="flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {CATEGORY_EMOJI[expense.category || 'Other'] || '📦'}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 className="ios-headline truncate">{expense.merchant}</h3>
              <span className="text-base font-semibold text-destructive flex-shrink-0">
                {formatCurrency(expense.amount, expense.currency)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <p className="ios-caption text-muted-foreground">
                {formatDate(expense.transaction_date)}
              </p>
              {expense.category && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="ios-caption text-muted-foreground">
                    {expense.category}
                  </span>
                </>
              )}
            </div>

            {!isExpanded && expense.notes && (
              <p className="ios-caption text-muted-foreground mt-1 line-clamp-1">
                {expense.notes}
              </p>
            )}
          </div>

          {/* Disclosure indicator */}
          <ChevronRight
            className={`h-5 w-5 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-4 border-t ios-separator">
              {/* Details section */}
              <div className="space-y-2.5">
                {/* Date & Time */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="ios-body text-sm">Date</span>
                  </div>
                  <span className="ios-body text-sm">
                    {new Date(expense.transaction_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="ios-body text-sm">Time</span>
                  </div>
                  <span className="ios-body text-sm">
                    {new Date(expense.transaction_date).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>

                {/* Card info */}
                {expense.card_number && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span className="ios-body text-sm">Card</span>
                    </div>
                    <span className="ios-body text-sm">•••• {expense.card_number.slice(-4)}</span>
                  </div>
                )}

                {/* Cardholder */}
                {expense.cardholder && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="ios-body text-sm">Cardholder</span>
                    </div>
                    <span className="ios-body text-sm">{expense.cardholder}</span>
                  </div>
                )}

                {/* Source badge */}
                <div className="flex items-center justify-between py-2">
                  <span className="ios-body text-sm text-muted-foreground">Source</span>
                  <Badge variant={expense.source === 'email' ? 'default' : 'secondary'} className="text-xs">
                    {expense.source === 'email' ? (
                      <>
                        <Mail className="w-3 h-3 mr-1" />
                        Auto Import
                      </>
                    ) : (
                      'Manual Entry'
                    )}
                  </Badge>
                </div>
              </div>

              {/* Notes section */}
              <div className="pt-2 border-t ios-separator">
                <label className="ios-caption text-muted-foreground mb-2 block uppercase tracking-wide">
                  Notes
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Add notes..."
                      className="ios-body text-sm resize-none border-muted"
                      rows={3}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveNotes()
                        }}
                        className="flex-1 ios-press min-h-touch"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsEditing(false)
                          setEditedNotes(expense.notes || '')
                        }}
                        className="flex-1 ios-press min-h-touch"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    className="ios-body text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg cursor-text min-h-[64px] ios-touch"
                  >
                    {expense.notes || 'Tap to add notes...'}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit()
                    }}
                    className="flex-1 ios-press min-h-touch gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick()
                    }}
                    className="flex-1 ios-press min-h-touch gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()} className="ios-card">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center ios-title">Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription className="text-center ios-body text-muted-foreground">
              Are you sure you want to delete this expense from <span className="font-semibold text-foreground">{expense.merchant}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="w-full touch-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 ios-press order-1"
            >
              Delete Expense
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={() => hapticFeedback('light')}
              className="w-full touch-lg ios-press order-2 mt-0"
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
