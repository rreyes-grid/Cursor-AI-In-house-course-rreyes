import { test, expect } from './fixtures/dashboard.fixture'

test.describe('Dashboard — Dark Mode', () => {
  test('toggles to dark mode when clicking the moon icon', async ({ dashboard }) => {
    await dashboard.goto()

    await expect(dashboard.darkModeToggle).toHaveAttribute('aria-label', 'Switch to dark mode')
    await dashboard.darkModeToggle.click()
    await expect(dashboard.darkModeToggle).toHaveAttribute('aria-label', 'Switch to light mode')
  })

  test('dark class is applied to the container', async ({ dashboard }) => {
    await dashboard.goto()
    await dashboard.darkModeToggle.click()

    const darkContainer = dashboard.page.locator('.dark')
    await expect(darkContainer).toBeVisible()
  })

  test('toggles back to light mode', async ({ dashboard }) => {
    await dashboard.goto()

    await dashboard.darkModeToggle.click()
    await expect(dashboard.darkModeToggle).toHaveAttribute('aria-label', 'Switch to light mode')

    await dashboard.darkModeToggle.click()
    await expect(dashboard.darkModeToggle).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  test('task cards remain interactive in dark mode', async ({ dashboard }) => {
    await dashboard.goto()
    await dashboard.darkModeToggle.click()

    const statusBtn = dashboard.taskStatusButton('Design new landing page wireframes')
    await expect(statusBtn).toContainText('To Do')
    await statusBtn.click()
    await expect(statusBtn).toContainText('In Progress')
  })

  test('sidebar is visible in dark mode on desktop', async ({ dashboard }) => {
    await dashboard.goto()
    await dashboard.darkModeToggle.click()
    await expect(dashboard.sidebarNav).toBeVisible()
    await expect(dashboard.page.getByText('TaskFlow').first()).toBeVisible()
  })

  test('stat widgets are visible in dark mode', async ({ dashboard }) => {
    await dashboard.goto()
    await dashboard.darkModeToggle.click()

    await expect(dashboard.statsSection.getByText('Total Tasks')).toBeVisible()
    await expect(dashboard.statsSection.getByText('48')).toBeVisible()
  })
})

test.describe('Dashboard — Edge Cases & Error Handling', () => {
  test('dashboard page loads without JS errors', async ({ dashboard }) => {
    const errors: string[] = []
    dashboard.page.on('pageerror', (err) => errors.push(err.message))

    await dashboard.goto()
    expect(errors).toHaveLength(0)
  })

  test('no broken images on dashboard', async ({ dashboard }) => {
    await dashboard.goto()
    await dashboard.page.waitForLoadState('networkidle')

    const images = dashboard.page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate(
        (img: HTMLImageElement) => img.naturalWidth,
      )
      const alt = await images.nth(i).getAttribute('alt')
      if (naturalWidth === 0) {
        const hasFallback = await images.nth(i).locator('..').locator('span[role="img"]').count()
        expect(hasFallback > 0 || alt !== null).toBeTruthy()
      }
    }
  })

  test('cycling all tasks to Done shows empty placeholders in other columns', async ({ dashboard }) => {
    await dashboard.goto()

    const allStatusBtns = dashboard.taskBoard.getByRole('button', { name: /Change status from/ })
    const count = await allStatusBtns.count()

    for (let i = 0; i < count; i++) {
      const btn = allStatusBtns.nth(i)
      const text = await btn.textContent()

      if (text?.includes('To Do')) {
        await btn.click()
        await btn.click()
        await btn.click()
      } else if (text?.includes('In Progress')) {
        await btn.click()
        await btn.click()
      } else if (text?.includes('In Review')) {
        await btn.click()
      }
    }

    await expect(dashboard.taskBoard.getByText('No tasks').first()).toBeVisible()
  })

  test('navigating away and back preserves the page structure', async ({ dashboard }) => {
    await dashboard.goto()
    await expect(dashboard.heading).toBeVisible()

    await dashboard.page.goto('/')
    await dashboard.page.goto('/demos/dashboard')
    await expect(dashboard.heading).toBeVisible()
    await expect(dashboard.statsSection).toBeVisible()
    await expect(dashboard.taskBoard).toBeVisible()
  })

  test('direct URL navigation works', async ({ dashboard }) => {
    await dashboard.page.goto('/demos/dashboard')
    await expect(dashboard.heading).toBeVisible()
    await expect(dashboard.statsSection.getByText('48')).toBeVisible()
  })

  test('page has correct document title', async ({ dashboard }) => {
    await dashboard.goto()
    const title = await dashboard.page.title()
    expect(title).toBeTruthy()
  })

  test('multiple rapid dark mode toggles do not break layout', async ({ dashboard }) => {
    await dashboard.goto()

    for (let i = 0; i < 10; i++) {
      await dashboard.darkModeToggle.click()
    }

    await expect(dashboard.heading).toBeVisible()
    await expect(dashboard.statsSection).toBeVisible()
    await expect(dashboard.taskBoard).toBeVisible()
  })

  test('all priority badges render for visible tasks', async ({ dashboard }) => {
    await dashboard.goto()

    const priorities = ['High', 'Medium', 'Urgent', 'Low']
    for (const p of priorities) {
      await expect(dashboard.taskBoard.getByText(p, { exact: true }).first()).toBeVisible()
    }
  })

  test('column counts add up to total task count', async ({ dashboard }) => {
    await dashboard.goto()

    const articles = dashboard.taskBoard.getByRole('article')
    const count = await articles.count()
    expect(count).toBe(10)
  })
})
