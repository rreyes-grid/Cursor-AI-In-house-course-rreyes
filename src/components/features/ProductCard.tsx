import { useState } from 'react'
import type { Product } from '../../types/product'
import { StarRating } from '../ui/StarRating'
import { Button } from '../ui/Button'

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function discountPercent(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100)
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    setAdded(true)
    onAddToCart?.(product.id)
    setTimeout(() => setAdded(false), 1500)
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price

  return (
    <article
      aria-label={product.title}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}
        <img
          src={product.imageUrl}
          alt={product.title}
          onLoad={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {hasDiscount && (
          <span className="absolute top-3 left-3 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            -{discountPercent(product.originalPrice!, product.price)}%
          </span>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 sm:text-base">
          {product.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs text-gray-500 sm:text-sm">
          {product.description}
        </p>

        {/* Rating */}
        <div className="mt-3 flex items-center gap-2">
          <StarRating rating={product.rating} />
          <span className="text-xs text-gray-500">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <div className="mt-4 pt-1">
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock || added}
            className="w-full"
          >
            {added ? 'Added!' : product.inStock ? 'Add to Cart' : 'Unavailable'}
          </Button>
        </div>
      </div>
    </article>
  )
}
