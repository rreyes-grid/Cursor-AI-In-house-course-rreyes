import { test as base } from '@playwright/test'

import { DashboardPage } from '../pages/DashboardPage'

export { DashboardPage } from '../pages/DashboardPage'

export const test = base.extend<{ dashboard: DashboardPage }>({
  dashboard: async ({ page }, use) => {
    const dashboard = new DashboardPage(page)
    await use(dashboard)
  },
})

export { expect } from '@playwright/test'
