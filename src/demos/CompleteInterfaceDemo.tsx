import type { Task, DashboardStats } from '../types/task'
import type { Project, TeamMember, Activity, Milestone } from '../types/dashboard'
import { ThemeProvider } from '../context/ThemeContext'
import { UserProvider } from '../context/UserContext'
import { TaskManagementDashboard } from '../components/features/task-dashboard/TaskManagementDashboard'

const stats: DashboardStats = {
  totalTasks: 48,
  completed: 22,
  inProgress: 15,
  overdue: 5,
}

const projects: Project[] = [
  {
    id: '1',
    name: 'Product Launch Q2',
    description: 'End-to-end product launch including marketing, engineering, and customer success initiatives.',
    progress: 58,
    totalTasks: 10,
    completedTasks: 2,
    dueDate: '2026-04-30',
    progressTrend: 12,
  },
  {
    id: '2',
    name: 'Platform Migration',
    description: 'Migrate legacy systems to cloud infrastructure with zero downtime.',
    progress: 35,
    totalTasks: 8,
    completedTasks: 3,
    dueDate: '2026-05-15',
    progressTrend: 5,
  },
  {
    id: '3',
    name: 'Mobile App Redesign',
    description: 'Complete UI/UX overhaul of the mobile application.',
    progress: 72,
    totalTasks: 6,
    completedTasks: 4,
    dueDate: '2026-03-28',
    progressTrend: 18,
  },
]

const currentUser = {
  id: '1',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera',
  role: 'Tech Lead',
}

const milestones: Milestone[] = [
  { id: '1', title: 'Design Phase Complete', dueDate: '2026-03-15', status: 'completed', completedTasks: 8, totalTasks: 8 },
  { id: '2', title: 'Backend API Ready', dueDate: '2026-03-25', status: 'in_progress', completedTasks: 4, totalTasks: 6 },
  { id: '3', title: 'QA Sign-off', dueDate: '2026-04-10', status: 'upcoming', completedTasks: 0, totalTasks: 12 },
  { id: '4', title: 'Product Launch', dueDate: '2026-04-30', status: 'upcoming', completedTasks: 0, totalTasks: 48 },
]

