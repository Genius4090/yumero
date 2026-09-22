import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

/**
 * Renders children only for an authenticated ADMIN / SUPERADMIN.
 * There is no separate admin login: everyone else is sent to the site, where the normal
 * login form brings staff accounts straight to the panel.
 */
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { status, isAdmin } = useAuth()

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#111] text-[#c4c4c4]">
        <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    )
  }
  if (!isAdmin) return <Navigate to="/home" replace />
  return <>{children}</>
}

export default RequireAdmin
