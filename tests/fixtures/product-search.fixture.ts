import { test as base } from '@playwright/test'

import { ProductSearchPage } from '../pages/ProductSearchPage'

export { ProductSearchPage } from '../pages/ProductSearchPage'

export const test = base.extend<{ productSearch: ProductSearchPage }>({
  productSearch: async ({ page }, use) => {
    const ps = new ProductSearchPage(page)
    await use(ps)
  },
})

export { expect } from '@playwright/test'
