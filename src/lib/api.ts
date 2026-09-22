import type { AuthUser } from "@/@types"

/** Empty = same origin (production behind Caddy, dev via the Vite proxy). */
const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "")

/** Turns `/uploads/x.jpg` into an absolute URL when the API lives on another origin. */
export const mediaUrl = (url: string | null | undefined) => {
  if (!url) return null
  return url.startsWith("/") ? `${BASE}${url}` : url
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError

/* ---------- access token (memory only) ---------- */

let accessToken: string | null = null
const SESSION_FLAG = "auth:hasSession"

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token
    try {
      if (token) localStorage.setItem(SESSION_FLAG, "1")
      else localStorage.removeItem(SESSION_FLAG)
    } catch {
      // storage unavailable
    }
  },
  /** Whether this browser has logged in before (skips a pointless refresh call for new visitors). */
  hadSession: () => {
    try {
      return localStorage.getItem(SESSION_FLAG) === "1"
    } catch {
      return false
    }
  },
}

/* ---------- refresh (single in-flight promise shared by concurrent 401s) ---------- */

let refreshing: Promise<{ accessToken: string; user: AuthUser } | null> | null = null

export const refreshSession = () => {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/api/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          tokenStore.set(null)
          return null
        }
        const data = (await res.json()) as { accessToken: string; user: AuthUser }
        tokenStore.set(data.accessToken)
        return data
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

/* ---------- fetch wrapper ---------- */

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  signal?: AbortSignal
  /** Attach the bearer token (default true) */
  auth?: boolean
}

const request = async <T>(path: string, options: RequestOptions, allowRefresh: boolean): Promise<T> => {
  const headers: Record<string, string> = { Accept: "application/json" }
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData
  if (options.body !== undefined && !isForm) headers["Content-Type"] = "application/json"
  const token = options.auth === false ? null : tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    credentials: "include",
    signal: options.signal,
    body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
  })

  if (res.status === 401 && options.auth !== false && allowRefresh) {
    const refreshed = await refreshSession()
    if (refreshed) return request<T>(path, options, false)
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error
    throw new ApiError(res.status, err?.code ?? (res.status === 429 ? "TOO_MANY_REQUESTS" : "INTERNAL"), err?.message ?? res.statusText, err?.details)
  }
  return data as T
}

export const apiFetch = <T>(path: string, options: RequestOptions = {}) => request<T>(path, options, true)

export const uploadFile = (file: File) => {
  const form = new FormData()
  form.append("file", file)
  return apiFetch<{ url: string; size: number }>("/api/admin/upload", { method: "POST", body: form })
}
