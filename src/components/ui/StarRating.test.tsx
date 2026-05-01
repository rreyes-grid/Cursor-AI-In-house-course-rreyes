import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('exposes accessible label', () => {
    render(<StarRating rating={4.5} />)
    expect(screen.getByRole('img', { name: /4\.5 out of 5 stars/ })).toBeInTheDocument()
  })
})
