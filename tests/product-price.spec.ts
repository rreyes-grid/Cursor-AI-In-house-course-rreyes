import { test, expect } from './fixtures/product-search.fixture'

test.describe('Product Search — Price Range Filter', () => {
  test('min price filter excludes cheaper products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMinPrice('100')

    const prices = await productSearch.getVisibleProductPrices()
    expect(prices.length).toBeGreaterThan(0)
    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(100)
    }
  })

  test('max price filter excludes expensive products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMaxPrice('50')

    const prices = await productSearch.getVisibleProductPrices()
    expect(prices.length).toBeGreaterThan(0)
    for (const price of prices) {
      expect(price).toBeLessThanOrEqual(50)
    }
  })

  test('min and max price together define a range', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMinPrice('50')
    await productSearch.setMaxPrice('150')

    const prices = await productSearch.getVisibleProductPrices()
    expect(prices.length).toBeGreaterThan(0)
    for (const price of prices) {
      expect(price).toBeGreaterThanOrEqual(50)
      expect(price).toBeLessThanOrEqual(150)
    }
  })

  test('very narrow price range shows specific products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMinPrice('49')
    await productSearch.setMaxPrice('50')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles).toContain('Ultra-Slim Laptop Stand')
    expect(titles).toContain('Fitness Tracker Band')
  })

  test('clearing min price removes lower bound', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMinPrice('200')

    const filteredCount = await productSearch.getResultCount()

    await productSearch.setMinPrice('')
    const allCount = await productSearch.getResultCount()
    expect(allCount).toBeGreaterThan(filteredCount)
  })

  test('price filter combined with category', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Audio')
    await productSearch.setMaxPrice('50')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles).toContain('Portable Bluetooth Speaker')
    for (const title of titles) {
      expect(title).not.toBe('Wireless Noise-Cancelling Headphones')
    }
  })

  test('price filter combined with search', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('speaker')
    await productSearch.setMaxPrice('50')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBeGreaterThan(0)
    expect(titles).toContain('Portable Bluetooth Speaker')
    const prices = await productSearch.getVisibleProductPrices()
    for (const price of prices) {
      expect(price).toBeLessThanOrEqual(50)
    }
  })

  test('result count updates with price filter', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMaxPrice('35')

    await expect(productSearch.resultsSummary).toBeVisible()
    await expect(productSearch.resultsSummary).toContainText('results found')
  })
})
