const BASE = (import.meta.env.VITE_API_URL ?? '') + '/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Token comes from login/me response body, set externally
let _csrfToken: string | null = null
export function setCsrfToken(token: string | null) {
  _csrfToken = token
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }

  if (!['GET', 'HEAD'].includes(method) && _csrfToken) {
    headers['X-CSRF-Token'] = _csrfToken
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

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    const err = json?.error
    throw new ApiError(
      res.status,
      typeof err === 'object' ? (err?.code ?? 'UNKNOWN') : (err ?? 'UNKNOWN'),
      typeof err === 'object' ? (err?.message ?? res.statusText) : res.statusText,
    )
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
    request<T>(path, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),
}
