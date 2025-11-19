'use client'

import { motion } from 'framer-motion'
import { List, BarChart3, Target, Sparkles, FileText, Lightbulb } from 'lucide-react'
import { hapticFeedback } from '@/lib/utils'

interface BottomNavProps {
  activeView: 'expenses' | 'analytics' | 'budget' | 'goals' | 'summary' | 'insights'
  onViewChange: (view: 'expenses' | 'analytics' | 'budget' | 'goals' | 'summary' | 'insights') => void
}

const NAV_ITEMS = [
  { id: 'expenses' as const, label: 'Expenses', icon: List },
  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  { id: 'budget' as const, label: 'Budget', icon: Target },
  { id: 'insights' as const, label: 'Insights', icon: Lightbulb },
]

export function BottomNavigation({ activeView, onViewChange }: BottomNavProps) {
  const handleNavClick = (viewId: typeof activeView) => {
    hapticFeedback('light')
    onViewChange(viewId)
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border safe-bottom"
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-screen-sm mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="relative flex flex-col items-center justify-center min-w-[64px] py-1 px-3 rounded-lg transition-all active:scale-95"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Icon */}
              <div className="relative">
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-safe-bottom bg-background/80 backdrop-blur-xl" />
    </motion.nav>
  )
}
