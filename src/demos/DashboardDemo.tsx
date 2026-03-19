import type { Task, DashboardStats } from '../types/task'
import { Dashboard } from '../components/features/dashboard/Dashboard'

const stats: DashboardStats = {
  totalTasks: 48,
  completed: 22,
  inProgress: 15,
  overdue: 5,
}

const tasks: Task[] = [
  {
    id: '1',
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
    title: 'Fix cart quantity update bug',
    description: 'Resolve race condition when rapidly updating item quantities. Cart total sometimes shows stale value.',
    status: 'todo',
    priority: 'urgent',
    dueDate: '2026-03-12',
    assignee: { name: 'Sam Okafor', avatarUrl: 'https://i.pravatar.cc/256?u=samokafor' },
    tags: ['Bug', 'Frontend'],
  },
]

export function DashboardDemo() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          A task management dashboard with sidebar navigation, statistics
          widgets, and a kanban-style task board. Supports dark mode — use the
          moon/sun toggle in the dashboard header.
        </p>
      </header>

      <Dashboard stats={stats} tasks={tasks} />
    </div>
  )
}
