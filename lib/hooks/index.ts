/**
 * TanStack Query Hooks
 *
 * Centralized export for all custom hooks
 */

// Query keys
export { queryKeys } from './query-keys'
export type { ExpenseFilters, BudgetFilters, GoalFilters } from './query-keys'

// Expenses
export {
  useExpenses,
  useCreateExpense,
  useCreateExpenseOptimistic,
  useUpdateExpense,
  useDeleteExpense,
  useDeleteExpenseOptimistic,
} from './use-expenses'

// Budgets
export {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useUpdateBudgetOptimistic,
} from './use-budgets'

// Goals
export {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useUpdateGoalOptimistic,
  useDeleteGoalOptimistic,
} from './use-goals'

// Stats & Email Sync
export { useStats, useEmailSync } from './use-stats'
export type { StatsData, EmailSyncResponse } from './use-stats'

// Merchants
export { useCategorySuggestion } from './use-merchants'
export type { CategorySuggestion } from './use-merchants'

// Notifications
export {
  useSubscribePushNotifications,
  useUnsubscribePushNotifications,
} from './use-notifications'
export type { PushSubscription } from './use-notifications'
