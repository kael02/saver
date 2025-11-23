'use client'

import { AnimatedCounter } from '@/components/animated-counter';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Wallet, Calendar, Activity } from 'lucide-react';
import { useMemo } from 'react';

interface QuickStatsOverviewProps {
  todayTotal: number;
  todayCount: number;
  weekTotal: number;
  monthTotal: number;
  lastMonthTotal?: number;
}

export function QuickStatsOverview({
  todayTotal,
  todayCount,
  weekTotal,
  monthTotal,
  lastMonthTotal = 0,
}: QuickStatsOverviewProps) {
  const monthChange = useMemo(() => {
    if (!lastMonthTotal) return 0;
    return ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }, [monthTotal, lastMonthTotal]);

  const isIncreasing = monthChange > 0;

  return (
    <div className="space-y-3">
      {/* Main Today Card */}
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="ios-card overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--card-rgb), 1) 0%, rgba(var(--card-rgb), 0.95) 100%)',
        }}
      >
        <div className="p-6 relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="ios-caption text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                  Today
                </p>
                <p className="ios-caption text-muted-foreground">
                  {todayCount} {todayCount === 1 ? 'transaction' : 'transactions'}
                </p>
              </div>
              <motion.div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Calendar className="h-6 w-6 text-primary" />
              </motion.div>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <p className="text-5xl font-bold tracking-tight leading-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                <AnimatedCounter value={todayTotal} prefix="₫ " duration={1200} />
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* This Week */}
              <div className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="ios-caption text-muted-foreground uppercase tracking-wide text-[10px] font-semibold">
                    This Week
                  </p>
                </div>
                <p className="text-lg font-bold tracking-tight">
                  ₫ {weekTotal.toLocaleString()}
                </p>
              </div>

              {/* This Month */}
              <div className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="ios-caption text-muted-foreground uppercase tracking-wide text-[10px] font-semibold">
                    This Month
                  </p>
                </div>
                <p className="text-lg font-bold tracking-tight">
                  ₫ {monthTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Footer */}
        {lastMonthTotal > 0 && (
          <div
            className="px-6 py-3 border-t border-border/30"
          >
            <div className="flex items-center justify-between">
              <p className="ios-caption text-muted-foreground">vs Last Month</p>
              <div className="flex items-center gap-1.5">
                {isIncreasing ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
                <p className={`text-sm font-semibold ${isIncreasing ? 'text-destructive' : 'text-green-500'}`}>
                  {Math.abs(monthChange).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
