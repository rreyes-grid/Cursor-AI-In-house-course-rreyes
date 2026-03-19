import type { TaskStatus } from '../../../types/task'

interface TaskProgressChartProps {
  data: { status: TaskStatus; count: number; label: string }[]
  title?: string
  /** Completion percentage (0-100) for the completion ring */
  completionPercent?: number
}

const statusColors: Record<TaskStatus, string> = {
  todo: 'fill-gray-400 dark:fill-gray-500',
  in_progress: 'fill-indigo-500 dark:fill-indigo-400',
  in_review: 'fill-amber-500 dark:fill-amber-400',
  done: 'fill-emerald-500 dark:fill-emerald-400',
}

export function TaskProgressChart({ data, title = 'Task Progress', completionPercent }: TaskProgressChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const completed = data.find((d) => d.status === 'done')?.count ?? 0
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const percent = completionPercent ?? (total > 0 ? Math.round((completed / total) * 100) : 0)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="flex flex-col gap-4 p-5">
        {/* Task completion visualization - ring + stats */}
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 shrink-0" aria-hidden>
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-gray-200 dark:stroke-gray-700"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-500"
                strokeWidth="3"
                strokeDasharray={`${percent * 0.97} 97`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
              {percent}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {completed} of {total} tasks completed
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Task completion progress
            </p>
          </div>
        </div>

        {/* Bar chart by status */}
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-md transition-all duration-500 ${statusColors[item.status]}`}
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-semibold text-gray-900 dark:text-white">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
