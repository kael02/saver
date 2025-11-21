'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  index?: number
}

export function StatsCard({ title, value, icon: Icon, description, index = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.175, 0.885, 0.32, 1.275] // iOS spring curve
      }}
      className="ios-card ios-press p-5"
    >
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="ios-caption text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl font-semibold tracking-tight mb-1">
        {value}
      </div>

      {/* Description */}
      {description && (
        <p className="ios-caption text-muted-foreground">
          {description}
        </p>
      )}
    </motion.div>
  )
}
