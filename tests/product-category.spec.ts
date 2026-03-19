import { test, expect } from './fixtures/product-search.fixture'

test.describe('Product Search — Category Filter', () => {
  test('category dropdown lists all categories', async ({ productSearch }) => {
    await productSearch.goto()

    const options = productSearch.categorySelect.locator('option')
    const texts: string[] = []
    const count = await options.count()
    for (let i = 0; i < count; i++) {
      texts.push((await options.nth(i).textContent()) ?? '')
    }

    expect(texts).toContain('All Categories')
    expect(texts).toContain('Audio')
    expect(texts).toContain('Accessories')
    expect(texts).toContain('Wearables')
    expect(texts).toContain('Bags')
  })

  test('filters to only Audio products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Audio')

    await expect(productSearch.resultsSummary).toContainText('results found')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBeGreaterThan(0)
    expect(titles).toContain('Wireless Noise-Cancelling Headphones')
    expect(titles).toContain('Portable Bluetooth Speaker')
  })

  test('filters to only Wearables products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Wearables')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBe(3)
    expect(titles).toContain('Smart Fitness Watch — Series 5')
    expect(titles).toContain('Fitness Tracker Band')
    expect(titles).toContain('Smartwatch Pro — Titanium')
  })

  test('filters to only Bags products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Bags')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBe(3)
    expect(titles).toContain('Vintage Leather Messenger Bag')
    expect(titles).toContain('Canvas Laptop Backpack')
    expect(titles).toContain('Compact Travel Organizer')
  })

  test('selecting "All Categories" shows all products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Audio')

    const filteredCount = await productSearch.getResultCount()
    expect(filteredCount).toBeLessThan(6)

    await productSearch.selectCategory('')
    const allCount = await productSearch.getResultCount()
    expect(allCount).toBe(6)
  })

  test('combining search with category filter narrows results', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Audio')
    await productSearch.search('wireless')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBeGreaterThan(0)
    for (const title of titles) {
      expect(title.toLowerCase()).toContain('wireless')
    }
  })

  test('changing category resets to page 1', async ({ productSearch }) => {
    await productSearch.goto()

    const pagination = productSearch.pagination
    if (await pagination.isVisible()) {
      await productSearch.nextButton().click()
    }

    await productSearch.selectCategory('Bags')
    const cards = await productSearch.getResultCount()
    expect(cards).toBe(3)
  })
})
