import type { Task } from '../../../types/task'

interface TimelineViewProps {
  tasks: Task[]
  /** Number of weeks to show (includes past and future from current week) */
  weeks?: number
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TimelineView({ tasks, weeks = 6 }: TimelineViewProps) {
  const now = new Date()
  const currentMonday = getWeekStart(now)
  const weekStarts: string[] = []
  for (let i = -1; i < weeks - 1; i++) {
    const d = new Date(currentMonday)
    d.setDate(d.getDate() + i * 7)
    weekStarts.push(d.toISOString().slice(0, 10))
  }

  const tasksByWeek = new Map<string, Task[]>()
  weekStarts.forEach((w) => tasksByWeek.set(w, []))
  tasks.forEach((t) => {
    const weekKey = getWeekStart(new Date(t.dueDate))
    if (tasksByWeek.has(weekKey)) {
      tasksByWeek.get(weekKey)!.push(t)
    }
  })

  const statusColors: Record<Task['status'], string> = {
    todo: 'bg-gray-300 dark:bg-gray-600',
    in_progress: 'bg-indigo-500 dark:bg-indigo-400',
    in_review: 'bg-amber-500 dark:bg-amber-400',
    done: 'bg-emerald-500 dark:bg-emerald-400',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Timeline View</h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Tasks by due date (next {weeks} weeks)
        </p>
      </div>
      <div className="overflow-x-auto p-5">
        <div className="flex min-w-max gap-4" role="list" aria-label="Timeline by week">
          {weekStarts.map((weekStart) => {
            const weekTasks = tasksByWeek.get(weekStart) ?? []
            const completed = weekTasks.filter((t) => t.status === 'done').length
            const total = weekTasks.length
            return (
              <div
                key={weekStart}
                className="flex w-28 shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
                role="listitem"
              >
                <p className="mb-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {formatWeekLabel(weekStart)}
                </p>
                <div className="space-y-2">
                  {weekTasks.length > 0 ? (
                    weekTasks.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        className={`rounded px-2 py-1 text-xs font-medium text-white ${statusColors[t.status]}`}
                        title={t.title}
                      >
                        <span className="line-clamp-2">{t.title}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500">No tasks</p>
                  )}
                </div>
                {total > 0 && (
                  <p className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    {completed}/{total} done
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
