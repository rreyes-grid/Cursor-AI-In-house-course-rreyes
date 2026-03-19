import { test, expect } from './fixtures/product-search.fixture'

test.describe('Product Search — Search Input', () => {
  test('renders the search page with heading and search input', async ({ productSearch }) => {
    await productSearch.goto()
    await expect(productSearch.heading).toBeVisible()
    await expect(productSearch.searchInput).toBeVisible()
    await expect(productSearch.searchInput).toHaveAttribute('placeholder', 'Search products…')
  })

  test('displays the first page of products on load', async ({ productSearch }) => {
    await productSearch.goto()
    const count = await productSearch.getResultCount()
    expect(count).toBe(6)
  })

  test('filters products by title keyword', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('headphones')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBeGreaterThan(0)
    for (const title of titles) {
      expect(title.toLowerCase()).toContain('headphones')
    }
  })

  test('filters products by description keyword', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('bluetooth')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBeGreaterThan(0)
    expect(titles).toContain('Portable Bluetooth Speaker')
  })

  test('search is case-insensitive', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('KEYBOARD')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles).toContain('Mechanical Keyboard — Cherry MX Blue')
  })

  test('shows result count when filtering', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('headphones')

    await expect(productSearch.resultsSummary).toBeVisible()
    await expect(productSearch.resultsSummary).toContainText('results found')
  })

  test('clearing search input restores all products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('headphones')

    const filteredCount = await productSearch.getResultCount()
    expect(filteredCount).toBeLessThan(6)

    await productSearch.search('')
    const fullCount = await productSearch.getResultCount()
    expect(fullCount).toBe(6)
  })

  test('partial text matches work', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('wire')

    const titles = await productSearch.getVisibleProductTitles()
    expect(titles.length).toBeGreaterThan(0)
    expect(titles).toContain('Wireless Noise-Cancelling Headphones')
  })
})
