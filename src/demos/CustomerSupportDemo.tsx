import { useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeProvider } from '../context/ThemeContext'
import {
  SupportApiError,
  supportAdmin,
  supportAgents,
  supportAuth,
  supportFetch,
  supportNotifications,
  supportTickets,
  type SupportTicket,
  type SupportUser,
} from '../lib/supportApi'

type SupportAdminDashboardPayload = Awaited<ReturnType<typeof supportAdmin.dashboard>>['dashboard']
import { Button } from '../components/ui/Button'
import { TextInput } from '../components/ui/TextInput'

const STATUSES = [
  'open',
  'assigned',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
  'reopened',
] as const

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const CATEGORIES = ['technical', 'billing', 'general', 'feature_request'] as const

function Alert({ children, kind }: { children: React.ReactNode; kind: 'error' | 'info' }) {
  const cls =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
      : 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-100'
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${cls}`} role="alert">
      {children}
    </div>
  )
}

type AgentPerformanceRow = {
  user_id: number
  name: string
  assigned_total: number
  open_assigned: number
}

function AdminTicketsByStatusChart({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, n]) => n), 1)
  if (entries.length === 0) {
    return <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No tickets yet.</p>
  }
  return (
    <ul className="mt-3 space-y-3" aria-label="Tickets by status">
      {entries.map(([status, count]) => (
        <li key={status}>
          <div className="flex justify-between gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="truncate capitalize">{status.replace(/_/g, ' ')}</span>
            <span className="shrink-0 tabular-nums font-medium text-gray-900 dark:text-gray-100">
              {count}
            </span>
          </div>
          <div
            className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
            role="presentation"
          >
            <div
              className="h-full min-w-0 rounded-full bg-indigo-500 transition-[width] dark:bg-indigo-400"
              style={{ width: `${Math.max((count / max) * 100, count > 0 ? 4 : 0)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function AdminAgentPerformanceChart({ agents }: { agents: AgentPerformanceRow[] }) {
  const max = Math.max(
    ...agents.flatMap((a) => [a.assigned_total, a.open_assigned]),
    1,
  )
  if (agents.length === 0) {
    return <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No agents yet.</p>
  }
  return (
    <ul className="mt-3 space-y-5" aria-label="Agent performance">
      {agents.map((a) => (
        <li key={a.user_id}>
          <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{a.name}</div>
          <div className="mt-2 space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Assigned total</span>
                <span className="tabular-nums text-gray-800 dark:text-gray-200">
                  {a.assigned_total}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                  style={{
                    width: `${Math.max((a.assigned_total / max) * 100, a.assigned_total > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Open (not resolved/closed)</span>
                <span className="tabular-nums text-gray-800 dark:text-gray-200">
                  {a.open_assigned}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-amber-500 dark:bg-amber-400"
                  style={{
                    width: `${Math.max((a.open_assigned / max) * 100, a.open_assigned > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function CustomerSupportDemo() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('support_token'))
  const [user, setUser] = useState<SupportUser | null>(null)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('customer@support.local')
  const [password, setPassword] = useState('Demo12345!')
  const [name, setName] = useState('New User')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<(SupportTicket & { description: string }) | null>(null)
  const [comments, setComments] = useState<
    Array<{ id: number; content: string; is_internal: boolean; user_name: string | null; created_at: string }>
  >([])
  const [history, setHistory] = useState<
    Array<{ action: string; from_value: string | null; to_value: string | null; created_at: string }>
  >([])
  const [commentText, setCommentText] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [newSubject, setNewSubject] = useState('Login issue with my account')
  const [newDesc, setNewDesc] = useState(
    'I cannot sign in to my account after resetting password. Please help me resolve this issue soon.'
  )
  const [newPriority, setNewPriority] = useState<string>('medium')
  const [newCategory, setNewCategory] = useState<string>('technical')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [autoAssign, setAutoAssign] = useState(true)
  const [statusPick, setStatusPick] = useState<string>('in_progress')
  const [priorityReason, setPriorityReason] = useState('Customer escalated via phone; increasing urgency.')
  const [newPriorityPick, setNewPriorityPick] = useState<string>('urgent')
  const [agents, setAgents] = useState<SupportUser[]>([])
  const [assignAgentId, setAssignAgentId] = useState<string>('')
  const [dashboard, setDashboard] = useState<SupportAdminDashboardPayload | null>(null)
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; read: boolean }>>([])
  const [view, setView] = useState<'overview' | 'tickets' | 'new' | 'admin'>('overview')

  const openTicketsCsvExport = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      const blob = await supportAdmin.exportTicketsCsv(token)
      const url = URL.createObjectURL(blob)
      const opened = window.open(url, '_blank', 'noopener,noreferrer')
      if (!opened) {
        const a = document.createElement('a')
        a.href = url
        a.download = 'tickets-export.csv'
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
    } catch (e) {
      setError(e instanceof SupportApiError ? e.message : e instanceof Error ? e.message : String(e))
    }
  }, [token])

  const loadMe = useCallback(async (t: string) => {
    const r = await supportAuth.me(t)
    setUser(r.user)
    setNewCustomerEmail(r.user.email)
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    loadMe(token).catch(() => {
      setToken(null)
      localStorage.removeItem('support_token')
    })
  }, [token, loadMe])

  const refreshTickets = useCallback(async () => {
    if (!token) return
    const r = await supportTickets.list(token)
    setTickets(r.tickets)
  }, [token])

  const refreshNotifications = useCallback(async () => {
    if (!token) return
    const r = await supportNotifications.list(token)
    setNotifications(r.notifications)
  }, [token])

  useEffect(() => {
    if (!token || !user) return
    refreshTickets().catch((e) => setError(e instanceof Error ? e.message : String(e)))
    if (user.role === 'admin') {
      supportAgents.list(token).then((r) => setAgents(r.agents)).catch(() => {})
    }
    refreshNotifications().catch(() => {})
  }, [token, user, refreshTickets, refreshNotifications])

  useEffect(() => {
    if (user?.role === 'customer') setInternalNote(false)
  }, [user?.role])

  const openDetail = async (id: number) => {
    if (!token) return
    setSelectedId(id)
    setError(null)
    try {
      const [t, c, h] = await Promise.all([
        supportTickets.get(token, id),
        supportTickets.comments(token, id),
        supportTickets.history(token, id),
      ])
      setDetail(t.ticket)
      setComments(c.comments)
      setHistory(h.history)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await supportAuth.login(email, password)
      localStorage.setItem('support_token', r.access_token)
      setToken(r.access_token)
      setUser(r.user)
      setView('overview')
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await supportAuth.register(name, email, password)
      localStorage.setItem('support_token', r.access_token)
      setToken(r.access_token)
      setUser(r.user)
      setView('overview')
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('support_token')
    setToken(null)
    setUser(null)
    setTickets([])
    setDetail(null)
    setSelectedId(null)
    setInternalNote(false)
  }

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !user) return
    setBusy(true)
    setError(null)
    try {
      await supportTickets.create(token, {
        subject: newSubject,
        description: newDesc,
        priority: newPriority,
        category: newCategory,
        customer_email: newCustomerEmail || user.email,
        auto_assign: autoAssign,
      })
      setView('tickets')
      await refreshTickets()
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Could not create ticket')
    } finally {
      setBusy(false)
    }
  }

  const applyStatus = async () => {
    if (!token || !selectedId) return
    setBusy(true)
    setError(null)
    try {
      await supportTickets.updateStatus(token, selectedId, statusPick)
      await openDetail(selectedId)
      await refreshTickets()
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Status update failed')
    } finally {
      setBusy(false)
    }
  }

  const applyPriority = async () => {
    if (!token || !selectedId) return
    setBusy(true)
    setError(null)
    try {
      await supportTickets.updatePriority(token, selectedId, newPriorityPick, priorityReason)
      await openDetail(selectedId)
      await refreshTickets()
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Priority update failed')
    } finally {
      setBusy(false)
    }
  }

  const assignTicket = async () => {
    if (!token || !selectedId) return
    setBusy(true)
    setError(null)
    try {
      if (assignAgentId === 'auto') {
        await supportTickets.assign(token, selectedId, null, true)
      } else {
        await supportTickets.assign(token, selectedId, Number(assignAgentId), false)
      }
      await openDetail(selectedId)
      await refreshTickets()
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Assignment failed')
    } finally {
      setBusy(false)
    }
  }

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !selectedId || !commentText.trim() || !user) return
    setBusy(true)
    setError(null)
    try {
      const isInternal = user.role === 'customer' ? false : internalNote
      await supportTickets.addComment(token, selectedId, commentText, isInternal)
      setCommentText('')
      await openDetail(selectedId)
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Comment failed')
    } finally {
      setBusy(false)
    }
  }

  const loadAdmin = async () => {
    if (!token) return
    setBusy(true)
    try {
      const r = await supportAdmin.dashboard(token)
      setDashboard(r.dashboard)
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Failed to load dashboard')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (view === 'admin' && token && user?.role === 'admin') loadAdmin()
  }, [view, token, user?.role])

  const deleteTicket = async () => {
    if (!token || !selectedId || !user || user.role !== 'admin') return
    if (!window.confirm('Delete this ticket permanently?')) return
    setBusy(true)
    try {
      await supportFetch(`/api/tickets/${selectedId}`, { method: 'DELETE', token })
      setSelectedId(null)
      setDetail(null)
      await refreshTickets()
    } catch (err) {
      setError(err instanceof SupportApiError ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const roleLabel = useMemo(() => {
    if (!user) return ''
    return user.role === 'customer' ? 'Customer' : user.role === 'agent' ? 'Support agent' : 'Administrator'
  }, [user])

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <header className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                Full app
              </p>
              <h1 className="text-2xl font-bold">Customer Support Tickets</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Flask + SQLAlchemy API · JWT · RBAC · SLA tracking · Admin dashboard
              </p>
            </div>
            {user && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user.name} · <span className="font-medium text-gray-900 dark:text-white">{roleLabel}</span>
                </span>
                <Button variant="secondary" type="button" onClick={logout}>
                  Log out
                </Button>
              </div>
            )}
          </header>

          {!user && (
            <div className="mx-auto max-w-md space-y-6">
              <div className="flex gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
                <button
                  type="button"
                  className={`flex-1 rounded-md py-2 text-sm font-medium ${
                    tab === 'login'
                      ? 'bg-white shadow dark:bg-gray-800'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                  onClick={() => setTab('login')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md py-2 text-sm font-medium ${
                    tab === 'register'
                      ? 'bg-white shadow dark:bg-gray-800'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                  onClick={() => setTab('register')}
                >
                  Register
                </button>
              </div>
              {error && <Alert kind="error">{error}</Alert>}
              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <TextInput
                    id="support-login-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <TextInput
                    id="support-login-password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                  />
                  <Button type="submit" disabled={busy} className="w-full">
                    {busy ? 'Signing in…' : 'Sign in'}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Demo seed: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">customer@support.local</code> /{' '}
                    <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">Demo12345!</code> — agents and admin in{' '}
                    <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">customer_support_api</code> README.
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <TextInput id="support-reg-name" label="Name" value={name} onChange={setName} required />
                  <TextInput
                    id="support-reg-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <TextInput
                    id="support-reg-password"
                    label="Password (min 8 chars)"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    required
                  />
                  <Button type="submit" disabled={busy} className="w-full">
                    {busy ? 'Creating account…' : 'Create account'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {user && (
            <>
              <nav className="mb-6 flex flex-wrap gap-2">
                {(['overview', 'tickets', 'new', 'admin'] as const).map((v) => {
                  if (v === 'admin' && user.role !== 'admin') return null
                  if (v === 'new' && user.role !== 'customer') return null
                  const labels: Record<string, string> = {
                    overview: 'Overview',
                    tickets: 'Tickets',
                    new: 'New ticket',
                    admin: 'Admin dashboard',
                  }
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        view === v
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {labels[v]}
                    </button>
                  )
                })}
              </nav>

              {error && (
                <div className="mb-4">
                  <Alert kind="error">{error}</Alert>
                </div>
              )}

              {view === 'overview' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="font-semibold">In-app notifications</h2>
                    <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                      {notifications.length === 0 && (
                        <li className="text-gray-500 dark:text-gray-400">No notifications yet.</li>
                      )}
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`rounded border px-3 py-2 dark:border-gray-700 ${n.read ? 'opacity-60' : ''}`}
                        >
                          {n.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="font-semibold">Quick actions</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Open <strong>Tickets</strong> to browse and update items you are allowed to see. Customers create
                      requests under <strong>New ticket</strong>. Admins get metrics under{' '}
                      <strong>Admin dashboard</strong>.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => setView('tickets')}>
                        Go to tickets
                      </Button>
                      {user.role === 'customer' && (
                        <Button type="button" onClick={() => setView('new')}>
                          Create ticket
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {view === 'new' && user.role === 'customer' && (
                <form onSubmit={createTicket} className="max-w-xl space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <TextInput
                    id="support-new-subject"
                    label="Subject"
                    value={newSubject}
                    onChange={setNewSubject}
                    required
                  />
                  <div>
                    <label className="mb-1 block text-sm font-medium">Description (min 20 characters)</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                      rows={5}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Priority</label>
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Category</label>
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <TextInput
                    id="support-new-email"
                    label="Contact email"
                    type="email"
                    value={newCustomerEmail}
                    onChange={setNewCustomerEmail}
                    required
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoAssign}
                      onChange={(e) => setAutoAssign(e.target.checked)}
                    />
                    Auto-assign to best available agent
                  </label>
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Submitting…' : 'Submit ticket'}
                  </Button>
                </form>
              )}

              {view === 'tickets' && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                      <h2 className="font-semibold">Ticket list</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing tickets visible to your role (customers: own only; agents: queue + assigned; admins: all).
                      </p>
                    </div>
                    <ul className="max-h-[480px] divide-y divide-gray-200 overflow-y-auto dark:divide-gray-800">
                      {tickets.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                              selectedId === t.id ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''
                            }`}
                            onClick={() => openDetail(t.id)}
                          >
                            <div className="font-medium">{t.ticket_number}</div>
                            <div className="text-gray-600 dark:text-gray-400">{t.subject}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs">
                              <span className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">{t.status}</span>
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                                {t.priority}
                              </span>
                              {t.escalated && (
                                <span className="rounded bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-900/40">SLA</span>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                      {tickets.length === 0 && (
                        <li className="px-4 py-8 text-center text-sm text-gray-500">No tickets yet.</li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    {!detail && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Select a ticket to view details.</p>
                    )}
                    {detail && (
                      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h2 className="text-lg font-semibold">{detail.ticket_number}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{detail.subject}</p>
                          </div>
                          {user.role === 'admin' && (
                            <Button type="button" variant="secondary" onClick={deleteTicket} disabled={busy}>
                              Delete
                            </Button>
                          )}
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{detail.description}</p>

                        {(user.role === 'agent' || user.role === 'admin') && (
                          <div className="mt-6 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                            <h3 className="text-sm font-semibold">Status</h3>
                            <div className="flex flex-wrap gap-2">
                              <select
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                                value={statusPick}
                                onChange={(e) => setStatusPick(e.target.value)}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                              <Button type="button" size="sm" onClick={applyStatus} disabled={busy}>
                                Update status
                              </Button>
                            </div>
                            <h3 className="text-sm font-semibold">Priority (requires reason)</h3>
                            <div className="flex flex-wrap gap-2">
                              <select
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                                value={newPriorityPick}
                                onChange={(e) => setNewPriorityPick(e.target.value)}
                              >
                                {PRIORITIES.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <textarea
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                              rows={2}
                              placeholder="Reason for priority change"
                              value={priorityReason}
                              onChange={(e) => setPriorityReason(e.target.value)}
                            />
                            <Button type="button" size="sm" onClick={applyPriority} disabled={busy}>
                              Update priority
                            </Button>
                          </div>
                        )}

                        {user.role === 'admin' && agents.length > 0 && (
                          <div className="mt-6 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                            <h3 className="text-sm font-semibold">Assign agent</h3>
                            <div className="flex flex-wrap gap-2">
                              <select
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                                value={assignAgentId}
                                onChange={(e) => setAssignAgentId(e.target.value)}
                              >
                                <option value="">Select agent…</option>
                                <option value="auto">Auto-assign by workload</option>
                                {agents.map((a) => (
                                  <option key={a.id} value={String(a.id)}>
                                    {a.name} ({a.email})
                                  </option>
                                ))}
                              </select>
                              <Button type="button" size="sm" onClick={assignTicket} disabled={busy || !assignAgentId}>
                                Assign
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
                          <h3 className="text-sm font-semibold">Comments</h3>
                          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm">
                            {comments.map((c) => (
                              <li key={c.id} className="rounded border border-gray-100 px-3 py-2 dark:border-gray-800">
                                <div className="text-xs text-gray-500">
                                  {c.user_name ?? 'User'} · {new Date(c.created_at).toLocaleString()}
                                  {c.is_internal && (
                                    <span className="ml-2 rounded bg-amber-100 px-1 text-amber-900 dark:bg-amber-900/50">
                                      internal
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 whitespace-pre-wrap">{c.content}</div>
                              </li>
                            ))}
                          </ul>
                          <form onSubmit={sendComment} className="mt-3 space-y-2">
                            <textarea
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                              rows={3}
                              placeholder="Write a reply…"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                            />
                            {(user.role === 'agent' || user.role === 'admin') && (
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={internalNote}
                                  onChange={(e) => setInternalNote(e.target.checked)}
                                />
                                Internal note (hidden from customer)
                              </label>
                            )}
                            <Button type="submit" size="sm" disabled={busy}>
                              Send comment
                            </Button>
                          </form>
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
                          <h3 className="text-sm font-semibold">History</h3>
                          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-gray-600 dark:text-gray-400">
                            {history.map((h, i) => (
                              <li key={i}>
                                {h.created_at}: {h.action}{' '}
                                {h.from_value || h.to_value
                                  ? `(${h.from_value ?? '—'} → ${h.to_value ?? '—'})`
                                  : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'admin' && user.role === 'admin' && (
                <div className="space-y-4">
                  <Button type="button" variant="secondary" onClick={loadAdmin} disabled={busy}>
                    Refresh metrics
                  </Button>
                  {dashboard && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <div className="text-xs text-gray-500">Total tickets</div>
                        <div className="text-2xl font-bold">{String(dashboard.total_tickets ?? '')}</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <div className="text-xs text-gray-500">SLA compliance</div>
                        <div className="text-2xl font-bold">{String(dashboard.sla_compliance_percent ?? '')}%</div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <div className="text-xs text-gray-500">Avg resolution (h)</div>
                        <div className="text-2xl font-bold">
                          {dashboard.average_resolution_hours != null
                            ? String(dashboard.average_resolution_hours)
                            : '—'}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-4 md:col-span-2 lg:col-span-3 dark:border-gray-800 dark:bg-gray-900">
                        <div className="text-sm font-semibold">Tickets by status</div>
                        <AdminTicketsByStatusChart byStatus={dashboard.by_status} />
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-white p-4 md:col-span-2 lg:col-span-3 dark:border-gray-800 dark:bg-gray-900">
                        <div className="text-sm font-semibold">Agent performance</div>
                        <AdminAgentPerformanceChart agents={dashboard.agent_performance} />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="text-left text-sm text-indigo-600 underline decoration-indigo-600/80 underline-offset-2 hover:text-indigo-500 dark:text-indigo-400 dark:decoration-indigo-400/80 dark:hover:text-indigo-300"
                    onClick={() => void openTicketsCsvExport()}
                  >
                    Export tickets as CSV (opens in a new tab, or downloads if pop-ups are blocked)
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Uses your current admin session; no separate API client is required.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}
