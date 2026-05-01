import { test, expect } from './fixtures/dashboard.fixture'

test.describe('Dashboard — Task Status Workflow', () => {
  test('cycles a task from To Do → In Progress', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Design new landing page wireframes')

    await expect(statusBtn).toContainText('To Do')
    await statusBtn.click()
    await expect(statusBtn).toContainText('In Progress')
  })

  test('cycles a task from In Progress → In Review', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Implement user authentication flow')
    await expect(statusBtn).toContainText('In Progress')
    await statusBtn.click()
    await expect(statusBtn).toContainText('In Review')
  })

  test('cycles a task from In Review → Done', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Write API documentation for v2')
    await expect(statusBtn).toContainText('In Review')
    await statusBtn.click()
    await expect(statusBtn).toContainText('Done')
  })

  test('cycles a task from Done → To Do (wrap around)', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Migrate database to PostgreSQL 16')
    await expect(statusBtn).toContainText('Done')
    await statusBtn.click()
    await expect(statusBtn).toContainText('To Do')
  })

  test('full lifecycle: To Do → In Progress → In Review → Done', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Set up CI/CD pipeline for staging')

    await expect(statusBtn).toContainText('To Do')

    await statusBtn.click()
    await expect(statusBtn).toContainText('In Progress')

    await statusBtn.click()
    await expect(statusBtn).toContainText('In Review')

    await statusBtn.click()
    await expect(statusBtn).toContainText('Done')
  })

  test('task moves between kanban columns when status changes', async ({ dashboard }) => {
    await dashboard.goto()

    const title = 'Fix cart quantity update bug'
    const card = dashboard.taskCard(title)

    await expect(card).toBeVisible()
    await expect(card.getByText('To Do')).toBeVisible()

    await dashboard.taskStatusButton(title).click()

    await expect(card.getByText('In Progress')).toBeVisible()
  })

  test('multiple tasks can be advanced independently', async ({ dashboard }) => {
    await dashboard.goto()

    const btn1 = dashboard.taskStatusButton('Design new landing page wireframes')
    const btn2 = dashboard.taskStatusButton('Set up CI/CD pipeline for staging')

    await btn1.click()
    await expect(btn1).toContainText('In Progress')
    await expect(btn2).toContainText('To Do')

    await btn2.click()
    await expect(btn1).toContainText('In Progress')
    await expect(btn2).toContainText('In Progress')
  })

  test('task card preserves priority badge after status change', async ({ dashboard }) => {
    await dashboard.goto()

    const card = dashboard.taskCard('Design new landing page wireframes')
    await expect(card.getByText('High', { exact: true })).toBeVisible()

    await dashboard.taskStatusButton('Design new landing page wireframes').click()

    await expect(card.getByText('High', { exact: true })).toBeVisible()
  })

  test('task card preserves assignee after status change', async ({ dashboard }) => {
    await dashboard.goto()

    const card = dashboard.taskCard('Design new landing page wireframes')
    await expect(card.getByText('Jane Cooper')).toBeVisible()

    await dashboard.taskStatusButton('Design new landing page wireframes').click()

    await expect(card.getByText('Jane Cooper')).toBeVisible()
  })

  test('task card preserves tags after status change', async ({ dashboard }) => {
    await dashboard.goto()

    const card = dashboard.taskCard('Implement user authentication flow')
    await expect(card.getByText('Backend')).toBeVisible()
    await expect(card.getByText('Security')).toBeVisible()

    await dashboard.taskStatusButton('Implement user authentication flow').click()

    await expect(card.getByText('Backend')).toBeVisible()
    await expect(card.getByText('Security')).toBeVisible()
  })

  test('rapid status clicks advance correctly without glitching', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Design new landing page wireframes')
    await statusBtn.click()
    await statusBtn.click()
    await statusBtn.click()

    await expect(statusBtn).toContainText('Done')
  })
})
