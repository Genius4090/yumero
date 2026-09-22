import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

/** Renders children only for an authenticated ADMIN; everyone else goes to the admin login. */
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { status, isAdmin } = useAuth()
  const location = useLocation()

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#111] text-[#c4c4c4]">
        <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    )
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export default RequireAdmin