const teamMembers: TeamMember[] = [
  { id: '1', name: 'Jane Cooper', avatarUrl: 'https://i.pravatar.cc/256?u=janecooper', role: 'Design Lead' },
  { id: '2', name: 'Marcus Chen', avatarUrl: 'https://i.pravatar.cc/256?u=marcuschen', role: 'Backend' },
  { id: '3', name: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera', role: 'Tech Lead' },
  { id: '4', name: 'Priya Sharma', avatarUrl: 'https://i.pravatar.cc/256?u=priyasharma', role: 'Frontend' },
  { id: '5', name: 'Sam Okafor', avatarUrl: 'https://i.pravatar.cc/256?u=samokafor', role: 'QA' },
]

const activities: Activity[] = [
  {
    id: '1',
    type: 'task_completed',
    message: 'completed',
    user: { name: 'Jane Cooper', avatarUrl: 'https://i.pravatar.cc/256?u=janecooper' },
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    taskTitle: 'Design new landing page wireframes',
  },
  {
    id: '2',
    type: 'status_change',
    message: 'moved',
    user: { name: 'Marcus Chen', avatarUrl: 'https://i.pravatar.cc/256?u=marcuschen' },
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    taskTitle: 'Set up CI/CD pipeline',
  },
  {
    id: '3',
    type: 'task_assigned',
    message: 'assigned',
    user: { name: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera' },
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    taskTitle: 'Implement user authentication flow',
  },
  {
    id: '4',
    type: 'comment',
    message: 'commented on',
    user: { name: 'Priya Sharma', avatarUrl: 'https://i.pravatar.cc/256?u=priyasharma' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    taskTitle: 'Build product search API endpoint',
  },
  {
    id: '5',
    type: 'task_created',
    message: 'created',
    user: { name: 'Sam Okafor', avatarUrl: 'https://i.pravatar.cc/256?u=samokafor' },
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    taskTitle: 'Add dark mode support to dashboard',
  },
  {
    id: '6',
    type: 'task_completed',
    message: 'completed',
    user: { name: 'Marcus Chen', avatarUrl: 'https://i.pravatar.cc/256?u=marcuschen' },
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    taskTitle: 'Write API documentation for v2',
  },
]

const tasks: Task[] = [
  {
    id: '1',
    projectId: '1',
    title: 'Design new landing page wireframes',
    description: 'Create low-fidelity wireframes for the updated marketing landing page with hero section and feature highlights.',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-03-18',
    assignee: { name: 'Jane Cooper', avatarUrl: 'https://i.pravatar.cc/256?u=janecooper' },
    tags: ['Design', 'Marketing'],
  },
  {
    id: '2',
    projectId: '1',
    title: 'Set up CI/CD pipeline for staging',
    description: 'Configure GitHub Actions workflow with automated testing, linting, and deployment to the staging environment.',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-03-20',
    assignee: { name: 'Marcus Chen', avatarUrl: 'https://i.pravatar.cc/256?u=marcuschen' },
    tags: ['DevOps'],
  },
  {
    id: '3',
    projectId: '1',
    title: 'Implement user authentication flow',
    description: 'Build login, registration, and password reset pages with JWT-based auth and refresh token rotation.',
    status: 'in_progress',
    priority: 'urgent',
    dueDate: '2026-03-14',
    assignee: { name: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera' },
    tags: ['Backend', 'Security'],
  },
  {
    id: '4',
    projectId: '1',
    title: 'Build product search API endpoint',
    description: 'Create a full-text search endpoint with filtering by category, price range, and rating. Include pagination.',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-03-16',
    assignee: { name: 'Priya Sharma', avatarUrl: 'https://i.pravatar.cc/256?u=priyasharma' },
    tags: ['Backend', 'API'],
  },
  {
    id: '5',
    projectId: '1',
    title: 'Add dark mode support to dashboard',
    description: 'Implement Tailwind dark variant across all dashboard components with a toggle in the header.',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-03-19',
    assignee: { name: 'Sam Okafor', avatarUrl: 'https://i.pravatar.cc/256?u=samokafor' },
    tags: ['Frontend', 'UI'],
  },
  {
    id: '6',
    projectId: '1',
    title: 'Write API documentation for v2',
    description: 'Document all new REST endpoints using OpenAPI spec. Include request/response examples and error codes.',
    status: 'in_review',
    priority: 'medium',
    dueDate: '2026-03-15',
    assignee: { name: 'Marcus Chen', avatarUrl: 'https://i.pravatar.cc/256?u=marcuschen' },
    tags: ['Docs'],
  },
  {
    id: '7',
    projectId: '1',
    title: 'Accessibility audit for checkout flow',
    description: 'Run Lighthouse and axe-core audits on the checkout pages. Fix critical WCAG 2.1 AA violations.',
    status: 'in_review',
    priority: 'high',
    dueDate: '2026-03-13',
    assignee: { name: 'Jane Cooper', avatarUrl: 'https://i.pravatar.cc/256?u=janecooper' },
    tags: ['A11y', 'Frontend'],
  },
  {
    id: '8',
    projectId: '1',
    title: 'Migrate database to PostgreSQL 16',
    description: 'Upgrade from PostgreSQL 14 to 16. Test data migrations, verify query plans, and update connection pooling.',
    status: 'done',
    priority: 'urgent',
    dueDate: '2026-03-10',
    assignee: { name: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera' },
    tags: ['DevOps', 'Database'],
  },
  {
    id: '9',
    projectId: '1',
    title: 'Create onboarding email templates',
    description: 'Design and code responsive email templates for the 3-step onboarding sequence using MJML.',
    status: 'done',
    priority: 'low',
    dueDate: '2026-03-09',
    assignee: { name: 'Priya Sharma', avatarUrl: 'https://i.pravatar.cc/256?u=priyasharma' },
    tags: ['Design', 'Marketing'],
  },
  {
    id: '10',
    projectId: '1',
    title: 'Fix cart quantity update bug',
    description: 'Resolve race condition when rapidly updating item quantities. Cart total sometimes shows stale value.',
    status: 'todo',
    priority: 'urgent',
    dueDate: '2026-03-12',
    assignee: { name: 'Sam Okafor', avatarUrl: 'https://i.pravatar.cc/256?u=samokafor' },
    tags: ['Bug', 'Frontend'],
  },
  {
    id: '11',
    projectId: '2',
    title: 'Set up cloud infrastructure',
    description: 'Configure AWS/GCP resources for the migration.',
    status: 'done',
    priority: 'high',
    dueDate: '2026-03-20',
    assignee: { name: 'Marcus Chen', avatarUrl: 'https://i.pravatar.cc/256?u=marcuschen' },
    tags: ['DevOps', 'Cloud'],
  },
  {
    id: '12',
    projectId: '2',
    title: 'Data migration scripts',
    description: 'Write and test ETL pipelines for legacy data.',
    status: 'in_progress',
    priority: 'urgent',
    dueDate: '2026-04-05',
    assignee: { name: 'Alex Rivera', avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera' },
    tags: ['Backend', 'Data'],
  },
  {
    id: '13',
    projectId: '3',
    title: 'New navigation design',
    description: 'Implement bottom tab navigation and drawer.',
    status: 'done',
    priority: 'high',
    dueDate: '2026-03-15',
    assignee: { name: 'Priya Sharma', avatarUrl: 'https://i.pravatar.cc/256?u=priyasharma' },
    tags: ['Design', 'Mobile'],
  },
  {
    id: '14',
    projectId: '3',
    title: 'Dark theme implementation',
    description: 'Add dark mode support across all screens.',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-03-25',
    assignee: { name: 'Sam Okafor', avatarUrl: 'https://i.pravatar.cc/256?u=samokafor' },
    tags: ['Frontend', 'UI'],
  },
]

export function CompleteInterfaceDemo() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Collaboration</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Team collaboration interface with active projects, progress per project, tasks by project,
          team avatars, activity feed, and quick actions. Supports dark mode.
        </p>
      </header>

      <ThemeProvider defaultTheme="light">
        <UserProvider user={currentUser}>
          <TaskManagementDashboard
            stats={stats}
            tasks={tasks}
            projects={projects}
            teamMembers={teamMembers}
            activities={activities}
            milestones={milestones}
          />
        </UserProvider>
      </ThemeProvider>
    </div>
  )
}
