/**
 * In-memory mock matching Flask ecommerce JSON (see src/lib/ecommerceApi.ts).
 * Tests run against Vite preview; the client calls http://127.0.0.1:5004 by default.
 */
import type { Page, Route } from '@playwright/test'

export const MOCK_DISPLAY_NAME = 'Playwright Mug'

type ProductRow = {
  id: number
  sku: string
  title: string
  description: string
  price_cents: number
  stock_qty: number
  image_url: string | null
  active: boolean
}

const CATALOG_TEMPLATE: Omit<ProductRow, never>[] = [
  {
    id: 11,
    sku: 'PW-MUG',
    title: MOCK_DISPLAY_NAME,
    description: 'E2E fixture product',
    price_cents: 2999,
    stock_qty: 25,
    image_url: null,
    active: true,
  },
  {
    id: 22,
    sku: 'PW-TOTE',
    title: 'Playwright Tote',
    description: 'Second SKU',
    price_cents: 1999,
    stock_qty: 8,
    image_url: null,
    active: true,
  },
]

const MOCK_USER = Object.freeze({
  id: 1,
  name: 'Playwright Shopper',
  email: 'shopper+e2e@example.test',
  created_at: '2026-01-01T00:00:00',
})

const TOKEN = 'playwright-session-token'

const API_ROUTE = /^https?:\/\/(127\.0\.0\.1|localhost):5004\/api\//

type CartRow = {
  cart_item_id: number
  product_id: number
  quantity: number
}

