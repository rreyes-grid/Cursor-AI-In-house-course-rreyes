import { expect, test } from '@playwright/test'

import {
  MOCK_DISPLAY_NAME,
  installEcommerceApiMock,
} from './fixtures/ecommerce-api-mock'

async function registerAndShop(
  page: import('@playwright/test').Page,
  name: string,
  email: string,
) {
  await page.goto('/demos/ecommerce')
  await page.getByRole('button', { name: /^Register$/i }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('LongShopPass123!')
  await page.getByRole('button', { name: /Create account/i }).click()
  await expect(page.getByText(/Playwright Shopper/i)).toBeVisible()
}

test.describe('Ecommerce checkout (mock API)', () => {
  test.beforeEach(async ({ page }) => {
    installEcommerceApiMock(page)
  })

  test.describe('positive paths', () => {
    test('multi-SKU cart, quantity change, and mock payment → confirmation + order row + email', async ({
      page,
    }) => {
      const email = `pw.multi.${Date.now()}@example.test`
      await registerAndShop(page, 'Multi SKU', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await expect(page.getByRole('alert')).toContainText(/Added/i)

      await page
        .locator('article')
        .filter({ hasText: 'Playwright Tote' })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()

      await page.getByRole('button', { name: /Cart & checkout/i }).click()

      await expect(page.getByText('Cart lines')).toBeVisible()
      await page.getByRole('button', { name: '+' }).first().click()

      await expect(page.getByText('$79.97').first()).toBeVisible()

      await page.getByRole('button', { name: /^Place order$/i }).click()

      await expect(page.getByRole('heading', { name: /Latest confirmation/i })).toBeVisible()
      await expect(page.locator('table tbody tr')).toHaveCount(1)

      await page.getByRole('button', { name: /Email log/i }).click()
      await expect(page.getByText(/order_confirmation/i)).toBeVisible()
      await expect(page.getByText(/Thanks for your order/i)).toBeVisible()
    })

    test('WELCOME5 fixed discount applies then checkout succeeds', async ({ page }) => {
      const email = `pw.welcome5.${Date.now()}@example.test`
      await registerAndShop(page, 'Welcome Buyer', email)

      await page
        .locator('article')
        .filter({ hasText: 'Playwright Tote' })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()

      await page.getByRole('button', { name: /Cart & checkout/i }).click()
      await page.getByLabel(/Discount code/i).fill('WELCOME5')
      await page.getByRole('button', { name: /^Apply$/i }).click()

      await expect(page.getByText('(WELCOME5)')).toBeVisible()
      await expect(page.getByText('$14.99')).toBeVisible()

      await page.getByRole('button', { name: /^Place order$/i }).click()
      await expect(page.getByRole('heading', { name: /Latest confirmation/i })).toBeVisible()
    })

    test('SAVE10 succeeds on eligible subtotal; remove code restores full total', async ({ page }) => {
      const email = `pw.discount-cycle.${Date.now()}@example.test`
      await registerAndShop(page, 'Discount Toggle', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await page.getByRole('button', { name: /Cart & checkout/i }).click()

      await page.getByLabel(/Discount code/i).fill('SAVE10')
      await page.getByRole('button', { name: /^Apply$/i }).click()
      await expect(page.getByText('(SAVE10)')).toBeVisible()
      await expect(page.getByText('$27.00').first()).toBeVisible()

      await page.getByRole('button', { name: /Remove code/i }).click()
      await expect(page.getByText('$29.99').first()).toBeVisible()

      await page.getByRole('button', { name: /^Place order$/i }).click()
      await expect(page.getByRole('heading', { name: /Latest confirmation/i })).toBeVisible()
    })
  })

  test.describe('negative paths', () => {
    test('unknown discount code shows error without changing totals', async ({ page }) => {
      const email = `pw.badcode.${Date.now()}@example.test`
      await registerAndShop(page, 'Bad Code', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await page.getByRole('button', { name: /Cart & checkout/i }).click()

      await page.getByLabel(/Discount code/i).fill('NOT_A_REAL_COUPON_99')
      await page.getByRole('button', { name: /^Apply$/i }).click()

      await expect(page.getByRole('alert')).toContainText(/Invalid discount code/i)
      await expect(page.getByText('$29.99').first()).toBeVisible()
    })

    test('declined PSP returns error while cart stays purchasable', async ({ page }) => {
      const email = `pw.decline.${Date.now()}@example.test`
      await registerAndShop(page, 'Declined User', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await page.getByRole('button', { name: /Cart & checkout/i }).click()
      await page.getByRole('radio', { name: /declined/i }).check()

      await page.getByRole('button', { name: /^Place order$/i }).click()

      await expect(page.getByRole('alert')).toContainText(/Payment was declined/i)
      await expect(page.getByText(MOCK_DISPLAY_NAME)).toBeVisible()
    })

    test('non-gateway token is rejected with PSP-style decline (cart echoed)', async ({ page }) => {
      const email = `pw.fake-token.${Date.now()}@example.test`
      await registerAndShop(page, 'Fake PSP', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await page.getByRole('button', { name: /Cart & checkout/i }).click()

      await page.getByLabel(/Custom payment token/i).fill('tok_stolen_card_payload')

      await page.getByRole('button', { name: /^Place order$/i }).click()
      await expect(page.getByRole('alert')).toContainText(/Payment was declined/i)
      await expect(page.getByText('$29.99').first()).toBeVisible()
    })
  })

  test.describe('edge cases', () => {
    test('empty cart shows copy and disables Place order', async ({ page }) => {
      const email = `pw.empty.${Date.now()}@example.test`
      await registerAndShop(page, 'Empty Cart', email)

      await page.getByRole('button', { name: /Cart & checkout/i }).click()
      await expect(page.getByText('Your cart is empty.')).toBeVisible()

      await expect(page.getByRole('button', { name: /^Place order$/i })).toBeDisabled()
    })

    test('SAVE10 below minimum shows server warning and keeps full total', async ({ page }) => {
      const email = `pw.submin.${Date.now()}@example.test`
      await registerAndShop(page, 'Subtotal Edge', email)

      await page
        .locator('article')
        .filter({ hasText: 'Playwright Tote' })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()

      await page.getByRole('button', { name: /Cart & checkout/i }).click()
      await page.getByLabel(/Discount code/i).fill('SAVE10')
      await page.getByRole('button', { name: /^Apply$/i }).click()

      await expect(page.getByText(/min_subtotal_not_met/i)).toBeVisible()
      await expect(page.getByText('$19.99').first()).toBeVisible()

      await page.getByRole('button', { name: /^Place order$/i }).click()
      await expect(page.getByRole('heading', { name: /Latest confirmation/i })).toBeVisible()
    })

    test('clearing cart after add disables checkout again', async ({ page }) => {
      const email = `pw.clear.${Date.now()}@example.test`
      await registerAndShop(page, 'Clear Cart', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await page.getByRole('button', { name: /Cart & checkout/i }).click()

      await page.getByRole('button', { name: /^Remove$/i }).click()
      await expect(page.getByText('Your cart is empty.')).toBeVisible()
      await expect(page.getByRole('button', { name: /^Place order$/i })).toBeDisabled()
    })
  })

  test.describe('security-oriented checks', () => {
    test('discount field SQL injection payloads are rejected as invalid codes', async ({ page }) => {
      const email = `pw.sqli-discount.${Date.now()}@example.test`
      await registerAndShop(page, 'SQL Discount', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await page.getByRole('button', { name: /Cart & checkout/i }).click()

      await page
        .getByLabel(/Discount code/i)
        .fill("'; DROP TABLE eco_orders; --")
      await page.getByRole('button', { name: /^Apply$/i }).click()

      await expect(page.getByRole('alert')).toContainText(/Invalid discount code/i)
      await expect(page.getByRole('heading', { name: /Latest confirmation/i })).not.toBeVisible()
    })

    test('payment token failing length validation shows field error without charging', async ({
      page,
    }) => {
      const email = `pw.pay-short.${Date.now()}@example.test`
      await registerAndShop(page, 'Short Token', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await page.getByRole('button', { name: /Cart & checkout/i }).click()

      await page.getByLabel(/Custom payment token/i).fill('xy')
      await page.getByRole('button', { name: /^Place order$/i }).click()

      await expect(page.getByRole('alert')).toContainText(/between 3 and 128 characters/i)
      await expect(page.getByRole('heading', { name: /Latest confirmation/i })).not.toBeVisible()
      await expect(page.getByText(MOCK_DISPLAY_NAME)).toBeVisible()
    })

    test('oversized payment token is rejected by validation', async ({ page }) => {
      const email = `pw.pay-long.${Date.now()}@example.test`
      await registerAndShop(page, 'Long Token', email)

      await page
        .locator('article')
        .filter({ hasText: MOCK_DISPLAY_NAME })
        .getByRole('button', { name: /^Add to cart$/i })
        .click()
      await page.getByRole('button', { name: /Cart & checkout/i }).click()

      await page.getByLabel(/Custom payment token/i).fill('x'.repeat(129))
      await page.getByRole('button', { name: /^Place order$/i }).click()

      await expect(page.getByRole('alert')).toContainText(/between 3 and 128 characters/i)
    })
  })
})
