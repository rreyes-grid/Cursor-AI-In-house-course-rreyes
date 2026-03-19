import { test, expect } from './fixtures/product-search.fixture'

test.describe('Product Search — Sort Options', () => {
  test('sort dropdown has all expected options', async ({ productSearch }) => {
    await productSearch.goto()

    const options = productSearch.sortSelect.locator('option')
    const labels: string[] = []
    const count = await options.count()
    for (let i = 0; i < count; i++) {
      labels.push((await options.nth(i).textContent()) ?? '')
    }

    expect(labels).toEqual([
      'Relevance',
      'Price: Low to High',
      'Price: High to Low',
      'Highest Rated',
      'Name: A → Z',
      'Name: Z → A',
    ])
  })

  test('sort by price low to high orders correctly', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectSort('price-asc')

    const prices = await productSearch.getVisibleProductPrices()
    expect(prices.length).toBeGreaterThan(1)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })

  test('sort by price high to low orders correctly', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectSort('price-desc')

    const prices = await productSearch.getVisibleProductPrices()
    expect(prices.length).toBeGreaterThan(1)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1])
    }
  })

  test('sort by name A→Z orders alphabetically', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectSort('name-asc')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBeGreaterThan(1)
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i].localeCompare(titles[i - 1])).toBeGreaterThanOrEqual(0)
    }
  })

  test('sort by name Z→A orders reverse alphabetically', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectSort('name-desc')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBeGreaterThan(1)
    for (let i = 1; i < titles.length; i++) {
      expect(titles[i].localeCompare(titles[i - 1])).toBeLessThanOrEqual(0)
    }
  })

  test('sort by highest rated shows best-rated first', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectSort('rating')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles[0]).toBe('Vintage Leather Messenger Bag')
  })

  test('sorting works with active search filter', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('watch')
    await productSearch.selectSort('price-asc')

    const prices = await productSearch.getVisibleProductPrices()
    expect(prices.length).toBeGreaterThan(1)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })

  test('sorting works with active category filter', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Audio')
    await productSearch.selectSort('price-desc')

    const prices = await productSearch.getVisibleProductPrices()
    expect(prices.length).toBeGreaterThan(1)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeLessThanOrEqual(prices[i - 1])
    }
  })

  test('changing sort resets to page 1', async ({ productSearch }) => {
    await productSearch.goto()

    if (await productSearch.pagination.isVisible()) {
      await productSearch.nextButton().click()
      await expect(productSearch.pageButton(2)).toHaveAttribute('aria-current', 'page')
    }

    await productSearch.selectSort('price-asc')

    if (await productSearch.pagination.isVisible()) {
      await expect(productSearch.pageButton(1)).toHaveAttribute('aria-current', 'page')
    }
  })
})
