'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit2, Trash2, Save, X, Target } from 'lucide-react'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/lib/hooks'
import type { Tables } from '@/lib/supabase/database.types'

type SavingsGoal = Tables<'savings_goals'>

export function SavingsGoals() {
  // Fetch goals using TanStack Query
  const { data: goals = [], isLoading: loading } = useGoals()

  // Mutation hooks
  const createGoalMutation = useCreateGoal()
  const updateGoalMutation = useUpdateGoal()
  const deleteGoalMutation = useDeleteGoal()

  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    icon: '🎯',
  })

  const GOAL_ICONS = ['🎯', '🏠', '✈️', '🚗', '💰', '🎓', '💍', '🎉']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingGoal) {
        await updateGoalMutation.mutateAsync({
          id: editingGoal.id,
          updates: {
            name: formData.name,
            target_amount: parseFloat(formData.targetAmount),
            current_amount: parseFloat(formData.currentAmount || '0'),
            deadline: formData.deadline || null,
            icon: formData.icon,
          },
        })
      } else {
        await createGoalMutation.mutateAsync({
          name: formData.name,
          target_amount: parseFloat(formData.targetAmount),
          current_amount: parseFloat(formData.currentAmount || '0'),
          deadline: formData.deadline || null,
          icon: formData.icon,
        })
      }

      setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: '', icon: '🎯' })
      setShowForm(false)
      setEditingGoal(null)
    } catch (error) {
      console.error('Error saving goal:', error)
    }
  }

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      targetAmount: goal.target_amount.toString(),
      currentAmount: (goal.current_amount || 0).toString(),
      deadline: goal.deadline || '',
      icon: goal.icon || '🎯',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this goal?')) return

    try {
      await deleteGoalMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleAddProgress = async (goal: SavingsGoal, amount: number) => {
    try {
      await updateGoalMutation.mutateAsync({
        id: goal.id,
        updates: {
          current_amount: (goal.current_amount || 0) + amount,
        },
      })
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading goals...</div>
  }

  return (
    <div className="space-y-6">
      {/* Add Goal Button */}
      {!showForm && (
        <Button
          onClick={() => {
            setEditingGoal(null)
            setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: '', icon: '🎯' })
            setShowForm(true)
          }}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Goal
        </Button>
      )}

      {/* Goal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingGoal ? 'Edit Goal' : 'New Goal'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Goal Icon</Label>
                  <div className="flex gap-2 mt-2">
                    {GOAL_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`text-2xl p-2 rounded-lg transition-all ${
                          formData.icon === icon
                            ? 'bg-primary scale-110'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Vacation to Bali"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetAmount">Target Amount (₫)</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      placeholder="10000000"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="currentAmount">Current Amount (₫)</Label>
                    <Input
                      id="currentAmount"
                      type="number"
                      value={formData.currentAmount}
                      onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingGoal ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingGoal(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No savings goals yet</h3>
          <p className="text-muted-foreground text-sm">
            Create your first goal to start tracking your progress
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = ((goal.current_amount || 0) / goal.target_amount) * 100
            const remaining = goal.target_amount - (goal.current_amount || 0)
            const daysUntilDeadline = goal.deadline
              ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.icon || '🎯'}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(goal.current_amount || 0, 'VND')} of{' '}
                          {formatCurrency(goal.target_amount, 'VND')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(goal)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                        className="h-8 w-8 text-destructive"
                        disabled={deleteGoalMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Progress value={Math.min(progress, 100)} className="h-3 mb-3" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {progress.toFixed(1)}% complete
                    </span>
                    <span className="font-medium">
                      {remaining > 0 ? formatCurrency(remaining, 'VND') + ' to go' : 'Goal reached! 🎉'}
                    </span>
                  </div>

                  {daysUntilDeadline !== null && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {daysUntilDeadline > 0
                        ? `${daysUntilDeadline} days until deadline`
                        : daysUntilDeadline === 0
                        ? 'Deadline is today!'
                        : `${Math.abs(daysUntilDeadline)} days past deadline`}
                    </p>
                  )}

                  {/* Quick Add Progress */}
                  <div className="flex gap-2 mt-4">
                    {[100000, 500000, 1000000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddProgress(goal, amount)}
                        className="flex-1"
                        disabled={updateGoalMutation.isPending}
                      >
                        +{(amount / 1000).toFixed(0)}k
                      </Button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
