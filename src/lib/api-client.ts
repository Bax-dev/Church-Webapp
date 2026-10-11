'use client'

/**
 * Browser side of the API. Every call returns `data` or throws ApiError with the server's message and field errors.
 * An expired access token (401) is refreshed once via /api/auth/refresh and the call retried; parallel calls share one refresh.
 */

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) {
    super(message)
  }
}

type Envelope<T> = { success: true; data: T } | { success: false; error: { message: string; fields?: Record<string, string> } }

let refreshing: Promise<boolean> | undefined

function refreshSession() {
  refreshing ??= fetch('/api/auth/refresh/', { method: 'POST', credentials: 'same-origin' })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => { refreshing = undefined })
  return refreshing
}

/** trailingSlash is on, so '/api/me' would answer with a redirect first; '/api/me/?x' goes straight to the handler. */
export const apiPath = (path: string) => path.replace(/^([^?]*?)\/?(\?|$)/, '$1/$2')

export async function api<T = unknown>(rawPath: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const path = apiPath(rawPath)
  const isForm = options.body instanceof FormData
  const send = () => fetch(path, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    credentials: 'same-origin',
    headers: options.body === undefined || isForm ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
  })

  let response = await send().catch(() => {
    throw new ApiError('We could not reach the server. Check your connection and try again.', 0)
  })
  if (response.status === 401 && !path.startsWith('/api/auth/') && (await refreshSession())) response = await send()

  const payload = (await response.json().catch(() => undefined)) as Envelope<T> | undefined
  if (payload?.success) return payload.data
  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    // The session is gone for good: send them to sign in, then back here.
    window.location.assign(`/login/?next=${encodeURIComponent(window.location.pathname)}`)
  }
  throw new ApiError(payload && !payload.success ? payload.error.message : 'Something went wrong. Please try again.', response.status, payload && !payload.success ? payload.error.fields : undefined)
}

/** Only same-site paths are followed after sign-in, so ?next= cannot send someone to another site. */
export function safeNext(value: string | null | undefined, fallback: string) {
  return value && /^\/(?!\/)/.test(value) && !value.startsWith('/api/') ? value : fallback
}
