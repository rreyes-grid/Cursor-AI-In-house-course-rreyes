import { test, expect } from './fixtures/dashboard.fixture'

test.describe('Dashboard — Navigation & Rendering', () => {
  test('navigates to the dashboard demo from the home page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /Dashboard/i }).first().click()
    await expect(page).toHaveURL('/demos/dashboard')
    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: true }).first(),
    ).toBeVisible()
  })

  test('renders the dashboard header with title and subtitle', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.heading).toBeVisible()
    await expect(dashboard.page.getByText("Welcome back! Here's what's happening today.")).toBeVisible()
  })

  test('displays all four stat widgets with correct values', async ({ dashboard }) => {
    await dashboard.goto()

    await expect(dashboard.statsSection).toBeVisible()
    await expect(dashboard.statsSection.getByText('Total Tasks')).toBeVisible()
    await expect(dashboard.statsSection.getByText('48', { exact: true })).toBeVisible()
    await expect(dashboard.statsSection.getByText('Completed')).toBeVisible()
    await expect(dashboard.statsSection.getByText('22', { exact: true })).toBeVisible()
    await expect(dashboard.statsSection.getByText('In Progress')).toBeVisible()
    await expect(dashboard.statsSection.getByText('15', { exact: true })).toBeVisible()
    await expect(dashboard.statsSection.getByText('Overdue')).toBeVisible()
    await expect(dashboard.statsSection.getByText('5', { exact: true })).toBeVisible()
  })

  test('displays stat widget trend indicators', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.statsSection.getByText('+12%')).toBeVisible()
    await expect(dashboard.statsSection.getByText('+8%')).toBeVisible()
    await expect(dashboard.statsSection.getByText('-3%')).toBeVisible()
  })

  test('renders all four kanban columns with headers', async ({ dashboard }) => {
    await dashboard.goto()

    for (const col of ['To Do', 'In Progress', 'In Review', 'Done']) {
      await expect(
        dashboard.taskBoard.getByRole('heading', { name: col, exact: true }),
      ).toBeVisible()
    }
  })

  test('renders task cards with title, priority, and status', async ({ dashboard }) => {
    await dashboard.goto()

    const card = dashboard.taskCard('Design new landing page wireframes')
    await expect(card).toBeVisible()
    await expect(card.getByText('High', { exact: true })).toBeVisible()
    await expect(card.getByText('To Do', { exact: true })).toBeVisible()
    await expect(card.getByText('Jane Cooper')).toBeVisible()
  })

  test('renders task cards with tags', async ({ dashboard }) => {
    await dashboard.goto()

    const card = dashboard.taskCard('Implement user authentication flow')
    await expect(card.getByText('Backend')).toBeVisible()
    await expect(card.getByText('Security')).toBeVisible()
  })

  test('renders task cards with due dates', async ({ dashboard }) => {
    await dashboard.goto()

    const card = dashboard.taskCard('Migrate database to PostgreSQL 16')
    await expect(card.getByRole('time')).toBeVisible()
  })

  test('displays correct task count badges per column', async ({ dashboard }) => {
    await dashboard.goto()

    const todoHeader = dashboard.taskBoard.getByRole('heading', { name: 'To Do', exact: true })
    const todoCount = todoHeader.locator('..').locator('span')
    await expect(todoCount).toHaveText('3')
  })

  test('renders the sidebar navigation on desktop', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.sidebarNav).toBeVisible()
    await expect(dashboard.page.getByText('TaskFlow').first()).toBeVisible()

    for (const item of ['Dashboard', 'My Tasks', 'Calendar', 'Team', 'Analytics', 'Settings']) {
      await expect(dashboard.sidebarItem(item)).toBeVisible()
    }
  })

  test('sidebar shows badge count on My Tasks', async ({ dashboard }) => {
    await dashboard.goto()
    const myTasks = dashboard.sidebarItem('My Tasks')
    await expect(myTasks.getByText('12')).toBeVisible()
  })

  test('sidebar highlights the active nav item', async ({ dashboard }) => {
    await dashboard.goto()
    const dashboardBtn = dashboard.sidebarItem('Dashboard')
    await expect(dashboardBtn).toHaveAttribute('aria-current', 'page')
  })

  test('clicking sidebar item updates active state', async ({ dashboard }) => {
    await dashboard.goto()
    await dashboard.sidebarItem('Calendar').click()

    const calendarBtn = dashboard.sidebarItem('Calendar')
    await expect(calendarBtn).toHaveAttribute('aria-current', 'page')

    const dashboardBtn = dashboard.sidebarItem('Dashboard')
    await expect(dashboardBtn).not.toHaveAttribute('aria-current', 'page')
  })

  test('renders notifications button with indicator dot', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.notificationsButton).toBeVisible()
  })
})
