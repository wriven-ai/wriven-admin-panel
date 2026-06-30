const BASE = import.meta.env.VITE_API_URL ?? ''

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let csrfToken: string | null = null

function getCsrfToken(): string | null {
  if (csrfToken) return csrfToken
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]+)/)
  if (match) csrfToken = decodeURIComponent(match[1])
  return csrfToken
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (!['GET', 'HEAD'].includes(method)) {
    const token = getCsrfToken()
    if (token) headers['x-csrf-token'] = token
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (res.status === 401) {
    window.location.href = '/login'
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired')
  }

  const json = await res.json().catch(() => ({ success: false, error: 'PARSE_ERROR' }))

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error ?? 'UNKNOWN', json.message ?? res.statusText)
  }

  return json.data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
}

export { ApiError }
