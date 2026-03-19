import type { Task, TaskPriority, TaskStatus } from '../../../types/task'
import { Avatar } from '../../ui/Avatar'

const priorityConfig: Record<TaskPriority, { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  medium: { label: 'Medium', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  high: { label: 'High', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
}

const statusConfig: Record<TaskStatus, { label: string; dot: string }> = {
  todo: { label: 'To Do', dot: 'bg-gray-400' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-500' },
  in_review: { label: 'In Review', dot: 'bg-amber-500' },
  done: { label: 'Done', dot: 'bg-emerald-500' },
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

interface TaskCardProps {
  task: Task
  onStatusChange?: (taskId: string, status: TaskStatus) => void
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const priority = priorityConfig[task.priority]
  const status = statusConfig[task.status]

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'in_review',
    in_review: 'done',
    done: 'todo',
  }

  return (
    <article
      aria-label={task.title}
      className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Top row: priority + status */}
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priority.cls}`}>
          {priority.label}
        </span>
        <button
          onClick={() => onStatusChange?.(task.id, nextStatus[task.status])}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label={`Change status from ${status.label}`}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${status.dot}`} />
          {status.label}
        </button>
      </div>

      {/* Title + description */}
      <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        {task.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
        {task.description}
      </p>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: due date + assignee */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <CalendarIcon />
          <time dateTime={task.dueDate}>
            {new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {task.assignee.name}
          </span>
          <Avatar
            src={task.assignee.avatarUrl}
            alt={task.assignee.name}
            size="sm"
          />
        </div>
      </div>
    </article>
  )
}