async function fulfillJson(route: Route, payload: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

async function fulfillError(route: Route, status: number, message: string, code: string): Promise<void> {
  await fulfillJson(route, { status: 'error', message, code }, status)
}

export function installEcommerceApiMock(page: Page): void {
  const catalog: ProductRow[] = structuredClone(CATALOG_TEMPLATE)
  const productById = new Map(catalog.map((p) => [p.id, p]))
  let nextLineId = 1
  const rows: CartRow[] = []
  let appliedDiscount: string | null = null
  const notifications: unknown[] = []
  const orders: unknown[] = []

  function summarizeCart() {
    const linesOut: unknown[] = []
    let eligibleSubtotal = 0
    for (const row of rows) {
      const p = productById.get(row.product_id)
      if (!p) continue
      const unit = p.price_cents
      const lineAmt = row.quantity * unit
      if (p.active) eligibleSubtotal += lineAmt
      linesOut.push({
        cart_item_id: row.cart_item_id,
        product_id: p.id,
        sku: p.sku,
        title: p.title,
        quantity: row.quantity,
        unit_price_cents: unit,
        line_subtotal_cents: p.active ? lineAmt : 0,
        stock_qty: p.stock_qty,
        available: p.active,
      })
    }

    let discountIssue: string | null = null
    let discountShown: string | null = null
    let discountCents = 0

    if (appliedDiscount === 'SAVE10') {
      const minSubtotal = 2000
      const pct = 10
      if (eligibleSubtotal >= minSubtotal) {
        discountCents = Math.floor((eligibleSubtotal * pct) / 100)
        discountShown = 'SAVE10'
      } else {
        discountIssue = 'min_subtotal_not_met'
        discountShown = null
      }
    } else if (appliedDiscount === 'WELCOME5') {
      const minSubtotal = 1500
      const flatOff = 500
      if (eligibleSubtotal >= minSubtotal) {
        discountCents = Math.min(eligibleSubtotal, flatOff)
        discountShown = 'WELCOME5'
      } else {
        discountIssue = 'min_subtotal_not_met'
        discountShown = null
      }
    }

    const total_cents = Math.max(0, eligibleSubtotal - discountCents)

    return {
      status: 'success',
      lines: linesOut,
      subtotal_cents: eligibleSubtotal,
      discount_cents: discountCents,
      discount_code: discountShown,
      discount_issue: discountIssue,
      total_cents,
    }
  }

  page.route(API_ROUTE, async (route) => {
    const req = route.request()
    const method = req.method()
    const url = new URL(req.url())
    const path = url.pathname

    let bodyUnknown: Record<string, unknown> = {}
    try {
      if (req.postData()) bodyUnknown = req.postDataJSON() as Record<string, unknown>
    } catch {
      bodyUnknown = {}
    }

    if (method === 'POST' && path === '/api/auth/register') {
      rows.length = 0
      nextLineId = 1
      appliedDiscount = null
      await fulfillJson(route, {
        status: 'success',
        access_token: TOKEN,
        token_type: 'Bearer',
        user: MOCK_USER,
      })
      return
    }

    if (method === 'POST' && path === '/api/auth/login') {
      await fulfillJson(route, {
        status: 'success',
        access_token: TOKEN,
        token_type: 'Bearer',
        user: MOCK_USER,
      })
      return
    }

    if (method === 'POST' && path === '/api/auth/logout') {
      await route.fulfill({ status: 204 })
      return
    }

    const auth = req.headers()['authorization']
    const authed = Boolean(auth?.startsWith('Bearer '))

    if (method === 'GET' && path === '/api/auth/me') {
      if (!authed) await fulfillError(route, 401, 'Missing credentials', 'UNAUTHORIZED')
      else await fulfillJson(route, { status: 'success', user: MOCK_USER })
      return
    }

    if (method === 'GET' && path === '/api/products') {
      const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
      const filtered = q
        ? catalog.filter((p) => {
            const blob = `${p.title} ${p.sku}`.toLowerCase()
            return blob.includes(q)
          })
        : [...catalog]
      await fulfillJson(route, { status: 'success', products: filtered.filter((p) => p.active) })
      return
    }

    if (!authed) {
      await fulfillError(route, 401, 'Unauthorized', 'UNAUTHORIZED')
      return
    }

    if (method === 'GET' && path === '/api/cart') {
      await fulfillJson(route, summarizeCart())
      return
    }

    if (method === 'POST' && path === '/api/cart/items') {
      const product_id = Number(bodyUnknown.product_id)
      const quantity = Number(bodyUnknown.quantity)
      const p = productById.get(product_id)
      if (!p || !p.active) {
        await fulfillError(route, 404, 'Product not found', 'NOT_FOUND')
        return
      }
      if (!Number.isFinite(quantity) || quantity < 1) {
        await fulfillError(route, 400, 'Validation failed', 'VALIDATION_ERROR')
        return
      }
      const line = rows.find((r) => r.product_id === product_id)
      const nextQty = (line?.quantity ?? 0) + quantity
      if (nextQty > p.stock_qty) {
        await fulfillError(route, 422, 'Not enough stock available', 'UNPROCESSABLE')
        return
      }
      if (line) {
        line.quantity = nextQty
      } else {
        rows.push({ cart_item_id: nextLineId++, product_id, quantity })
      }
      await fulfillJson(route, summarizeCart(), 201)
      return
    }

    const cartItemPath = /^\/api\/cart\/items\/(\d+)$/
    const cartItemMatch = cartItemPath.exec(path)

    if (cartItemMatch && method === 'PATCH') {
      const itemId = Number(cartItemMatch[1])
      const quantity = Number(bodyUnknown.quantity)
      const line = rows.find((r) => r.cart_item_id === itemId)
      if (!line) {
        await fulfillError(route, 404, 'Cart line not found', 'NOT_FOUND')
        return
      }
      if (!Number.isFinite(quantity) || quantity < 1) {
        await fulfillError(route, 400, 'Validation failed', 'VALIDATION_ERROR')
        return
      }
      const p = productById.get(line.product_id)
      if (!p || !p.active) {
        await fulfillError(route, 422, 'Product unavailable', 'UNPROCESSABLE')
        return
      }
      if (quantity > p.stock_qty) {
        await fulfillError(route, 422, 'Not enough stock available', 'UNPROCESSABLE')
        return
      }
      line.quantity = quantity
      await fulfillJson(route, summarizeCart())
      return
    }

    if (cartItemMatch && method === 'DELETE') {
      const itemId = Number(cartItemMatch[1])
      const idx = rows.findIndex((r) => r.cart_item_id === itemId)
      if (idx === -1) {
        await fulfillError(route, 404, 'Cart line not found', 'NOT_FOUND')
        return
      }
      rows.splice(idx, 1)
      await fulfillJson(route, summarizeCart())
      return
    }

    if (method === 'POST' && path === '/api/cart/discount') {
      const raw = String(bodyUnknown.code ?? '')
        .trim()
        .toUpperCase()
      if (raw !== 'SAVE10' && raw !== 'WELCOME5') {
        await fulfillError(route, 404, 'Invalid discount code', 'NOT_FOUND')
        return
      }
      appliedDiscount = raw
      await fulfillJson(route, summarizeCart())
      return
    }

    if (method === 'DELETE' && path === '/api/cart/discount') {
      appliedDiscount = null
      await fulfillJson(route, summarizeCart())
      return
    }

    if (method === 'POST' && path === '/api/orders/checkout') {
      const payment_token = String(bodyUnknown.payment_token ?? '').trim()
      const snap = summarizeCart()
      if (snap.subtotal_cents <= 0) {
        await fulfillError(route, 422, 'Cart is empty', 'UNPROCESSABLE')
        return
      }

      if (payment_token.length < 3 || payment_token.length > 128) {
        await fulfillError(
          route,
          400,
          'Payment token must be between 3 and 128 characters.',
          'VALIDATION_ERROR',
        )
        return
      }

      if (payment_token === 'tok_charge_declined') {
        await fulfillJson(
          route,
          {
            status: 'error',
            message: 'Payment was declined; no charge was made',
            code: 'PAYMENT_DECLINED',
            cart: summarizeCart(),
          },
          402,
        )
        return
      }

      const isSuccess =
        payment_token === 'tok_charge_success' || payment_token.startsWith('tok_charge_success_')
      if (!isSuccess) {
        await fulfillJson(
          route,
          {
            status: 'error',
            message: 'Payment was declined; no charge was made',
            code: 'PAYMENT_DECLINED',
            cart: summarizeCart(),
          },
          402,
        )
        return
      }

      const confirmation_number = `pw-${orders.length + 1}-${Date.now()}`
      const itemShapes = rows.map((row) => {
        const p = productById.get(row.product_id)!
        return {
          title: p.title,
          product_id: p.id,
          unit_price_cents: p.price_cents,
          quantity: row.quantity,
          line_subtotal_cents: p.price_cents * row.quantity,
        }
      })

      const order = {
        id: orders.length + 1,
        confirmation_number,
        payment_status: 'succeeded',
        payment_reference: 'pi_mock_pw',
        subtotal_cents: snap.subtotal_cents,
        discount_cents: snap.discount_cents,
        total_cents: snap.total_cents,
        discount_code_label: snap.discount_code,
        created_at: '2026-01-01T12:00:00',
        items: itemShapes,
      }
      orders.unshift(order)

      notifications.unshift({
        id: notifications.length + 1,
        notification_type: 'order_confirmation',
        subject: `Order confirmed — ${confirmation_number}`,
        body_text: `Thanks for your order. ${confirmation_number}`,
        order_id: order.id,
        smtp_attempted: false,
        created_at: '2026-01-01T12:01:00',
      })

      for (const row of rows) {
        const p = productById.get(row.product_id)
        if (p) p.stock_qty -= row.quantity
      }
      rows.length = 0
      appliedDiscount = null

      await fulfillJson(
        route,
        {
          status: 'success',
          message: 'Order placed successfully',
          order,
        },
        201,
      )
      return
    }

    if (method === 'GET' && path === '/api/orders') {
      await fulfillJson(route, { status: 'success', orders })
      return
    }

    if (method === 'GET' && path === '/api/notifications/email') {
      await fulfillJson(route, { status: 'success', notifications })
      return
    }

    if (method === 'PUT' && path === '/api/users/me') {
      await fulfillJson(route, { status: 'success', user: MOCK_USER })
      return
    }

    await fulfillError(route, 501, `Mock missing for ${method} ${path}`, 'NOT_IMPLEMENTED')
  })
}
