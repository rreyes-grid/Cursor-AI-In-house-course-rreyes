import { test, expect } from './fixtures/dashboard.fixture'

test.describe('Dashboard — Accessibility', () => {
  test('dashboard has proper heading hierarchy', async ({ dashboard }) => {
    await dashboard.goto()

    const h1 = dashboard.page.getByRole('heading', { level: 1 })
    await expect(h1.first()).toBeVisible()

    const h2 = dashboard.page.getByRole('heading', { level: 2 }).first()
    await expect(h2).toBeVisible()
  })

  test('stat widgets section has accessible label', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.statsSection).toBeVisible()
  })

  test('task board section has accessible label', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.taskBoard).toBeVisible()
  })

  test('each task card is an article with aria-label', async ({ dashboard }) => {
    await dashboard.goto()

    const articles = dashboard.taskBoard.getByRole('article')
    const count = await articles.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const label = await articles.nth(i).getAttribute('aria-label')
      expect(label).toBeTruthy()
    }
  })

  test('status change buttons have descriptive aria-labels', async ({ dashboard }) => {
    await dashboard.goto()

    const statusButtons = dashboard.taskBoard.getByRole('button', { name: /Change status from/ })
    const count = await statusButtons.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const label = await statusButtons.nth(i).getAttribute('aria-label')
      expect(label).toMatch(/Change status from/)
    }
  })

  test('dark mode toggle has accessible aria-label', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.darkModeToggle).toBeVisible()
    const label = await dashboard.darkModeToggle.getAttribute('aria-label')
    expect(label).toMatch(/Switch to (dark|light) mode/)
  })

  test('sidebar navigation has accessible label', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.sidebarNav).toBeVisible()
  })

  test('active sidebar item has aria-current="page"', async ({ dashboard }) => {
    await dashboard.goto()
    const activeItem = dashboard.sidebarNav.locator('[aria-current="page"]')
    await expect(activeItem).toHaveCount(1)
    await expect(activeItem).toContainText('Dashboard')
  })

  test('notifications button has aria-label', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.notificationsButton).toBeVisible()
    await expect(dashboard.notificationsButton).toHaveAttribute('aria-label', 'Notifications')
  })

  test('task status button is keyboard focusable', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Design new landing page wireframes')
    await statusBtn.focus()
    await expect(statusBtn).toBeFocused()
  })

  test('task status can be changed via keyboard (Enter)', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Design new landing page wireframes')
    await statusBtn.focus()
    await expect(statusBtn).toContainText('To Do')
    await dashboard.page.keyboard.press('Enter')
    await expect(statusBtn).toContainText('In Progress')
  })

  test('task status can be changed via keyboard (Space)', async ({ dashboard }) => {
    await dashboard.goto()

    const statusBtn = dashboard.taskStatusButton('Set up CI/CD pipeline for staging')
    await statusBtn.focus()
    await expect(statusBtn).toContainText('To Do')
    await dashboard.page.keyboard.press('Space')
    await expect(statusBtn).toContainText('In Progress')
  })

  test('dark mode toggle is keyboard accessible', async ({ dashboard }) => {
    await dashboard.goto()
    await dashboard.darkModeToggle.focus()
    await expect(dashboard.darkModeToggle).toBeFocused()
    await dashboard.page.keyboard.press('Enter')
    await expect(dashboard.darkModeToggle).toHaveAttribute('aria-label', 'Switch to light mode')
  })

  test('sidebar nav items are keyboard navigable', async ({ dashboard }) => {
    await dashboard.goto()

    for (const item of ['Dashboard', 'My Tasks', 'Calendar']) {
      const btn = dashboard.sidebarItem(item)
      await btn.focus()
      await expect(btn).toBeFocused()
    }
  })

  test('all images have alt text', async ({ dashboard }) => {
    await dashboard.goto()

    const images = dashboard.page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('due dates use semantic time elements', async ({ dashboard }) => {
    await dashboard.goto()

    const timeElements = dashboard.taskBoard.locator('time[datetime]')
    const count = await timeElements.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const dt = await timeElements.nth(i).getAttribute('datetime')
      expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
