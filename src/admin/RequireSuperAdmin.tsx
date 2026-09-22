import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

/** Inside the admin area: pages only the SUPERADMIN may open (e.g. Staff). */
const RequireSuperAdmin = ({ children }: { children: ReactNode }) => {
  const { isSuperAdmin } = useAuth()
  if (!isSuperAdmin) return <Navigate to="/admin" replace />
  return <>{children}</>
}

export default RequireSuperAdmin
