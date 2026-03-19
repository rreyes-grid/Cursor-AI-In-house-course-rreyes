import type { Activity } from '../../../types/dashboard'
import { Avatar } from '../../ui/Avatar'

const activityIcons: Record<Activity['type'], string> = {
  task_completed: 'text-emerald-500',
  task_created: 'text-indigo-500',
  task_assigned: 'text-blue-500',
  comment: 'text-amber-500',
  status_change: 'text-purple-500',
  team_member_added: 'text-blue-500',
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function UserPlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )
}

const iconMap: Record<Activity['type'], React.ReactNode> = {
  task_completed: <CheckIcon />,
  task_created: <PlusIcon />,
  task_assigned: <UserPlusIcon />,
  comment: <ChatIcon />,
  status_change: <ArrowRightIcon />,
  team_member_added: <UserPlusIcon />,
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface ActivityFeedProps {
  activities: Activity[]
  maxItems?: number
}

export function ActivityFeed({ activities, maxItems = 8 }: ActivityFeedProps) {
  const items = activities.slice(0, maxItems)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700" aria-label="Recent activity feed">
        {items.map((activity) => (
          <li key={activity.id} className="flex gap-3 px-5 py-4">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activityIcons[activity.type]}`}
              aria-hidden
            >
              {iconMap[activity.type]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-white">{activity.user.name}</span>{' '}
                {activity.message}
                {activity.taskTitle && (
                  <span className="font-medium text-gray-900 dark:text-white"> {activity.taskTitle}</span>
                )}
              </p>
              <time
                dateTime={activity.timestamp}
                className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400"
              >
                {formatTimeAgo(activity.timestamp)}
              </time>
            </div>
            <div className="shrink-0">
              <Avatar
                src={activity.user.avatarUrl}
                alt={activity.user.name}
                size="sm"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
