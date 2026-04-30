import { useCallback, useEffect, useState } from 'react'
import { ThemeProvider } from '../context/ThemeContext'
import { Button } from '../components/ui/Button'
import { TextInput } from '../components/ui/TextInput'
import {
  EcommerceApiError,
  ecommerceAuth,
  ecommerceCart,
  ecommerceCheckout,
  ecommerceNotifications,
  ecommerceOrders,
  ecommerceProducts,
  formatMoney,
  type CartSummary,
  type EcommerceProduct,
  type EcommerceUser,
  type EmailNotificationRow,
  type OrderDetail,
  type OrderSummary,
} from '../lib/ecommerceApi'

const STORAGE_KEY = 'ecommerce_token'

function Alert({
  children,
  kind,
}: {
  children: React.ReactNode
  kind: 'error' | 'success' | 'info'
}) {
  const cls =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
      : kind === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100'
        : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100'
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`} role="alert">
      {children}
    </div>
  )
}

type Tab = 'shop' | 'cart' | 'orders' | 'emails'

export function EcommerceDemo() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [user, setUser] = useState<EcommerceUser | null>(null)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('ShopDemo123!')
  const [name, setName] = useState('Demo Shopper')

  const [tab, setTab] = useState<Tab>('shop')
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<EcommerceProduct[]>([])
  const [cart, setCart] = useState<CartSummary | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [emails, setEmails] = useState<EmailNotificationRow[]>([])
  const [lastOrder, setLastOrder] = useState<OrderDetail | null>(null)

  const [discountInput, setDiscountInput] = useState('')
  const [paymentChoice, setPaymentChoice] = useState<'tok_charge_success' | 'tok_charge_declined'>(
    'tok_charge_success'
  )
  const [paymentTokenOverride, setPaymentTokenOverride] = useState('')

  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'error' | 'success' | 'info'; msg: string } | null>(
    null
  )

  const persistToken = useCallback((t: string | null) => {
    setToken(t)
    if (t) localStorage.setItem(STORAGE_KEY, t)
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  const loadCatalog = useCallback(async () => {
    const data = await ecommerceProducts.list(query || undefined)
    setProducts(data.products)
  }, [query])

  const loadCart = useCallback(async () => {
    if (!token) return
    const summary = await ecommerceCart.get(token)
    setCart(summary)
  }, [token])

  const loadOrders = useCallback(async () => {
    if (!token) return
    const data = await ecommerceOrders.list(token)
    setOrders(data.orders)
  }, [token])

  const loadEmails = useCallback(async () => {
    if (!token) return
    const data = await ecommerceNotifications.listEmails(token)
    setEmails(data.notifications)
  }, [token])

  useEffect(() => {
    void loadCatalog().catch(() => {})
  }, [loadCatalog])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setCart(null)
      return
    }
    ecommerceAuth
      .me(token)
      .then((data) => {
        setUser(data.user)
      })
      .catch(() => persistToken(null))
  }, [token, persistToken])

  useEffect(() => {
    if (!token || !user) return
    void loadCart().catch(() => {})
  }, [token, user, loadCart])

  const showError = (e: unknown) => {
    if (e instanceof EcommerceApiError) setNotice({ kind: 'error', msg: e.message })
    else setNotice({ kind: 'error', msg: 'Something went wrong.' })
  }

  async function handleLogin() {
    setBusy(true)
    setNotice(null)
    try {
      const data = await ecommerceAuth.login(email.trim(), password)
      persistToken(data.access_token)
      setUser(data.user)
      setNotice({ kind: 'success', msg: 'Signed in.' })
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister() {
    setBusy(true)
    setNotice(null)
    try {
      const data = await ecommerceAuth.register(name.trim(), email.trim(), password)
      persistToken(data.access_token)
      setUser(data.user)
      setNotice({ kind: 'success', msg: 'Welcome — account created.' })
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    persistToken(null)
    setUser(null)
    setCart(null)
    setOrders([])
    setEmails([])
    setLastOrder(null)
  }

  async function handleAdd(product: EcommerceProduct) {
    if (!token) return
    setBusy(true)
    try {
      const next = await ecommerceCart.addItem(token, product.id, 1)
      setCart(next)
      setNotice({ kind: 'info', msg: `Added "${product.title}" to cart.` })
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  async function handleQty(lineId: number, qty: number) {
    if (!token || qty < 1) return
    setBusy(true)
    try {
      const next = await ecommerceCart.patchItem(token, lineId, qty)
      setCart(next)
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(lineId: number) {
    if (!token) return
    setBusy(true)
    try {
      const next = await ecommerceCart.removeItem(token, lineId)
      setCart(next)
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  async function applyDiscount() {
    if (!token || !discountInput.trim()) return
    setBusy(true)
    try {
      const next = await ecommerceCart.applyDiscount(token, discountInput.trim())
      setCart(next)
      setDiscountInput('')
      setNotice({ kind: 'success', msg: `Discount "${next.discount_code}" applied.` })
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  async function clearDiscount() {
    if (!token) return
    setBusy(true)
    try {
      const next = await ecommerceCart.removeDiscount(token)
      setCart(next)
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  async function handleCheckout() {
    if (!token) return
    setBusy(true)
    setNotice(null)
    try {
      const paymentToken = paymentTokenOverride.trim() || paymentChoice
      const result = await ecommerceCheckout(token, paymentToken)
      if (result.outcome === 'success') {
        setLastOrder(result.order)
        setCart(null)
        await loadCart()
        await loadOrders()
        await loadEmails()
        setTab('orders')
        setNotice({
          kind: 'success',
          msg: `Order ${result.order.confirmation_number} confirmed — check email log.`,
        })
      } else {
        if (result.cart) setCart(result.cart)
        setNotice({ kind: 'error', msg: result.message })
      }
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <ThemeProvider defaultTheme="light">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-3 border-b border-gray-200 pb-6 dark:border-gray-700 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
              E-commerce • Flask API on port 5004
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Demo Storefront</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-400">
              Catalog, cart, discount codes, mock payment tokens, order confirmation, and persisted email
              notifications (see Emails tab).
            </p>
          </div>
          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user.name} · {user.email}
              </span>
              <Button variant="secondary" type="button" onClick={() => void handleSignOut()}>
                Sign out
              </Button>
            </div>
          ) : null}
        </header>

        {!user ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={authTab === 'login' ? 'primary' : 'secondary'}
                onClick={() => setAuthTab('login')}
              >
                Sign in
              </Button>
              <Button
                type="button"
                variant={authTab === 'register' ? 'primary' : 'secondary'}
                onClick={() => setAuthTab('register')}
              >
                Register
              </Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {authTab === 'register' ? (
                <TextInput
                  id="eco-auth-name"
                  label="Name"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              ) : null}
              <TextInput
                id="eco-auth-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <TextInput
                id="eco-auth-password"
                label="Password (min 8)"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={authTab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            <div className="mt-4">
              <Button
                type="button"
                disabled={busy}
                onClick={() => void (authTab === 'login' ? handleLogin() : handleRegister())}
              >
                {busy ? 'Please wait…' : authTab === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              After registering, browse products, apply codes like SAVE10 or WELCOME5, then pay with mock tokens.
            </p>
          </section>
        ) : null}

        {notice ? (
          <Alert kind={notice.kind}>{notice.msg}</Alert>
        ) : null}

        {user ? (
          <>
            <nav className="flex flex-wrap gap-2">
              {(
                [
                  ['shop', 'Shop'],
                  ['cart', 'Cart & checkout'],
                  ['orders', 'Orders'],
                  ['emails', 'Email log'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    tab === id
                      ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === 'shop' ? (
              <section className="space-y-4">
                <div className="max-w-md">
                  <TextInput
                    id="eco-search"
                    label="Search catalog"
                    value={query}
                    onChange={setQuery}
                    placeholder="Search by title or SKU"
                  />
                  <Button className="mt-2" type="button" variant="secondary" onClick={() => void loadCatalog()}>
                    Search
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => (
                    <article
                      key={p.id}
                      className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-40 w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="flex flex-1 flex-col p-4">
                        <h2 className="font-semibold text-gray-900 dark:text-white">{p.title}</h2>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                          {p.description}
                        </p>
                        <div className="mt-3 flex flex-1 flex-wrap items-end justify-between gap-2">
                          <div>
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                              {formatMoney(p.price_cents)}
                            </p>
                            <p className="text-xs text-gray-500">
                              SKU {p.sku} · {p.stock_qty} in stock
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy || p.stock_qty <= 0}
                            onClick={() => void handleAdd(p)}
                          >
                            Add to cart
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {tab === 'cart' ? (
              <section className="grid gap-6 lg:grid-cols-[1fr,_320px]">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cart lines</h2>
                  {!cart || cart.lines.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">Your cart is empty.</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
                      {cart.lines.map((line) => (
                        <li key={line.cart_item_id} className="flex flex-wrap items-center gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{line.title}</p>
                            <p className="text-xs text-gray-500">
                              @ {formatMoney(line.unit_price_cents)} · line {formatMoney(line.line_subtotal_cents)}
                              {!line.available ? ' · unavailable' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busy || line.quantity <= 1}
                              onClick={() => void handleQty(line.cart_item_id, line.quantity - 1)}
                            >
                              −
                            </Button>
                            <span className="tabular-nums text-sm font-medium">{line.quantity}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={
                                busy ||
                                line.quantity >= line.stock_qty ||
                                !line.available ||
                                line.stock_qty <= 0
                              }
                              onClick={() => void handleQty(line.cart_item_id, line.quantity + 1)}
                            >
                              +
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => void handleRemove(line.cart_item_id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Totals</h2>
                    {cart ? (
                      <>
                        <dl className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <dt className="text-gray-500">Subtotal</dt>
                            <dd className="font-medium">{formatMoney(cart.subtotal_cents)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-gray-500">Discount</dt>
                            <dd className="font-medium">
                              −{formatMoney(cart.discount_cents)}{' '}
                              {cart.discount_code ? `(${cart.discount_code})` : ''}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2 border-t border-gray-100 pt-2 text-base dark:border-gray-700">
                            <dt className="font-semibold text-gray-900 dark:text-white">Total</dt>
                            <dd className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {formatMoney(cart.total_cents)}
                            </dd>
                          </div>
                        </dl>
                        {cart.discount_issue ? (
                          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                            Stored code warning: {cart.discount_issue} (still shown for visibility).
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-gray-500">Loading cart…</p>
                    )}

                    <div className="mt-5 space-y-2">
                      <TextInput
                        id="eco-discount"
                        label="Discount code"
                        value={discountInput}
                        onChange={(v) => setDiscountInput(v.toUpperCase())}
                        placeholder="SAVE10 · WELCOME5"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" disabled={busy} onClick={() => void applyDiscount()}>
                          Apply
                        </Button>
                        <Button type="button" variant="secondary" disabled={busy} onClick={() => void clearDiscount()}>
                          Remove code
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mock payment</h2>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      The backend simulates PSP tokens. Successful checkouts decrement stock and send an email audit
                      record.
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="pay"
                          checked={paymentChoice === 'tok_charge_success'}
                          onChange={() => setPaymentChoice('tok_charge_success')}
                        />
                        Approve (<code className="text-xs">tok_charge_success</code>)
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="pay"
                          checked={paymentChoice === 'tok_charge_declined'}
                          onChange={() => setPaymentChoice('tok_charge_declined')}
                        />
                        Decline (<code className="text-xs">tok_charge_declined</code>)
                      </label>
                    </div>
                    <div className="mt-3">
                      <TextInput
                        id="eco-pay-override"
                        label="Custom payment token (optional)"
                        value={paymentTokenOverride}
                        onChange={setPaymentTokenOverride}
                        placeholder="Overrides the radio token when non-empty"
                        autoComplete="off"
                      />
                    </div>
                    <Button className="mt-4 w-full" type="button" disabled={busy || !cart || cart.lines.length === 0} onClick={() => void handleCheckout()}>
                      {busy ? 'Processing…' : 'Place order'}
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {tab === 'orders' ? (
              <section className="space-y-6">
                {lastOrder ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                    <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                      Latest confirmation
                    </h2>
                    <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
                      #{lastOrder.confirmation_number} · {formatMoney(lastOrder.total_cents)} ·{' '}
                      {lastOrder.payment_status}
                    </p>
                    <ul className="mt-3 text-xs text-emerald-900 dark:text-emerald-200">
                      {lastOrder.items.map((i) => (
                        <li key={`${lastOrder.id}-${i.product_id}-${i.title}`}>
                          {i.quantity} × {i.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <Button type="button" variant="secondary" disabled={busy} onClick={() => void loadOrders()}>
                  Refresh order history
                </Button>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                  <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/60">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Confirmed</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Total</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{o.confirmation_number}</td>
                          <td className="whitespace-nowrap px-4 py-2">{formatMoney(o.total_cents)}</td>
                          <td className="whitespace-nowrap px-4 py-2 capitalize">{o.payment_status}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-xs">{o.discount_code_label ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-gray-500">No orders yet.</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {tab === 'emails' ? (
              <section className="space-y-4">
                <Button type="button" variant="secondary" disabled={busy} onClick={() => void loadEmails()}>
                  Refresh email log
                </Button>
                <div className="space-y-3">
                  {emails.length === 0 ? (
                    <p className="text-sm text-gray-500">No queued emails yet.</p>
                  ) : null}
                  {emails.map((n) => (
                    <article
                      key={n.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{n.subject}</span>
                        <span>
                          {n.notification_type} · {n.created_at}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{n.body_text}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        SMTP attempted: {n.smtp_attempted ? 'yes' : 'no (logged only)'} · Order ID:{' '}
                        {n.order_id ?? '—'}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </ThemeProvider>
  )
}
