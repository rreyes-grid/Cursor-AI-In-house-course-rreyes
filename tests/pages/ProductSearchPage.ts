import type { Locator, Page } from '@playwright/test'

import { BasePage } from './BasePage'

export class ProductSearchPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly categorySelect: Locator
  readonly minPriceInput: Locator
  readonly maxPriceInput: Locator
  readonly sortSelect: Locator
  readonly filtersSection: Locator
  readonly resultsSection: Locator
  readonly productList: Locator
  readonly pagination: Locator
  readonly clearFiltersButton: Locator
  readonly resultsSummary: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'Product Search' })
    this.searchInput = page.getByLabel('Search products')
    this.categorySelect = page.getByLabel('Category')
    this.minPriceInput = page.getByLabel('Min Price ($)')
    this.maxPriceInput = page.getByLabel('Max Price ($)')
    this.sortSelect = page.getByLabel('Sort By')
    this.filtersSection = page.getByLabel('Product filters')
    this.resultsSection = page.getByLabel('Product results')
    this.productList = page.getByRole('list', { name: 'Product list' })
    this.pagination = page.getByLabel('Pagination')
    this.clearFiltersButton = this.filtersSection.getByRole('button', { name: 'Clear all filters' })
    this.resultsSummary = this.filtersSection.locator('p').filter({ hasText: /results? found/ })
  }

  async goto() {
    await this.page.goto('/demos/product-card')
    await this.heading.waitFor()
  }

  async search(query: string) {
    await this.searchInput.fill(query)
  }

  async selectCategory(category: string) {
    await this.categorySelect.selectOption(category)
  }

  async setMinPrice(value: string) {
    await this.minPriceInput.fill(value)
  }

  async setMaxPrice(value: string) {
    await this.maxPriceInput.fill(value)
  }

  async selectSort(value: string) {
    await this.sortSelect.selectOption(value)
  }

  productCard(title: string) {
    return this.page.getByRole('article', { name: title })
  }

  allProductCards() {
    return this.resultsSection.getByRole('article')
  }

  async getVisibleProductTitles(): Promise<string[]> {
    const articles = this.allProductCards()
    const count = await articles.count()
    const titles: string[] = []
    for (let i = 0; i < count; i++) {
      const label = await articles.nth(i).getAttribute('aria-label')
      if (label) titles.push(label)
    }
    return titles
  }

  async getVisibleProductPrices(): Promise<number[]> {
    const articles = this.allProductCards()
    const count = await articles.count()
    const prices: number[] = []
    for (let i = 0; i < count; i++) {
      const priceText = await articles.nth(i).locator('.text-lg.font-bold').textContent()
      if (priceText) {
        prices.push(parseFloat(priceText.replace('$', '')))
      }
    }
    return prices
  }

  pageButton(n: number) {
    return this.pagination.getByLabel(`Page ${n}`)
  }

  previousButton() {
    return this.pagination.getByLabel('Previous page')
  }

  nextButton() {
    return this.pagination.getByLabel('Next page')
  }

  emptyState() {
    return this.resultsSection.getByRole('status')
  }

  async getResultCount(): Promise<number> {
    return await this.allProductCards().count()
  }
}
