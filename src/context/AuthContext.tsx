/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { AuthUser } from "@/@types"
import { apiFetch, refreshSession, tokenStore } from "@/lib/api"

export type AuthStatus = "loading" | "guest" | "authed"

export interface Session {
  user: AuthUser
  accessToken: string
}

interface AuthContextValue {
  user: AuthUser | null
  /** "loading" only during the initial session restore on page load */
  status: AuthStatus
  /** ADMIN or SUPERADMIN: may use the admin panel */
  isAdmin: boolean
  isSuperAdmin: boolean
  /** Called by the auth modal / admin login after a successful API login */
  setSession: (session: Session) => void
  logout: () => Promise<void>
  updateUser: (patch: { fullName: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStore.hadSession() ? "loading" : "guest"))

  // Restore the session from the refresh cookie on first load
  useEffect(() => {
    if (status !== "loading") return
    let cancelled = false
    refreshSession().then((session) => {
      if (cancelled) return
      if (session) {
        setUser(session.user)
        setStatus("authed")
      } else {
        setStatus("guest")
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setSession = useCallback((session: Session) => {
    tokenStore.set(session.accessToken)
    setUser(session.user)
    setStatus("authed")
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>("/api/auth/logout", { method: "POST" })
    } catch {
      // the cookie may already be gone; log out locally regardless
    }
    tokenStore.set(null)
    setUser(null)
    setStatus("guest")
    qc.clear()
  }, [qc])

  const updateUser = useCallback(async (patch: { fullName: string }) => {
    const next = await apiFetch<AuthUser>("/api/auth/me", { method: "PATCH", body: patch })
    setUser(next)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAdmin: user?.role === "ADMIN" || user?.role === "SUPERADMIN",
        isSuperAdmin: user?.role === "SUPERADMIN",
        setSession,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
