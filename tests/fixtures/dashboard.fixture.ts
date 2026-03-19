import { test as base, type Page, type Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly statsSection: Locator
  readonly taskBoard: Locator
  readonly darkModeToggle: Locator
  readonly notificationsButton: Locator
  readonly sidebarNav: Locator
  readonly mobileMenuButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Dashboard', exact: true }).first()
    this.statsSection = page.getByLabel('Task statistics')
    this.taskBoard = page.getByLabel('Task board')
    this.darkModeToggle = page.getByLabel(/Switch to (dark|light) mode/).first()
    this.notificationsButton = page.getByLabel('Notifications').first()
    this.sidebarNav = page.getByLabel('Dashboard navigation').first()
    this.mobileMenuButton = page.getByLabel('Open sidebar')
  }

  async goto() {
    await this.page.goto('/demos/dashboard')
    await this.heading.waitFor()
  }

  statWidget(label: string) {
    return this.statsSection.locator('div').filter({ hasText: label }).first()
  }

  column(name: string) {
    return this.taskBoard.getByRole('heading', { name, exact: true }).locator('..')
  }

  columnCount(name: string) {
    return this.taskBoard
      .getByRole('heading', { name, exact: true })
      .locator('..')
      .locator('span')
      .first()
  }

  taskCard(title: string) {
    return this.page.getByRole('article', { name: title })
  }

  taskStatusButton(title: string) {
    return this.taskCard(title).getByRole('button', { name: /Change status/ })
  }

  sidebarItem(label: string) {
    return this.sidebarNav.getByRole('button', { name: label })
  }
}

export const test = base.extend<{ dashboard: DashboardPage }>({
  dashboard: async ({ page }, use) => {
    const dashboard = new DashboardPage(page)
    await use(dashboard)
  },
})

export { expect } from '@playwright/test'
