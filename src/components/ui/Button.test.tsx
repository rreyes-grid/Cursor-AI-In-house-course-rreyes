import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders children', () => {
    render(<Button type="button">Save</Button>)
    expect(screen.getByRole('button', { name: /save/i })).toBeVisible()
  })

  it('invokes onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button type="button" onClick={onClick}>
        Go
      </Button>,
    )
    await user.click(screen.getByRole('button', { name: /go/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
