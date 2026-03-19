export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  projectId?: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  assignee: {
    name: string
    avatarUrl: string
  }
  tags: string[]
}

export interface DashboardStats {
  totalTasks: number
  completed: number
  inProgress: number
  overdue: number
}
