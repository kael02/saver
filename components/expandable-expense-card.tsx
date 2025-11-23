'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Expense } from '@/lib/supabase';
import {
  formatCurrency,
  formatDate,
  getCategoryColor,
  hapticFeedback,
} from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Mail,
  Trash2,
  X,
} from 'lucide-react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { SwipeableCard } from '@/components/ui/swipeable-card';

interface ExpandableExpenseCardProps {
  expense: Expense;
  onDelete?: (id: string) => void;
  onEdit?: (expense: Expense) => void;
  onUpdate?: (expense: Expense) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Bills: '💡',
  Health: '🏥',
  Other: '📦',
};

export const ExpandableExpenseCard = forwardRef<HTMLDivElement, ExpandableExpenseCardProps>(
  function ExpandableExpenseCard({
    expense,
    onDelete,
    onEdit,
    onUpdate,
  }, ref) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(expense.notes || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Memoize formatted date strings
  const formattedDate = useMemo(() => {
    return new Date(expense.transaction_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [expense.transaction_date]);

  const formattedTime = useMemo(() => {
    return new Date(expense.transaction_date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [expense.transaction_date]);

  // Use ResizeObserver for automatic height measurement
  useEffect(() => {
    if (!contentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.contentRect.height + 20);
      }
    });

    if (isExpanded) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isExpanded]);

  const handleDeleteClick = () => {
    hapticFeedback('light');
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      hapticFeedback('heavy');
      onDelete(expense.id);
    }
    setShowDeleteDialog(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      hapticFeedback('light');
      onEdit(expense);
    }
  };

  const handleCardClick = () => {
    hapticFeedback('light');
    setIsExpanded(!isExpanded);
  };

  const handleSaveNotes = async () => {
    if (onUpdate && editedNotes !== expense.notes) {
      await onUpdate({ ...expense, notes: editedNotes });
      hapticFeedback('medium');
    }
    setIsEditingNotes(false);
  };

  const handleCancelEditNotes = () => {
    setEditedNotes(expense.notes || '');
    setIsEditingNotes(false);
    hapticFeedback('light');
  };

  return (
    <SwipeableCard
      onDelete={() => {
        hapticFeedback('heavy')
        if (onDelete) onDelete(expense.id)
      }}
      disabled={isExpanded}
    >
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.25,
          ease: [0.175, 0.885, 0.32, 1.275],
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
            animate={{
              height: contentHeight > 0 ? contentHeight : 'auto',
              opacity: 1,
            }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{ overflow: 'hidden' }}
          >
            <div ref={contentRef} className="px-4 pb-4 pt-2 space-y-4">
              {/* Details section */}
              <div className="space-y-2.5">
                {/* Date & Time */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="ios-body text-sm">Date</span>
                  </div>
                  <span className="ios-body text-sm">{formattedDate}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="ios-body text-sm">Time</span>
                  </div>
                  <span className="ios-body text-sm">{formattedTime}</span>
                </div>

                {/* Source badge */}
                <div className="flex items-center justify-between py-2">
                  <span className="ios-body text-sm text-muted-foreground">
                    Source
                  </span>
                  <Badge
                    variant={
                      expense.source === 'email' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
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

                {/* Notes section */}
                {onUpdate && (
                  <div className="border-t border-border/50 pt-2.5 mt-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="ios-body text-sm">Notes</span>
                      </div>
                      {!isEditingNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingNotes(true);
                            hapticFeedback('light');
                          }}
                          className="h-7 text-xs px-2"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          {expense.notes ? 'Edit' : 'Add'}
                        </Button>
                      )}
                    </div>

                    {isEditingNotes ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                          placeholder="Add notes about this expense..."
                          className="ios-input min-h-[80px] text-sm"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveNotes();
                            }}
                            className="flex-1 h-9 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEditNotes();
                            }}
                            className="flex-1 h-9 text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="ios-body text-sm text-muted-foreground italic">
                        {expense.notes || 'No notes added'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5 pt-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                    className="flex-1 ios-press h-10 text-sm px-2"
                  >
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick();
                    }}
                    className="flex-1 ios-press h-10 text-sm px-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
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
        <AlertDialogContent
          onClick={(e) => e.stopPropagation()}
          className="ios-card"
        >
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center ios-title">
              Delete Expense?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center ios-body text-muted-foreground">
              Are you sure you want to delete this expense from{' '}
              <span className="font-semibold text-foreground">
                {expense.merchant}
              </span>
              ? This action cannot be undone.
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
    </SwipeableCard>
  );
});

ExpandableExpenseCard.displayName = 'ExpandableExpenseCard';
