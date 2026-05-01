import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  EcommerceApiError,
  ecommerceAuth,
  ecommerceCart,
  ecommerceCheckout,
  ecommerceFetch,
  ecommerceNotifications,
  ecommerceOrders,
  ecommerceProducts,
  ecommerceUsers,
  formatMoney,
} from './ecommerceApi'

describe('formatMoney', () => {
  it('formats USD from cents', () => {
    expect(formatMoney(1999)).toMatch(/19\.99/)
    expect(formatMoney(0)).toMatch(/0\.00/)
  })
})

describe('ecommerceFetch', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ products: [] }), { status: 200 }),
    )
    const data = await ecommerceFetch<{ products: unknown[] }>('/api/products')
    expect(data.products).toEqual([])
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products'),
      expect.any(Object),
    )
  })

  it('throws EcommerceApiError on error response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Nope', code: 'X' }), { status: 400 }),
    )
    await expect(ecommerceFetch('/api/x')).rejects.toMatchObject({
      name: 'EcommerceApiError',
      message: 'Nope',
      status: 400,
      code: 'X',
    })
  })

  it('sends bearer token when provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ user: { id: 1 } }), { status: 200 }),
    )
    await ecommerceFetch('/api/auth/me', { token: 'abc' })
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const h = init.headers as Headers
    expect(h.get('Authorization')).toBe('Bearer abc')
  })

  it('returns empty object for 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }))
    const data = await ecommerceFetch<Record<string, unknown>>('/api/x')
    expect(data).toEqual({})
  })
})

describe('ecommerceAuth', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ access_token: 't', user: {} }), { status: 200 })),
      ),
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('login posts credentials', async () => {
    await ecommerceAuth.login('a@b.c', 'secret')
    expect(fetch).toHaveBeenCalled()
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toContain('a@b.c')
  })
})

describe('ecommerceProducts', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ products: [] }), { status: 200 }))),
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('list adds search query', async () => {
    await ecommerceProducts.list('mug')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('q=mug')
  })
})

describe('ecommerceCheckout', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns success outcome', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          order: {
            id: 1,
            confirmation_number: 'X',
            payment_status: 'paid',
            subtotal_cents: 100,
            discount_cents: 0,
            total_cents: 100,
          },
        }),
        { status: 201 },
      ),
    )
    const r = await ecommerceCheckout('tok', 'tok_charge_success')
    expect(r.outcome).toBe('success')
    if (r.outcome === 'success') expect(r.order.id).toBe(1)
  })

  it('returns declined outcome on 402', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Card declined', cart: {} }), { status: 402 }),
    )
    const r = await ecommerceCheckout('tok', 'tok_charge_declined')
    expect(r.outcome).toBe('declined')
  })

  it('throws EcommerceApiError on other failures', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ message: 'bad' }), { status: 500 }))
    await expect(ecommerceCheckout('tok', 'x')).rejects.toBeInstanceOf(EcommerceApiError)
  })
})

describe('ecommerceCart', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ lines: [], total_cents: 0 }), { status: 200 }))),
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('get loads cart', async () => {
    await ecommerceCart.get('t')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/api/cart')
  })

  it('addItem POSTs payload', async () => {
    await ecommerceCart.addItem('t', 3, 2)
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/api/cart/items')
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
  })

  it('patchItem uses PATCH', async () => {
    await ecommerceCart.patchItem('t', 9, 3)
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: 'PATCH' })
  })

  it('removeItem uses DELETE', async () => {
    await ecommerceCart.removeItem('t', 9)
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: 'DELETE' })
  })

  it('applyDiscount posts code', async () => {
    await ecommerceCart.applyDiscount('t', 'SAVE10')
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toContain('SAVE10')
  })

  it('removeDiscount calls DELETE', async () => {
    await ecommerceCart.removeDiscount('t')
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: 'DELETE' })
  })
})

describe('ecommerceUsers & orders & notifications', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ user: { id: 1 } }), { status: 200 }))),
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('updateMe puts name', async () => {
    await ecommerceUsers.updateMe('tok', 'Ada')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/api/users/me')
    expect((vi.mocked(fetch).mock.calls[0][1] as RequestInit).method).toBe('PUT')
  })

  it('orders list and get', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ orders: [] }), { status: 200 }),
    )
    await ecommerceOrders.list('tok')
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ order: { items: [] } }), { status: 200 }),
    )
    await ecommerceOrders.get('tok', 42)
    expect(vi.mocked(fetch).mock.calls[1][0]).toContain('/api/orders/42')
  })

  it('notifications listEmails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ notifications: [] }), { status: 200 }))
    await ecommerceNotifications.listEmails('tok')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/api/notifications/email')
  })
})
