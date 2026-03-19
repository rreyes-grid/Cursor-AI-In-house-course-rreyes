import type { ReactNode } from 'react'

interface StatWidgetProps {
  label: string
  value: number
  icon: ReactNode
  trend?: { value: number; positive: boolean }
  color: 'indigo' | 'emerald' | 'amber' | 'rose'
}

const colorMap: Record<StatWidgetProps['color'], { bg: string; icon: string }> = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950',
    icon: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950',
    icon: 'text-rose-600 dark:text-rose-400',
  },
}

export function StatWidget({ label, value, icon, trend, color }: StatWidgetProps) {
  const { bg, icon: iconColor } = colorMap[color]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-lg p-2.5 ${bg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      {trend && (
        <p className="mt-3 flex items-center gap-1 text-sm">
          <span
            className={
              trend.positive
                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                : 'font-medium text-rose-600 dark:text-rose-400'
            }
          >
            {trend.positive ? '+' : ''}
            {trend.value}%
          </span>
          <span className="text-gray-500 dark:text-gray-400">vs last week</span>
        </p>
      )}
    </div>
  )
}
