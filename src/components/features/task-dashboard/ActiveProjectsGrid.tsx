import type { Project, ProjectStatus } from '../../../types/dashboard'

const statusBadgeConfig: Record<ProjectStatus, { label: string; cls: string }> = {
  on_track: { label: 'On Track', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' },
  at_risk: { label: 'At Risk', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
  delayed: { label: 'Delayed', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400' },
}

interface ActiveProjectsGridProps {
  projects: Project[]
  selectedProjectId: string | null
  onSelectProject: (projectId: string) => void
  getProjectProgress: (projectId: string) => { completed: number; total: number; progress: number }
}

export function ActiveProjectsGrid({
  projects,
  selectedProjectId,
  onSelectProject,
  getProjectProgress,
}: ActiveProjectsGridProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
        Active Projects
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Active projects">
        {projects.map((project) => {
          const { completed, total, progress } = getProjectProgress(project.id)
          const isSelected = selectedProjectId === project.id
          const status = project.status ?? 'on_track'
          const badge = statusBadgeConfig[status]

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project.id)}
              className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/30'
                  : 'border-gray-200 bg-gray-50 hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-indigo-700'
              }`}
              role="listitem"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {project.name}
                </h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                {project.description}
              </p>
              <div className="mt-3 w-full">
                <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{completed} / {total} tasks</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Due {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
