'use client'

import { motion } from 'framer-motion'
import { Loader2, Check, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ProgressIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error'
  message: string
  progress?: number
  detail?: string
}

export function ProgressIndicator({ status, message, progress, detail }: ProgressIndicatorProps) {
  if (status === 'idle') return null

  const statusConfig = {
    loading: {
      icon: Loader2,
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      iconClass: 'animate-spin',
    },
    success: {
      icon: Check,
      bg: 'bg-green-50 dark:bg-green-950',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      iconClass: '',
    },
    error: {
      icon: X,
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      iconClass: '',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`${config.bg} border ${config.border} rounded-xl p-4 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 ${config.text} ${config.iconClass}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm sm:text-base font-medium ${config.text}`}>{message}</p>
          {detail && (
            <p className={`text-xs sm:text-sm mt-1 ${config.text} opacity-80`}>{detail}</p>
          )}
          {typeof progress === 'number' && status === 'loading' && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <p className={`text-xs mt-1.5 ${config.text} opacity-70`}>{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
