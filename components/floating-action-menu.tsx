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
      color: 'bg-blue-500',
    },
    {
      icon: RefreshCw,
      label: 'Sync Emails',
      onClick: () => handleAction(onSyncEmails),
      color: 'bg-green-500',
      disabled: syncing,
    },
    {
      icon: Download,
      label: 'Export CSV',
      onClick: () => handleAction(onExport),
      color: 'bg-orange-500',
    },
  ]

  return (
    <>
      {/* iOS-style Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={toggleMenu}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            style={{ WebkitBackdropFilter: 'blur(8px)' }}
          />
        )}
      </AnimatePresence>

      {/* Action buttons - Positioned above bottom nav */}
      <div className="fixed right-5 z-50" style={{ bottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
        <AnimatePresence mode="popLayout">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute bottom-20 right-0 flex flex-col gap-3 items-end pb-2"
            >
              {actions.map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.3, x: 20, y: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: 0.3, x: 20, y: 20 }}
                    transition={{
                      delay: index * 0.05,
                      type: 'spring',
                      damping: 25,
                      stiffness: 500,
                    }}
                    className="flex items-center gap-3"
                  >
                    {/* iOS-style label */}
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                      className="bg-background/95 backdrop-blur-xl border border-border/50 px-3.5 py-2 rounded-full shadow-lg text-sm font-medium whitespace-nowrap"
                      style={{ WebkitBackdropFilter: 'blur(20px)' }}
                    >
                      {action.label}
                    </motion.span>

                    {/* iOS-style action button */}
                    <motion.button
                      onClick={action.onClick}
                      disabled={action.disabled}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        w-14 h-14 rounded-full shadow-xl
                        ${action.color}
                        disabled:opacity-60
                        flex items-center justify-center
                        transition-all duration-200
                        border border-white/20
                      `}
                      style={{
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                      }}
                    >
                      <Icon className={`h-6 w-6 text-white ${action.disabled && syncing ? 'animate-spin' : ''}`} />
                    </motion.button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB - iOS Style */}
        <motion.button
          onClick={toggleMenu}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
            w-16 h-16 rounded-full
            bg-primary
            shadow-2xl
            flex items-center justify-center
            transition-all duration-300
            border border-white/20
            relative overflow-hidden
          "
          style={{
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
          }}
        >
          {/* Glossy overlay for iOS effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

          {/* Icon with smooth rotation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? 'close' : 'open'}
              initial={{ rotate: isOpen ? -90 : 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: isOpen ? 90 : -90, opacity: 0 }}
              transition={{
                duration: 0.25,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="relative z-10"
            >
              {isOpen ? (
                <X className="h-7 w-7 text-white" strokeWidth={2.5} />
              ) : (
                <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  )
}
