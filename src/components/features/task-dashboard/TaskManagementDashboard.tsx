/**
 * TeamCollaborationDashboard - Team collaboration interface:
 *
 * - Active projects grid with progress for each project
 * - Tasks belonging to each project (filtered by projectId)
 * - State: useState for sidebar, taskList, team, activities, selectedProjectId
 * - Context API: ThemeContext, UserContext
 */
import { useState, useMemo, useCallback } from 'react'
import type { Task, TaskStatus, DashboardStats } from '../../../types/task'
import { useThemeOptional } from '../../../context/ThemeContext'
import { useUserOptional } from '../../../context/UserContext'
import type { Project, ProjectStatus, TeamMember, Activity, Milestone } from '../../../types/dashboard'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { TeamCollaborationSidebar } from './TeamCollaborationSidebar'
import { ActiveProjectsGrid } from './ActiveProjectsGrid'
import { StatWidget } from '../dashboard/StatWidget'
import { TaskCard } from '../dashboard/TaskCard'
import { TaskProgressChart } from './TaskProgressChart'
import { ActivityFeed } from './ActivityFeed'
import { ProjectMilestones } from './ProjectMilestones'
import { TimelineView } from './TimelineView'

function ClipboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ArrowTrendingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  )
}

function ExclamationIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function UserPlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function DocumentChartIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

/** Default user when UserContext is not provided */
const DEFAULT_USER = {
  id: '1',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera',
  role: 'Tech Lead',
}

interface TaskManagementDashboardProps {
  stats: DashboardStats
  tasks: Task[]
  projects: Project[]
  teamMembers: TeamMember[]
  activities: Activity[]
  milestones?: Milestone[]
}

