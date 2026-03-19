import { test, expect } from './fixtures/product-search.fixture'

test.describe('Product Search — Pagination', () => {
  test('shows pagination when results exceed page size', async ({ productSearch }) => {
    await productSearch.goto()
    await expect(productSearch.pagination).toBeVisible()
  })

  test('first page shows 6 products', async ({ productSearch }) => {
    await productSearch.goto()
    const count = await productSearch.getResultCount()
    expect(count).toBe(6)
  })

  test('page 1 is active by default', async ({ productSearch }) => {
    await productSearch.goto()
    await expect(productSearch.pageButton(1)).toHaveAttribute('aria-current', 'page')
  })

  test('previous button is disabled on first page', async ({ productSearch }) => {
    await productSearch.goto()
    await expect(productSearch.previousButton()).toBeDisabled()
  })

  test('clicking next page shows different products', async ({ productSearch }) => {
    await productSearch.goto()
    const firstPageTitles = await productSearch.getVisibleProductTitles()

    await productSearch.nextButton().click()

    const secondPageTitles = await productSearch.getVisibleProductTitles()
    expect(secondPageTitles.length).toBeGreaterThan(0)
    expect(secondPageTitles).not.toEqual(firstPageTitles)
  })

  test('page 2 becomes active after clicking next', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.nextButton().click()
    await expect(productSearch.pageButton(2)).toHaveAttribute('aria-current', 'page')
  })

  test('previous button becomes enabled on page 2', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.nextButton().click()
    await expect(productSearch.previousButton()).toBeEnabled()
  })

  test('clicking previous goes back to page 1', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.nextButton().click()
    await expect(productSearch.pageButton(2)).toHaveAttribute('aria-current', 'page')

    await productSearch.previousButton().click()
    await expect(productSearch.pageButton(1)).toHaveAttribute('aria-current', 'page')
  })

  test('clicking a page number navigates directly', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.pageButton(2).click()

    await expect(productSearch.pageButton(2)).toHaveAttribute('aria-current', 'page')
    const count = await productSearch.getResultCount()
    expect(count).toBeGreaterThan(0)
  })

  test('last page shows remaining products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.pageButton(3).click()

    const count = await productSearch.getResultCount()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThanOrEqual(6)
  })

  test('next button is disabled on the last page', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.pageButton(3).click()
    await expect(productSearch.nextButton()).toBeDisabled()
  })

  test('pagination shows correct "Showing X–Y of Z" text', async ({ productSearch }) => {
    await productSearch.goto()
    await expect(productSearch.pagination).toContainText('Showing')
    await expect(productSearch.pagination).toContainText('of')
    await expect(productSearch.pagination).toContainText('15')
  })

  test('page 2 shows correct range', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.pageButton(2).click()
    await expect(productSearch.pagination).toContainText('7')
    await expect(productSearch.pagination).toContainText('12')
  })

  test('filtering reduces pages and hides pagination if single page', async ({ productSearch }) => {
    await productSearch.goto()
    await expect(productSearch.pagination).toBeVisible()

    await productSearch.selectCategory('Bags')
    await expect(productSearch.pagination).toBeHidden()
  })

  test('pagination appears again when filter is cleared', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Bags')
    await expect(productSearch.pagination).toBeHidden()

    await productSearch.selectCategory('')
    await expect(productSearch.pagination).toBeVisible()
  })
})
