import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('relative overflow-hidden bg-muted rounded-md', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

export function ExpenseCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-7 w-full mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-[300px] w-full rounded-lg mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function BudgetCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border-l-4 border-muted">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-2" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

export function InsightCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  )
}
