export type ProjectStatus = 'on_track' | 'at_risk' | 'delayed'

export interface Project {
  id: string
  name: string
  description: string
  progress: number
  totalTasks: number
  completedTasks: number
  dueDate: string
  /** Trend vs previous period, e.g. +5 means 5% more completed than last week */
  progressTrend?: number
  status?: ProjectStatus
}

export interface TeamMember {
  id: string
  name: string
  avatarUrl: string
  role: string
}

export type MilestoneStatus = 'completed' | 'in_progress' | 'upcoming'

export interface Milestone {
  id: string
  title: string
  dueDate: string
  status: MilestoneStatus
  completedTasks?: number
  totalTasks?: number
}

export type ActivityType = 'task_completed' | 'task_created' | 'task_assigned' | 'comment' | 'status_change' | 'team_member_added'

export interface Activity {
  id: string
  type: ActivityType
  message: string
  user: { name: string; avatarUrl: string }
  timestamp: string
  taskTitle?: string
}
