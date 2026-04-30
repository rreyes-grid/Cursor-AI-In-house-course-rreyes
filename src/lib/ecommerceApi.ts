const base = () =>
  import.meta.env.VITE_ECOMMERCE_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:5004'

export type EcommerceUser = {
  id: number
  name: string
  email: string
  created_at: string | null
}

export type EcommerceProduct = {
  id: number
  sku: string
  title: string
  description: string
  price_cents: number
  stock_qty: number
  image_url: string | null
  active: boolean
}

export type CartLine = {
  cart_item_id: number
  product_id: number | null
  sku: string | null
  title: string
  quantity: number
  unit_price_cents: number
  line_subtotal_cents: number
  stock_qty: number
  available: boolean
}

export type CartSummary = {
  status: string
  lines: CartLine[]
  subtotal_cents: number
  discount_cents: number
  discount_code: string | null
  discount_issue: string | null
  total_cents: number
}

export type OrderSummary = {
  id: number
  confirmation_number: string
  payment_status: string
  payment_reference: string | null
  subtotal_cents: number
  discount_cents: number
  total_cents: number
  discount_code_label: string | null
  created_at: string | null
}

export type OrderDetail = OrderSummary & {
  items: Array<{
    title: string
    product_id: number
    unit_price_cents: number
    quantity: number
    line_subtotal_cents: number
  }>
}

export type EmailNotificationRow = {
  id: number
  notification_type: string
  subject: string
  body_text: string
  order_id: number | null
  smtp_attempted: boolean
  created_at: string | null
}

export type ApiErrorBody = {
  status?: string
  message?: string
  code?: string
  errors?: Record<string, string[]>
}

export class EcommerceApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'EcommerceApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

export async function ecommerceFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = options
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${base()}${path}`, { ...init, headers })
  if (res.status === 204) {
    return {} as T
  }
  const data = (await parseJson(res)) as ApiErrorBody & T

  if (!res.ok) {
    const msg =
      typeof data.message === 'string'
        ? data.message
        : `Request failed (${res.status})`
    throw new EcommerceApiError(msg, res.status, data.code, data.errors)
  }
  return data as T
}

export type CheckoutSuccess = { status: string; message: string; order: OrderDetail }

export async function ecommerceCheckout(token: string, paymentToken: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${base()}/api/orders/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ payment_token: paymentToken }),
  })
  const data = (await parseJson(res)) as CheckoutSuccess &
    ApiErrorBody & { cart?: CartSummary }

  if (res.ok && res.status === 201 && data.order) {
    return { outcome: 'success' as const, order: data.order }
  }

  if (res.status === 402) {
    return {
      outcome: 'declined' as const,
      message: typeof data.message === 'string' ? data.message : 'Payment declined',
      cart: data.cart,
    }
  }

  const msg =
    typeof data.message === 'string'
      ? data.message
      : `Request failed (${res.status})`
  throw new EcommerceApiError(msg, res.status, data.code, data.errors)
}

export const ecommerceAuth = {
  login: (email: string, password: string) =>
    ecommerceFetch<{ access_token: string; user: EcommerceUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    ecommerceFetch<{ access_token: string; user: EcommerceUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  me: (token: string) =>
    ecommerceFetch<{ user: EcommerceUser }>('/api/auth/me', { token }),
}

export const ecommerceUsers = {
  updateMe: (token: string, name: string) =>
    ecommerceFetch<{ user: EcommerceUser }>('/api/users/me', {
      method: 'PUT',
      token,
      body: JSON.stringify({ name }),
    }),
}

export const ecommerceProducts = {
  list: (q?: string) => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    return ecommerceFetch<{ products: EcommerceProduct[] }>(`/api/products${qs}`)
  },
  get: (id: number) =>
    ecommerceFetch<{ product: EcommerceProduct }>(`/api/products/${id}`),
}

export const ecommerceCart = {
  get: (token: string) => ecommerceFetch<CartSummary>('/api/cart', { token }),

  addItem: (token: string, productId: number, quantity: number) =>
    ecommerceFetch<CartSummary>('/api/cart/items', {
      method: 'POST',
      token,
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  patchItem: (token: string, itemId: number, quantity: number) =>
    ecommerceFetch<CartSummary>(`/api/cart/items/${itemId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (token: string, itemId: number) =>
    ecommerceFetch<CartSummary>(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
      token,
    }),

  applyDiscount: (token: string, code: string) =>
    ecommerceFetch<CartSummary>('/api/cart/discount', {
      method: 'POST',
      token,
      body: JSON.stringify({ code }),
    }),

  removeDiscount: (token: string) =>
    ecommerceFetch<CartSummary>('/api/cart/discount', { method: 'DELETE', token }),
}

export const ecommerceOrders = {
  list: (token: string) =>
    ecommerceFetch<{ orders: OrderSummary[] }>('/api/orders', { token }),

  get: (token: string, orderId: number) =>
    ecommerceFetch<{ order: OrderDetail }>(`/api/orders/${orderId}`, { token }),
}

export const ecommerceNotifications = {
  listEmails: (token: string) =>
    ecommerceFetch<{ notifications: EmailNotificationRow[] }>('/api/notifications/email', {
      token,
    }),
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}
