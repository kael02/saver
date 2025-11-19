'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plus, X, Edit, RefreshCw, Download } from 'lucide-react'
import { hapticFeedback } from '@/lib/utils'

interface FloatingActionMenuProps {
  onAddExpense: () => void
  onSyncEmails: () => void
  onExport: () => void
  syncing?: boolean
}

export function FloatingActionMenu({
  onAddExpense,
  onSyncEmails,
  onExport,
  syncing = false,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    hapticFeedback('medium')
    setIsOpen(!isOpen)
  }

  const handleAction = (action: () => void) => {
    hapticFeedback('light')
    setIsOpen(false)
    action()
  }

  const actions = [
    {
      icon: Edit,
      label: 'Add Expense',
      onClick: () => handleAction(onAddExpense),
      color: 'from-blue-600 to-purple-600',
    },
    {
      icon: RefreshCw,
      label: 'Sync Emails',
      onClick: () => handleAction(onSyncEmails),
      color: 'from-green-600 to-emerald-600',
      disabled: syncing,
    },
    {
      icon: Download,
      label: 'Export CSV',
      onClick: () => handleAction(onExport),
      color: 'from-orange-600 to-red-600',
    },
  ]

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
            className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
          />
        )}
      </AnimatePresence>

      {/* Action buttons - Positioned above bottom nav */}
      <div className="fixed right-6 z-50" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-20 right-0 flex flex-col gap-3 items-end"
            >
              {actions.map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 20, y: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: 20, y: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="bg-card px-3 py-1.5 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                      {action.label}
                    </span>
                    <Button
                      size="lg"
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={`h-14 w-14 rounded-full shadow-lg bg-gradient-to-br ${action.color} hover:scale-105 transition-transform`}
                    >
                      <Icon className={`h-6 w-6 ${action.disabled && syncing ? 'animate-spin' : ''}`} />
                    </Button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Button
            size="lg"
            onClick={toggleMenu}
            className="h-16 w-16 sm:h-14 sm:w-14 rounded-full shadow-2xl hover:shadow-xl transition-all bg-gradient-to-br from-blue-600 to-purple-600 hover:scale-110"
          >
            {isOpen ? <X className="h-8 w-8 sm:h-7 sm:w-7" /> : <Plus className="h-8 w-8 sm:h-7 sm:w-7" />}
          </Button>
        </motion.div>
      </div>
    </>
  )
}
