import { useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import type { AuthUser } from "@/@types"
import { WebsiteLogo } from "@/assets/images"
import { useAuth } from "@/context/AuthContext"
import { useI18n } from "@/i18n/useI18n"
import { apiFetch } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import { FormError, PasswordField, PhoneField } from "@/components/auth/Fields"
import { Btn } from "./ui"

const AdminLogin = () => {
  const { t } = useI18n()
  const { status, isAdmin, setSession, logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? "/admin"

  if (status === "authed" && isAdmin) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (phone.length !== 9 || !password || busy) return
    setBusy(true)
    setError(null)
    try {
      const session = await apiFetch<{ user: AuthUser; accessToken: string }>("/api/auth/login", { method: "POST", body: { phone, password }, auth: false })
      if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
        setError(t("admin.notAdmin"))
        await apiFetch<void>("/api/auth/logout", { method: "POST" }).catch(() => undefined)
        return
      }
      setSession(session)
      navigate(from, { replace: true })
    } catch (err) {
      setError(t(errorKey(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#111] px-4 text-white">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-[#1c1c1c] p-8">
        <img src={WebsiteLogo} alt="Yumero" className="mx-auto h-10 w-auto" />
        <h1 className="text-center text-xl font-semibold">{t("admin.loginTitle")}</h1>
        <p className="-mt-2 text-center text-sm text-[#c4c4c4]">{t("admin.loginHint")}</p>

        {status === "authed" && user && !isAdmin && (
          <div className="rounded-xl bg-[#2b2a2a] p-3 text-center text-sm text-[#c4c4c4]">
            {t("admin.notAdmin")}
            <Btn size="sm" className="mt-2 w-full" onClick={() => void logout()}>
              {t("admin.nav.logout")}
            </Btn>
          </div>
        )}

        <PhoneField id="admin-phone" value={phone} onChange={setPhone} autoFocus />
        <PasswordField id="admin-password" label={t("auth.password")} value={password} onChange={setPassword} autoComplete="current-password" />
        <FormError message={error} />
        <Btn type="submit" variant="primary" disabled={phone.length !== 9 || !password || busy} className="mt-2 w-full py-3">
          {busy ? t("auth.loggingIn") : t("auth.loginButton")}
        </Btn>
      </form>
    </div>
  )
}

export default AdminLogin
