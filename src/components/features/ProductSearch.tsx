import { useMemo, useState } from 'react'
import type { Product, SortOption, ProductFilters } from '../../types/product'
import { ProductCard } from './ProductCard'

const ITEMS_PER_PAGE = 6

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

interface ProductSearchProps {
  products: Product[]
}

function applyFilters(products: Product[], filters: ProductFilters): Product[] {
  let result = [...products]

  if (filters.query.trim()) {
    const q = filters.query.toLowerCase()
    result = result.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    )
  }

  if (filters.category) {
    result = result.filter((p) => p.category === filters.category)
  }

  const min = parseFloat(filters.minPrice)
  if (!isNaN(min)) {
    result = result.filter((p) => p.price / 100 >= min)
  }

  const max = parseFloat(filters.maxPrice)
  if (!isNaN(max)) {
    result = result.filter((p) => p.price / 100 <= max)
  }

  switch (filters.sort) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      result.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
    case 'name-asc':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'name-desc':
      result.sort((a, b) => b.title.localeCompare(a.title))
      break
  }

  return result
}

export function ProductSearch({ products }: ProductSearchProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'relevance',
    page: 1,
  })

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products],
  )

  const filtered = useMemo(() => applyFilters(products, filters), [products, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(filters.page, totalPages)
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  )

  const update = (patch: Partial<ProductFilters>) =>
    setFilters((prev) => ({ ...prev, page: 1, ...patch }))

  const clearFilters = () =>
    setFilters({ query: '', category: '', minPrice: '', maxPrice: '', sort: 'relevance', page: 1 })

  const hasActiveFilters = filters.query || filters.category || filters.minPrice || filters.maxPrice

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <section aria-label="Product filters" className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        {/* Search input */}
        <div className="relative">
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <SearchIcon />
          </div>
          <input
            id="product-search"
            type="search"
            placeholder="Search products…"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Category */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">Category</label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => update({ category: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Min price */}
          <div>
            <label htmlFor="min-price" className="block text-sm font-medium text-gray-700">Min Price ($)</label>
            <input
              id="min-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => update({ minPrice: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>

          {/* Max price */}
          <div>
            <label htmlFor="max-price" className="block text-sm font-medium text-gray-700">Max Price ($)</label>
            <input
              id="max-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Any"
              value={filters.maxPrice}
              onChange={(e) => update({ maxPrice: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700">Sort By</label>
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortOption })}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
            </select>
          </div>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'result' : 'results'} found
            </p>
            <button
              onClick={clearFilters}
              className="cursor-pointer rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* Results */}
      <section aria-label="Product results">
        {paginated.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Product list">
            {paginated.map((product) => (
              <div key={product.id} role="listitem">
                <ProductCard
                  product={product}
                  onAddToCart={(id) => console.log('Added to cart:', id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-16 text-center" role="status">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h3 className="mt-4 text-base font-semibold text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-medium">{(safePage - 1) * ITEMS_PER_PAGE + 1}</span>
            {' '}&ndash;{' '}
            <span className="font-medium">{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}</span>
            {' '}of{' '}
            <span className="font-medium">{filtered.length}</span> products
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={safePage <= 1}
              aria-label="Previous page"
              className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <ChevronLeftIcon />
              <span className="ml-1 hidden sm:inline">Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setFilters((f) => ({ ...f, page: n }))}
                aria-label={`Page ${n}`}
                aria-current={n === safePage ? 'page' : undefined}
                className={`inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  n === safePage
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
              className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="mr-1 hidden sm:inline">Next</span>
              <ChevronRightIcon />
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
