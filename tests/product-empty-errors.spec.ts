import { test, expect } from './fixtures/product-search.fixture'

test.describe('Product Search — Empty Results', () => {
  test('shows empty state when search has no matches', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('xyznonexistent')

    await expect(productSearch.emptyState()).toBeVisible()
    await expect(productSearch.emptyState()).toContainText('No products found')
    await expect(productSearch.emptyState()).toContainText('Try adjusting your search or filter criteria')
  })

  test('empty state has a clear filters button', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('xyznonexistent')

    const clearBtn = productSearch.emptyState().getByRole('button', { name: 'Clear all filters' })
    await expect(clearBtn).toBeVisible()
  })

  test('clicking clear in empty state restores products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('xyznonexistent')
    await expect(productSearch.emptyState()).toBeVisible()

    const clearBtn = productSearch.emptyState().getByRole('button', { name: 'Clear all filters' })
    await clearBtn.click()

    await expect(productSearch.emptyState()).toBeHidden()
    const count = await productSearch.getResultCount()
    expect(count).toBe(6)
  })

  test('empty state when price range excludes all products', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMinPrice('10000')

    await expect(productSearch.emptyState()).toBeVisible()
    await expect(productSearch.emptyState()).toContainText('No products found')
  })

  test('empty state when max price is too low', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMaxPrice('1')

    await expect(productSearch.emptyState()).toBeVisible()
  })

  test('empty state when combining category + search with no overlap', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Bags')
    await productSearch.search('headphones')

    await expect(productSearch.emptyState()).toBeVisible()
  })

  test('pagination is hidden when empty state is shown', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('xyznonexistent')

    await expect(productSearch.pagination).toBeHidden()
  })

  test('product list is not rendered when empty', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('xyznonexistent')

    await expect(productSearch.productList).toBeHidden()
  })
})

test.describe('Product Search — Clear Filters', () => {
  test('clear all filters button appears when any filter is active', async ({ productSearch }) => {
    await productSearch.goto()

    await expect(productSearch.clearFiltersButton).toBeHidden()

    await productSearch.search('test')
    await expect(productSearch.clearFiltersButton).toBeVisible()
  })

  test('clear all filters resets search', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('headphones')
    await productSearch.clearFiltersButton.click()

    await expect(productSearch.searchInput).toHaveValue('')
    const count = await productSearch.getResultCount()
    expect(count).toBe(6)
  })

  test('clear all filters resets category', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectCategory('Audio')
    await productSearch.clearFiltersButton.click()

    await expect(productSearch.categorySelect).toHaveValue('')
  })

  test('clear all filters resets price range', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMinPrice('50')
    await productSearch.setMaxPrice('200')
    await productSearch.clearFiltersButton.click()

    await expect(productSearch.minPriceInput).toHaveValue('')
    await expect(productSearch.maxPriceInput).toHaveValue('')
  })

  test('clear all filters resets sort to relevance', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.selectSort('price-asc')
    await productSearch.search('a')
    await productSearch.clearFiltersButton.click()

    await expect(productSearch.sortSelect).toHaveValue('relevance')
  })
})

test.describe('Product Search — Error Handling & Edge Cases', () => {
  test('page loads without JavaScript errors', async ({ productSearch }) => {
    const errors: string[] = []
    productSearch.page.on('pageerror', (err) => errors.push(err.message))

    await productSearch.goto()
    expect(errors).toHaveLength(0)
  })

  test('direct URL navigation works', async ({ productSearch }) => {
    await productSearch.page.goto('/demos/product-card')
    await expect(productSearch.heading).toBeVisible()
    await expect(productSearch.searchInput).toBeVisible()
  })

  test('special characters in search do not crash', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('<script>alert("xss")</script>')

    await expect(productSearch.emptyState()).toBeVisible()
  })

  test('negative min price is accepted gracefully', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMinPrice('-10')

    const count = await productSearch.getResultCount()
    expect(count).toBeGreaterThan(0)
  })

  test('empty price input is treated as no filter', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.setMinPrice('400')

    const filtered = await productSearch.getResultCount()
    expect(filtered).toBeLessThan(6)

    await productSearch.setMinPrice('')
    const all = await productSearch.getResultCount()
    expect(all).toBe(6)
  })

  test('rapid filter changes do not break the UI', async ({ productSearch }) => {
    await productSearch.goto()

    await productSearch.search('audio')
    await productSearch.selectCategory('Wearables')
    await productSearch.search('')
    await productSearch.selectSort('price-desc')
    await productSearch.setMaxPrice('200')
    await productSearch.selectCategory('')

    await expect(productSearch.heading).toBeVisible()
    await expect(productSearch.filtersSection).toBeVisible()
  })

  test('all product cards have accessible article labels', async ({ productSearch }) => {
    await productSearch.goto()

    const articles = productSearch.allProductCards()
    const count = await articles.count()
    for (let i = 0; i < count; i++) {
      const label = await articles.nth(i).getAttribute('aria-label')
      expect(label).toBeTruthy()
    }
  })

  test('filter controls are keyboard accessible', async ({ productSearch }) => {
    await productSearch.goto()

    await productSearch.searchInput.focus()
    await expect(productSearch.searchInput).toBeFocused()

    await productSearch.page.keyboard.press('Tab')
    await expect(productSearch.categorySelect).toBeFocused()

    await productSearch.page.keyboard.press('Tab')
    await expect(productSearch.minPriceInput).toBeFocused()

    await productSearch.page.keyboard.press('Tab')
    await expect(productSearch.maxPriceInput).toBeFocused()

    await productSearch.page.keyboard.press('Tab')
    await expect(productSearch.sortSelect).toBeFocused()
  })

  test('search input has accessible label', async ({ productSearch }) => {
    await productSearch.goto()
    const label = await productSearch.searchInput.getAttribute('id')
    expect(label).toBe('product-search')

    const srLabel = productSearch.page.locator('label[for="product-search"]')
    await expect(srLabel).toHaveCount(1)
  })

  test('empty results section has status role', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('xyznonexistent')

    await expect(productSearch.emptyState()).toHaveAttribute('role', 'status')
  })

  test('out-of-stock product shows unavailable button', async ({ productSearch }) => {
    await productSearch.goto()
    await productSearch.search('Vintage Leather')

    const card = productSearch.productCard('Vintage Leather Messenger Bag')
    await expect(card).toBeVisible()

    const button = card.getByRole('button', { name: 'Unavailable' })
    await expect(button).toBeVisible()
    await expect(button).toBeDisabled()
  })

  test('add to cart button shows confirmation then resets', async ({ productSearch }) => {
    await productSearch.goto()

    const card = productSearch.allProductCards().first()
    const button = card.getByRole('button', { name: 'Add to Cart' })
    await button.click()

    await expect(card.getByRole('button', { name: 'Added!' })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Add to Cart' })).toBeVisible({ timeout: 3000 })
  })
})
