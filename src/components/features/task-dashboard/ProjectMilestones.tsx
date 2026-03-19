import type { Milestone, MilestoneStatus } from '../../../types/dashboard'

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CircleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

const statusConfig: Record<MilestoneStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  completed: {
    label: 'Completed',
    icon: <CheckIcon />,
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  },
  in_progress: {
    label: 'In Progress',
    icon: <ClockIcon />,
    cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400',
  },
  upcoming: {
    label: 'Upcoming',
    icon: <CircleIcon />,
    cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  },
}

interface ProjectMilestonesProps {
  milestones: Milestone[]
}

export function ProjectMilestones({ milestones }: ProjectMilestonesProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Project Milestones</h3>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700" aria-label="Project milestones">
        {milestones.map((m) => {
          const config = statusConfig[m.status]
          return (
            <li key={m.id} className="flex items-center gap-4 px-5 py-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.cls}`}
                aria-hidden
              >
                {config.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{m.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(m.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {m.completedTasks != null && m.totalTasks != null && (
                    <span className="ml-2">
                      — {m.completedTasks}/{m.totalTasks} tasks
                    </span>
                  )}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.cls}`}>
                {config.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
