import { useId } from 'react'

interface StarRatingProps {
  rating: number
  max?: number
  size?: 'sm' | 'md'
}

const sizeClasses: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
}

function StarIcon({
  fill,
  className,
}: {
  fill: 'full' | 'half' | 'empty'
  className: string
}) {
  const gradientId = `half-${useId().replace(/:/g, '')}`

  if (fill === 'half') {
    return (
      <svg
        className={className}
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="50%" stopColor="currentColor" className="text-amber-400" />
            <stop offset="50%" stopColor="currentColor" className="text-gray-200" />
          </linearGradient>
        </defs>
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill={`url(#${gradientId})`}
        />
      </svg>
    )
  }

  return (
    <svg
      className={`${className} ${fill === 'full' ? 'text-amber-400' : 'text-gray-200'}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export function StarRating({ rating, max = 5, size = 'sm' }: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => {
    const diff = rating - i
    if (diff >= 1) return 'full' as const
    if (diff >= 0.5) return 'half' as const
    return 'empty' as const
  })

  return (
    <div
      role="img"
      aria-label={`${rating} out of ${max} stars`}
      className="flex gap-0.5"
    >
      {stars.map((fill, i) => (
        <StarIcon key={i} fill={fill} className={sizeClasses[size]} />
      ))}
    </div>
  )
}
