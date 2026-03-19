import { useState } from 'react'

interface AvatarProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-lg',
  xl: 'h-28 w-28 text-2xl sm:h-32 sm:w-32',
}

export function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const initials = alt
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`${sizeClasses[size]} relative shrink-0 overflow-hidden rounded-full bg-indigo-100 ring-2 ring-white`}
    >
      {failed ? (
        <span
          role="img"
          aria-label={alt}
          className="flex h-full w-full items-center justify-center font-semibold text-indigo-600"
        >
          {initials}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  )
}