export function TaskManagementDashboard({
  stats: _stats,
  tasks,
  projects,
  teamMembers,
  activities,
  milestones = [],
}: TaskManagementDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskList, setTaskList] = useState(tasks)
  const [teamMemberList, setTeamMemberList] = useState(teamMembers)
  const [activityList, setActivityList] = useState(activities)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id ?? null)

  // Context API for shared state: theme and user (fallback to local when not in provider)
  const themeContext = useThemeOptional()
  const userContext = useUserOptional()
  const [localDark, setLocalDark] = useState(false)
  const dark = themeContext ? themeContext.isDark : localDark
  const toggleDark = themeContext ? themeContext.toggleTheme : () => setLocalDark((d) => !d)
  const currentUser = userContext?.user ?? DEFAULT_USER

  // Event handler for task status changes - updates taskList, adds activity when completed
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = taskList.find((t) => t.id === taskId)
    setTaskList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    )
    if (newStatus === 'done' && task) {
      setActivityList((prev) => [
        {
          id: `activity-${Date.now()}`,
          type: 'task_completed',
          message: 'completed',
          user: { name: currentUser.name, avatarUrl: currentUser.avatarUrl },
          timestamp: new Date().toISOString(),
          taskTitle: task.title,
        },
        ...prev,
      ])
    }
  }

  // Event handler for adding team member - updates team section and activity feed
  const handleAddTeamMember = () => {
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: `Member ${teamMemberList.length + 1}`,
      avatarUrl: `https://i.pravatar.cc/256?u=member${Date.now()}`,
      role: 'Member',
    }
    setTeamMemberList((prev) => [newMember, ...prev])
    setActivityList((prev) => [
      {
        id: `activity-${Date.now()}`,
        type: 'team_member_added',
        message: 'added',
        user: { name: currentUser.name, avatarUrl: currentUser.avatarUrl },
        timestamp: new Date().toISOString(),
        taskTitle: newMember.name,
      },
      ...prev,
    ])
  }

  // Tasks for selected project (filter by projectId)
  const selectedProjectTasks = useMemo(() => {
    if (!selectedProjectId) return []
    return taskList.filter((t) => t.projectId === selectedProjectId)
  }, [taskList, selectedProjectId])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  // Project progress helper for ActiveProjectsGrid
  const getProjectProgress = useCallback((projectId: string) => {
    const projTasks = taskList.filter((t) => t.projectId === projectId)
    const completed = projTasks.filter((t) => t.status === 'done').length
    const total = projTasks.length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completed, total, progress }
  }, [taskList])

  // Live stats for selected project
  const liveStats = useMemo(() => {
    const tasksForStats = selectedProjectTasks
    const now = new Date().toISOString().slice(0, 10)
    const completed = tasksForStats.filter((t) => t.status === 'done').length
    const inProgress = tasksForStats.filter((t) => t.status === 'in_progress').length
    const overdue = tasksForStats.filter((t) => t.status !== 'done' && t.dueDate < now).length
    return {
      totalTasks: tasksForStats.length,
      completed,
      inProgress,
      overdue,
    }
  }, [selectedProjectTasks])

  const chartData = useMemo(() => {
    const statusCounts: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
    }
    selectedProjectTasks.forEach((t) => {
      statusCounts[t.status]++
    })
    return (['todo', 'in_progress', 'in_review', 'done'] as TaskStatus[]).map((status) => ({
      status,
      count: statusCounts[status],
      label: statusLabels[status],
    }))
  }, [selectedProjectTasks])

  // Real-time project metrics for selected project
  const projectMetrics = useMemo(() => {
    const completed = selectedProjectTasks.filter((t) => t.status === 'done').length
    const total = selectedProjectTasks.length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    return { completedTasks: completed, totalTasks: total, progress }
  }, [selectedProjectTasks])

  const statusBadge = useMemo((): ProjectStatus => {
    if (!selectedProject) return 'on_track'
    if (selectedProject.status) return selectedProject.status
    const due = new Date(selectedProject.dueDate).getTime()
    const now = new Date().getTime()
    const daysUntilDue = (due - now) / (1000 * 60 * 60 * 24)
    const { progress } = projectMetrics
    if (daysUntilDue < 0) return 'delayed'
    if (daysUntilDue < 7 && progress < 80) return 'at_risk'
    return 'on_track'
  }, [selectedProject, projectMetrics])

  const columns: { status: TaskStatus; label: string }[] = [
    { status: 'todo', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'in_review', label: 'In Review' },
    { status: 'done', label: 'Done' },
  ]

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex min-h-[800px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <TeamCollaborationSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setSidebarOpen(true)}
              className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Open sidebar"
            >
              <HamburgerIcon />
            </button>

            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                Team Collaboration
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active projects and team progress
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleDark}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {dark ? <SunIcon /> : <MoonIcon />}
              </button>
              <button
                aria-label="Notifications"
                className="relative cursor-pointer rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <BellIcon />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
              </button>
              <div className="ml-1 hidden sm:block">
                <Avatar
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  size="sm"
                />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Active Projects grid */}
            <section className="mb-6">
              <ActiveProjectsGrid
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                getProjectProgress={getProjectProgress}
              />
            </section>

            {/* Selected project detail + Team + Quick actions */}
            <section className="mb-6 grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
              {/* Selected project overview - show placeholder when none selected */}
              {selectedProject ? (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-indigo-100 p-2.5 dark:bg-indigo-950">
                      <FolderIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                          {selectedProject.name}
                        </h2>
                        {(() => {
                          const badgeConfig: Record<ProjectStatus, { label: string; cls: string }> = {
                            on_track: { label: 'On Track', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' },
                            at_risk: { label: 'At Risk', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
                            delayed: { label: 'Delayed', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400' },
                          }
                          const { label, cls } = badgeConfig[statusBadge]
                          return (
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
                              {label}
                            </span>
                          )
                        })()}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {selectedProject.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                              style={{ width: `${projectMetrics.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {projectMetrics.progress}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {projectMetrics.completedTasks} / {projectMetrics.totalTasks} tasks
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Due {new Date(selectedProject.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {selectedProject.progressTrend != null && (
                          <span
                            className={`text-xs font-medium ${
                              selectedProject.progressTrend >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {selectedProject.progressTrend >= 0 ? '+' : ''}{selectedProject.progressTrend}% vs last week
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 dark:border-gray-700 dark:bg-gray-900 lg:col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a project above to view its details and tasks
                  </p>
                </div>
              )}

              {/* Team avatars + Quick actions */}
              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Team
                  </h3>
                  <div className="flex -space-x-2" role="list" aria-label="Team members">
                    {teamMemberList.map((member) => (
                      <div
                        key={member.id}
                        className="ring-2 ring-white dark:ring-gray-800"
                        title={`${member.name} - ${member.role}`}
                        role="listitem"
                      >
                        <Avatar
                          src={member.avatarUrl}
                          alt={member.name}
                          size="md"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {teamMemberList.length} members
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="primary" size="sm" className="w-full justify-center gap-2">
                      <PlusIcon />
                      Create new task
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center gap-2"
                      onClick={handleAddTeamMember}
                    >
                      <UserPlusIcon />
                      Add team member
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-center gap-2">
                      <DocumentChartIcon />
                      Generate report
                    </Button>
                    <Button variant="secondary" size="sm" className="w-full justify-center gap-2">
                      <CalendarIcon />
                      Schedule meeting
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Stat widgets - derived from taskList, update when tasks change */}
            <section aria-label="Task statistics" className="mb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatWidget
                  label="Total Tasks"
                  value={liveStats.totalTasks}
                  icon={<ClipboardIcon />}
                  trend={{ value: 12, positive: true }}
                  color="indigo"
                />
                <StatWidget
                  label="Completed"
                  value={liveStats.completed}
                  icon={<CheckCircleIcon />}
                  trend={{ value: 8, positive: true }}
                  color="emerald"
                />
                <StatWidget
                  label="In Progress"
                  value={liveStats.inProgress}
                  icon={<ArrowTrendingIcon />}
                  color="amber"
                />
                <StatWidget
                  label="Overdue"
                  value={liveStats.overdue}
                  icon={<ExclamationIcon />}
                  trend={{ value: -3, positive: false }}
                  color="rose"
                />
              </div>
            </section>

            {/* Charts + Activity feed + Milestones + Timeline */}
            <section className="mb-8 space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <TaskProgressChart data={chartData} title="Task Progress by Status" />
                </div>
                <div>
                  <ActivityFeed activities={activityList} maxItems={6} />
                </div>
              </div>
              <div className={`grid gap-6 ${milestones.length > 0 ? 'lg:grid-cols-2' : ''}`}>
                {milestones.length > 0 && (
                  <ProjectMilestones milestones={milestones} />
                )}
                <TimelineView tasks={selectedProjectTasks} weeks={6} />
              </div>
            </section>

            {/* Kanban task board - tasks for selected project */}
            <section aria-label="Task board">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                {selectedProject ? `Tasks for ${selectedProject.name}` : 'Tasks'}
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {columns.map(({ status, label }) => {
                  const colTasks = selectedProjectTasks.filter((t) => t.status === status)
                  return (
                    <div key={status}>
                      <div className="mb-3 flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {label}
                        </h3>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {colTasks.length > 0 ? (
                          colTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onStatusChange={handleStatusChange}
                            />
                          ))
                        ) : (
                          <div className="rounded-xl border-2 border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                            {selectedProject ? 'No tasks in this project' : 'Select a project to view tasks'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
