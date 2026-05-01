import type { Locator, Page } from '@playwright/test'

import { BasePage } from './BasePage'

/** Page object for `/demos/ecommerce` storefront UI (REST backed or mocked). */
export class EcommerceStorefrontPage extends BasePage {
  readonly demoHeading: Locator

  constructor(page: Page) {
    super(page)
    this.demoHeading = page.getByRole('heading', { level: 1, name: 'Demo Storefront' })
  }

  async goto() {
    await this.page.goto('/demos/ecommerce')
    await this.demoHeading.waitFor()
  }

  registerButton() {
    return this.page.getByRole('button', { name: /^Register$/i })
  }

  shopButton() {
    return this.page.getByRole('button', { name: /^Shop$/i })
  }
}
