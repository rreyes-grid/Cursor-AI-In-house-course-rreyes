export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  imageUrl: string
  rating: number
  reviewCount: number
  inStock: boolean
  category: string
}

export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'name-asc' | 'name-desc'

export interface ProductFilters {
  query: string
  category: string
  minPrice: string
  maxPrice: string
  sort: SortOption
  page: number
}
