'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'

interface NutritionChartsProps {
  stats: {
    byMealTime: {
      breakfast: { count: number; calories: number }
      lunch: { count: number; calories: number }
      dinner: { count: number; calories: number }
      snack: { count: number; calories: number }
      other: { count: number; calories: number }
    }
    byDate: Record<string, { calories: number; protein: number; carbs: number; fat: number }>
  }
}

const MEAL_TIME_COLORS = {
  breakfast: '#f97316', // orange
  lunch: '#eab308', // yellow
  dinner: '#6366f1', // indigo
  snack: '#22c55e', // green
  other: '#6b7280', // gray
}

export function NutritionCharts({ stats }: NutritionChartsProps) {
  // Prepare pie chart data (calories by meal time)
  const mealTimeData = Object.entries(stats.byMealTime)
    .filter(([_, data]) => data.calories > 0)
    .map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: data.calories,
      count: data.count,
    }))

  // Prepare line chart data (daily calories over time)
  const dailyData = Object.entries(stats.byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7) // Last 7 days
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
    }))

  return (
    <div className="space-y-4">
      {/* Calories by meal time (Pie Chart) */}
      {mealTimeData.length > 0 && (
        <Card className="frosted-card">
          <CardHeader>
            <CardTitle className="text-base">Calories by Meal Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mealTimeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mealTimeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={MEAL_TIME_COLORS[entry.name.toLowerCase() as keyof typeof MEAL_TIME_COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString()} cal`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Daily calories trend (Line Chart) */}
      {dailyData.length > 0 && (
        <Card className="frosted-card">
          <CardHeader>
            <CardTitle className="text-base">7-Day Calorie Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => value.toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Calories"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Macros trend (Line Chart) */}
      {dailyData.length > 0 && (
        <Card className="frosted-card">
          <CardHeader>
            <CardTitle className="text-base">Macronutrient Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Grams', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${Math.round(value)}g`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="protein"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Protein (g)"
                />
                <Line
                  type="monotone"
                  dataKey="carbs"
                  stroke="#eab308"
                  strokeWidth={2}
                  name="Carbs (g)"
                />
                <Line
                  type="monotone"
                  dataKey="fat"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Fat (g)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
