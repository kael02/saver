'use client'

import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Expense } from '@/lib/supabase'

interface AnalyticsChartsProps {
  expenses: Expense[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1']

export function AnalyticsCharts({ expenses }: AnalyticsChartsProps) {
  // Category breakdown data
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other'
    const existing = acc.find((item) => item.name === category)
    if (existing) {
      existing.value += expense.amount
    } else {
      acc.push({ name: category, value: expense.amount })
    }
    return acc
  }, [] as { name: string; value: number }[])

  // Daily spending trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  const dailyData = last7Days.map((date) => {
    const dayExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.transaction_date).toISOString().split('T')[0]
      return expenseDate === date
    })
    const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      amount: total,
    }
  })

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value, 'VND')}
          </p>
        </div>
      )
    }
    return null
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No expense data to display analytics
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Category Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {categoryData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground ml-auto">
                {formatCurrency(item.value, 'VND')}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Last 7 Days Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{payload[0].payload.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(payload[0].value as number, 'VND')}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
