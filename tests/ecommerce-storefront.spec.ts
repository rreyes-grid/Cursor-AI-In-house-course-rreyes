import { expect, test } from '@playwright/test'

import {
  MOCK_DISPLAY_NAME,
  installEcommerceApiMock,
} from './fixtures/ecommerce-api-mock'

test.describe('Ecommerce storefront (mock API)', () => {
  test.beforeEach(async ({ page }) => {
    installEcommerceApiMock(page)
  })

  test('home links into the storefront demo hero', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Ecommerce Storefront', exact: true }).click()

    await expect(page).toHaveURL(/\/demos\/ecommerce$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Demo Storefront' })).toBeVisible()
    await expect(
      page.getByText(/catalog, cart, discount codes/i),
    ).toBeVisible()
  })

  test('register → browse catalog → add to cart sees totals update', async ({ page }) => {
    await page.goto('/demos/ecommerce')

    await page.getByRole('button', { name: /^Register$/i }).click()

    await page.getByLabel('Name').fill('PW Flow')
    await page.getByLabel('Email').fill('pw.flow@example.test')
    await page.getByLabel(/Password/).fill('LongShopPass123!')

    await page.getByRole('button', { name: /Create account/i }).click()

    await expect(page.getByText(/Playwright Shopper/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Shop$/i })).toBeVisible()

    await expect(page.getByRole('heading', { name: MOCK_DISPLAY_NAME })).toBeVisible()
    await expect(page.getByText('SKU PW-MUG')).toBeVisible()

    await page.getByRole('button', { name: /^Add to cart$/i }).first().click()
    await expect(page.getByRole('alert')).toContainText(/Added/i)

    await page.getByRole('button', { name: /Cart & checkout/i }).click()

    await expect(page.getByText(/Cart lines/i)).toBeVisible()
    await expect(page.getByText('$29.99').first()).toBeVisible()
  })

  test('search filters catalog rows', async ({ page }) => {
    await page.goto('/demos/ecommerce')
    await page.getByRole('button', { name: /^Register$/i }).click()
    await page.getByLabel('Name').fill('Search User')
    await page.getByLabel('Email').fill('pw.search@example.test')
    await page.getByLabel(/Password/).fill('LongShopPass123!')
    await page.getByRole('button', { name: /Create account/i }).click()

    await page.getByLabel(/Search catalog/i).fill(MOCK_DISPLAY_NAME)
    await page.getByRole('button', { name: /^Search$/i }).click()

    await expect(page.getByRole('heading', { name: MOCK_DISPLAY_NAME })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^Playwright Tote$/ })).not.toBeVisible()
  })

  test('SAVE10 discount and mock checkout confirms order then shows email audit', async ({
    page,
  }) => {
    await page.goto('/demos/ecommerce')
    await page.getByRole('button', { name: /^Register$/i }).click()
    await page.getByLabel('Name').fill('Checkout User')
    await page.getByLabel('Email').fill('pw.checkout@example.test')
    await page.getByLabel(/Password/).fill('LongShopPass123!')
    await page.getByRole('button', { name: /Create account/i }).click()

    await page.getByRole('button', { name: /^Add to cart$/i }).first().click()

    await page.getByRole('button', { name: /Cart & checkout/i }).click()
    await page.getByLabel(/Discount code/i).fill('SAVE10')
    await page.getByRole('button', { name: /^Apply$/i }).click()

    await expect(page.getByText(/SAVE10/).first()).toBeVisible()

    await page.getByRole('button', { name: /^Place order$/i }).click()

    await expect(page.getByRole('heading', { name: /Latest confirmation/i })).toBeVisible()
    await expect(page.locator('table tbody tr').first()).toBeVisible()

    await page.getByRole('button', { name: /Email log/i }).click()

    await expect(page.getByText(/order_confirmation/i)).toBeVisible()
    await expect(page.getByText(/Order confirmed/u)).toBeVisible()
  })

  test('declined payment keeps cart lines visible via alert banner', async ({ page }) => {
    await page.goto('/demos/ecommerce')
    await page.getByRole('button', { name: /^Register$/i }).click()
    await page.getByLabel('Name').fill('Decline Flow')
    await page.getByLabel('Email').fill('pw.declined@example.test')
    await page.getByLabel(/Password/).fill('LongShopPass123!')
    await page.getByRole('button', { name: /Create account/i }).click()

    await page.getByRole('button', { name: /^Add to cart$/i }).first().click()
    await page.getByRole('button', { name: /Cart & checkout/i }).click()

    await page.getByRole('radio', { name: /declined/i }).check()

    await page.getByRole('button', { name: /^Place order$/i }).click()

    await expect(page.getByRole('alert')).toContainText(/Payment was declined/i)
    await expect(page.getByText(MOCK_DISPLAY_NAME).first()).toBeVisible()
  })
})
