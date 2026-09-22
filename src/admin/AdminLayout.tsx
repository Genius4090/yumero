import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { ExternalLink, Image, LayoutDashboard, List, LogOut, Percent, Settings, ShieldCheck, ShoppingBag, Users, UtensilsCrossed } from "lucide-react"
import { WebsiteLogo } from "@/assets/images"
import { useAuth } from "@/context/AuthContext"
import { useI18n } from "@/i18n/useI18n"
import type { TranslationKey } from "@/i18n"
import ToastProvider from "./components/ToastProvider"

const links: { to: string; key: TranslationKey; Icon: typeof LayoutDashboard; end?: boolean; superOnly?: boolean }[] = [
  { to: "/admin", key: "admin.nav.dashboard", Icon: LayoutDashboard, end: true },
  { to: "/admin/orders", key: "admin.nav.orders", Icon: ShoppingBag },
  { to: "/admin/products", key: "admin.nav.products", Icon: UtensilsCrossed },
  { to: "/admin/categories", key: "admin.nav.categories", Icon: List },
  { to: "/admin/banners", key: "admin.nav.banners", Icon: Image },
  { to: "/admin/promo-codes", key: "admin.nav.promo", Icon: Percent },
  { to: "/admin/users", key: "admin.nav.users", Icon: Users },
  { to: "/admin/staff", key: "admin.nav.staff", Icon: ShieldCheck, superOnly: true },
  { to: "/admin/settings", key: "admin.nav.settings", Icon: Settings },
]

const AdminLayout = () => {
  const { t } = useI18n()
  const { user, isSuperAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/admin/login")
  }

  return (
    <ToastProvider>
    <div className="flex min-h-screen bg-[#111] text-white">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-[#161616] p-5">
        <div className="mb-8 px-2">
          <img src={WebsiteLogo} alt="Yumero" className="h-9 w-auto" />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links
            .filter((l) => !l.superOnly || isSuperAdmin)
            .map(({ to, key, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-[#ff0099] text-white" : "text-[#c4c4c4] hover:bg-[#2b2a2a] hover:text-white"
                  }`
                }
              >
                <Icon className="size-4" />
                {t(key)}
              </NavLink>
            ))}
        </nav>

        <div className="mt-6 flex flex-col gap-1 border-t border-white/5 pt-4">
          <div className="px-3 pb-1">
            <p className="truncate text-sm font-medium text-white">{user?.fullName || user?.phone}</p>
            <p className="text-[11px] font-semibold tracking-wider text-[#8a8a8a] uppercase">
              {isSuperAdmin ? t("admin.roles.SUPERADMIN") : t("admin.roles.ADMIN")}
            </p>
          </div>
          <a href="/home" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#c4c4c4] transition-colors hover:bg-[#2b2a2a] hover:text-white">
            <ExternalLink className="size-4" />
            {t("admin.nav.site")}
          </a>
          <button type="button" onClick={handleLogout} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#ff6b6b] transition-colors hover:bg-[#2b2a2a]">
            <LogOut className="size-4" />
            {t("admin.nav.logout")}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
    </ToastProvider>
  )
}

export default AdminLayout
