import { test, expect } from './fixtures/dashboard.fixture'

test.describe('Dashboard — Responsive Design', () => {
  test.describe('Desktop (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test('sidebar is visible on desktop', async ({ dashboard }) => {
      await dashboard.goto()
      await expect(dashboard.sidebarNav).toBeVisible()
    })

    test('hamburger menu is hidden on desktop', async ({ dashboard }) => {
      await dashboard.goto()
      await expect(dashboard.mobileMenuButton).toBeHidden()
    })

    test('stat widgets display in a grid', async ({ dashboard }) => {
      await dashboard.goto()
      await expect(dashboard.statsSection).toBeVisible()
      await expect(dashboard.statsSection.getByText('Total Tasks')).toBeVisible()
      await expect(dashboard.statsSection.getByText('Completed')).toBeVisible()
      await expect(dashboard.statsSection.getByText('In Progress')).toBeVisible()
      await expect(dashboard.statsSection.getByText('Overdue')).toBeVisible()
    })

    test('kanban columns are all visible at once', async ({ dashboard }) => {
      await dashboard.goto()
      for (const col of ['To Do', 'In Progress', 'In Review', 'Done']) {
        await expect(
          dashboard.taskBoard.getByRole('heading', { name: col, exact: true }),
        ).toBeVisible()
      }
    })
  })

  test.describe('Tablet (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } })

    test('sidebar is hidden on tablet', async ({ dashboard }) => {
      await dashboard.goto()
      const desktopSidebar = dashboard.page.locator('aside.hidden.w-60')
      await expect(desktopSidebar).toBeHidden()
    })

    test('hamburger menu is visible on tablet', async ({ dashboard }) => {
      await dashboard.goto()
      await expect(dashboard.mobileMenuButton).toBeVisible()
    })

    test('stat widgets still display', async ({ dashboard }) => {
      await dashboard.goto()
      await expect(dashboard.statsSection.getByText('Total Tasks')).toBeVisible()
      await expect(dashboard.statsSection.getByText('48')).toBeVisible()
    })
  })

  test.describe('Mobile (375px)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('sidebar is hidden on mobile', async ({ dashboard }) => {
      await dashboard.goto()
      const desktopSidebar = dashboard.page.locator('aside.hidden.w-60')
      await expect(desktopSidebar).toBeHidden()
    })

    test('hamburger opens mobile sidebar overlay', async ({ dashboard }) => {
      await dashboard.goto()
      await expect(dashboard.mobileMenuButton).toBeVisible()
      await dashboard.mobileMenuButton.click()
      await dashboard.page.waitForTimeout(400)

      const mobileSidebar = dashboard.page.locator('.fixed aside')
      await expect(mobileSidebar).toBeVisible()
      await expect(
        mobileSidebar.getByRole('button', { name: 'My Tasks' }),
      ).toBeVisible()
    })

    test('clicking backdrop closes mobile sidebar', async ({ dashboard }) => {
      await dashboard.goto()
      await dashboard.mobileMenuButton.click()
      await dashboard.page.waitForTimeout(400)

      const backdrop = dashboard.page.locator('.bg-black\\/50').first()
      await backdrop.click({ position: { x: 300, y: 300 }, force: true })
      await dashboard.page.waitForTimeout(400)

      await expect(dashboard.mobileMenuButton).toBeVisible()
    })

    test('task cards are readable on mobile', async ({ dashboard }) => {
      await dashboard.goto()
      const card = dashboard.taskCard('Design new landing page wireframes')
      await expect(card).toBeVisible()
      await expect(card.getByText('High', { exact: true })).toBeVisible()
      await expect(card.getByText('Jane Cooper')).toBeVisible()
    })

    test('stat widgets stack vertically on mobile', async ({ dashboard }) => {
      await dashboard.goto()
      await expect(dashboard.statsSection.getByText('Total Tasks')).toBeVisible()
      await expect(dashboard.statsSection.getByText('Overdue')).toBeVisible()
    })

    test('task status can be changed on mobile', async ({ dashboard }) => {
      await dashboard.goto()
      const statusBtn = dashboard.taskStatusButton('Design new landing page wireframes')
      await expect(statusBtn).toContainText('To Do')
      await statusBtn.click()
      await expect(statusBtn).toContainText('In Progress')
    })
  })
})
