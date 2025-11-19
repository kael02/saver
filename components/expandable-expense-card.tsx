'use client'

import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, getCategoryColor, hapticFeedback } from '@/lib/utils'
import { Trash2, Edit, Mail, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, CreditCard, User, Calendar } from 'lucide-react'
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
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(expense.notes || '')
  const x = useMotionValue(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const backgroundColor = useTransform(
    x,
    [-100, 0, 100],
    ['rgba(239, 68, 68, 0.1)', 'rgba(0, 0, 0, 0)', 'rgba(59, 130, 246, 0.1)']
  )

  const categoryColors = getCategoryColor(expense.category || 'Other')

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80

    if (info.offset.x < -threshold && onDelete) {
      setIsRevealed('left')
      x.set(-80)
      hapticFeedback('medium')
    } else if (info.offset.x > threshold && onEdit) {
      setIsRevealed('right')
      x.set(80)
      hapticFeedback('medium')
    } else {
      setIsRevealed(null)
      x.set(0)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      hapticFeedback('heavy')
      onDelete(expense.id)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      hapticFeedback('light')
      onEdit(expense)
    }
  }

  const handleCardClick = () => {
    if (isRevealed) {
      if (isRevealed === 'left') handleDelete()
      else if (isRevealed === 'right') handleEdit()
    } else {
      hapticFeedback('light')
      setIsExpanded(!isExpanded)
    }
  }

  const handleSaveNotes = () => {
    if (onUpdate) {
      onUpdate({ ...expense, notes: editedNotes })
    }
    setIsEditing(false)
    hapticFeedback('medium')
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background action buttons */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{
            opacity: isRevealed === 'right' ? 1 : 0,
            x: isRevealed === 'right' ? 0 : -10,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="flex items-center gap-2 text-blue-600"
        >
          <Edit className="h-5 w-5" />
          <ChevronRight className="h-4 w-4" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{
            opacity: isRevealed === 'left' ? 1 : 0,
            x: isRevealed === 'left' ? 0 : 10,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="flex items-center gap-2 text-destructive"
        >
          <ChevronLeft className="h-4 w-4" />
          <Trash2 className="h-5 w-5" />
        </motion.div>
      </div>

      {/* Card */}
      <motion.div
        ref={cardRef}
        layout
        drag="x"
        dragConstraints={{ left: -80, right: 80 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x, backgroundColor }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={`bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border-l-4 ${categoryColors.border} hover:shadow-md transition-all cursor-pointer ripple-effect`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="text-2xl sm:text-3xl flex-shrink-0">
              {CATEGORY_EMOJI[expense.category || 'Other'] || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">{expense.merchant}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground/80 truncate">
                {formatDate(expense.transaction_date)}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 flex items-center gap-2">
            <div>
              <p className="text-base sm:text-xl font-bold text-destructive">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {!isExpanded && expense.notes && (
          <p className="text-sm text-muted-foreground/80 mb-3 line-clamp-1">
            {expense.notes}
          </p>
        )}

        {/* Expanded content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 },
                opacity: { duration: 0.2, ease: 'easeOut' },
              }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t space-y-3">
                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(expense.transaction_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(expense.transaction_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {expense.card_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>•••• {expense.card_number.slice(-4)}</span>
                    </div>
                  )}
                  {expense.cardholder && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{expense.cardholder}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Notes
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Add notes..."
                        className="min-h-[60px] text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveNotes()
                          }}
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
                      className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg cursor-text min-h-[60px] hover:bg-muted/50 transition-colors"
                    >
                      {expense.notes || 'Click to add notes...'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2 mt-3">
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
              <Badge
                variant="outline"
                className={`text-xs ${categoryColors.bg} ${categoryColors.text} border-transparent`}
              >
                {expense.category}
              </Badge>
            )}
          </div>

          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit()
                }}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
