const base = () =>
  import.meta.env.VITE_SUPPORT_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:5002'

export type SupportUser = {
  id: number
  name: string
  email: string
  role: 'customer' | 'agent' | 'admin'
  availability_status?: string
  expertise_areas?: string[]
}

export type SupportTicket = {
  id: number
  ticket_number: string
  subject: string
  description?: string
  status: string
  priority: string
  category: string
  customer_email: string
  customer_id: number
  assigned_to_id: number | null
  created_at: string
  updated_at?: string
  response_due_at?: string | null
  resolution_due_at?: string | null
  sla_response_breached?: boolean
  sla_resolution_breached?: boolean
  escalated?: boolean
}

export type ApiErrorBody = {
  status?: string
  message?: string
  code?: string
  errors?: Record<string, string[]>
}

export class SupportApiError extends Error {
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
    this.name = 'SupportApiError'
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

export async function supportFetch<T>(
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
    throw new SupportApiError(msg, res.status, data.code, data.errors)
  }
  return data as T
}

async function supportFetchBlob(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<Blob> {
  const { token, ...init } = options
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${base()}${path}`, { ...init, headers })
  if (!res.ok) {
    const data = (await parseJson(res)) as ApiErrorBody
    const msg =
      typeof data.message === 'string'
        ? data.message
        : `Request failed (${res.status})`
    throw new SupportApiError(msg, res.status, data.code, data.errors)
  }
  return res.blob()
}

export const supportAuth = {
  login: (email: string, password: string) =>
    supportFetch<{
      access_token: string
      user: SupportUser
    }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (name: string, email: string, password: string) =>
    supportFetch<{
      access_token: string
      user: SupportUser
    }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  me: (token: string) =>
    supportFetch<{ user: SupportUser }>('/api/auth/me', { token }),
}

export const supportTickets = {
  list: (token: string, q?: Record<string, string>) => {
    const params = new URLSearchParams(q)
    const qs = params.toString()
    const query = qs ? `?${qs}` : ''
    return supportFetch<{
      tickets: SupportTicket[]
      page: number
      per_page: number
      total: number
    }>(`/api/tickets${query}`, { token })
  },

  get: (token: string, id: number) =>
    supportFetch<{ ticket: SupportTicket & { description: string } }>(`/api/tickets/${id}`, {
      token,
    }),

  create: (
    token: string,
    body: {
      subject: string
      description: string
      priority: string
      category: string
      customer_email: string
      auto_assign?: boolean
    }
  ) =>
    supportFetch<{ ticket: SupportTicket }>('/api/tickets', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  updateStatus: (token: string, id: number, status: string) =>
    supportFetch<{ ticket: SupportTicket }>(`/api/tickets/${id}/status`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ status }),
    }),

  updatePriority: (token: string, id: number, priority: string, reason: string) =>
    supportFetch<{ ticket: SupportTicket }>(`/api/tickets/${id}/priority`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ priority, reason }),
    }),

  assign: (token: string, id: number, agentId: number | null, auto: boolean) =>
    supportFetch<{ ticket: SupportTicket }>(`/api/tickets/${id}/assign`, {
      method: 'POST',
      token,
      body: JSON.stringify(
        auto ? { auto: true } : { auto: false, agent_id: agentId }
      ),
    }),

  comments: (token: string, id: number) =>
    supportFetch<{
      comments: Array<{
        id: number
        content: string
        is_internal: boolean
        user_name: string | null
        created_at: string
      }>
    }>(`/api/tickets/${id}/comments`, { token }),

  addComment: (
    token: string,
    id: number,
    content: string,
    isInternal: boolean
  ) =>
    supportFetch<unknown>(`/api/tickets/${id}/comments`, {
      method: 'POST',
      token,
      body: JSON.stringify({ content, is_internal: isInternal }),
    }),

  history: (token: string, id: number) =>
    supportFetch<{ history: Array<{ action: string; from_value: string | null; to_value: string | null; created_at: string }> }>(
      `/api/tickets/${id}/history`,
      { token }
    ),
}

export const supportAdmin = {
  dashboard: (token: string) =>
    supportFetch<{
      dashboard: {
        total_tickets: number
        by_status: Record<string, number>
        by_priority: Record<string, number>
        by_category: Record<string, number>
        average_resolution_hours: number | null
        agent_performance: Array<{
          user_id: number
          name: string
          assigned_total: number
          open_assigned: number
        }>
        sla_compliance_percent: number
        sla_breached_count: number
      }
    }>('/api/admin/dashboard', { token }),

  exportTicketsCsv: (token: string) =>
    supportFetchBlob('/api/admin/reports/export?type=tickets', { token }),
}

export const supportAgents = {
  list: (token: string) =>
    supportFetch<{ agents: SupportUser[] }>('/api/agents', { token }),
}

export const supportNotifications = {
  list: (token: string) =>
    supportFetch<{ notifications: Array<{ id: number; message: string; read: boolean }> }>(
      '/api/notifications',
      { token }
    ),
}
