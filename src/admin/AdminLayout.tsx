import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import LogoutDialog from "@/components/LogoutDialog"
import { ChevronsUpDown, Image, LayoutDashboard, List, LogOut, Percent, Settings, ShieldCheck, ShoppingBag, Undo2, UserRound, Users, UtensilsCrossed } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import Wordmark from "@/components/Wordmark"
import { useAuth } from "@/context/AuthContext"
import { useSettings } from "@/context/SettingsContext"
import { LOCALE_NAMES, type Locale } from "@/i18n"
import { useI18n } from "@/i18n/useI18n"
import type { TranslationKey } from "@/i18n"
import ToastProvider from "./components/ToastProvider"
import { AvatarThumb } from "./ui"

const links: { to: string; key: TranslationKey; Icon: typeof LayoutDashboard; end?: boolean; superOnly?: boolean }[] = [
  { to: "/dashboard", key: "admin.nav.dashboard", Icon: LayoutDashboard, end: true },
  { to: "/dashboard/orders", key: "admin.nav.orders", Icon: ShoppingBag },
  { to: "/dashboard/products", key: "admin.nav.products", Icon: UtensilsCrossed },
  { to: "/dashboard/categories", key: "admin.nav.categories", Icon: List },
  { to: "/dashboard/banners", key: "admin.nav.banners", Icon: Image },
  { to: "/dashboard/promo-codes", key: "admin.nav.promo", Icon: Percent },
  { to: "/dashboard/users", key: "admin.nav.users", Icon: Users },
  { to: "/dashboard/staff", key: "admin.nav.staff", Icon: ShieldCheck, superOnly: true },
  { to: "/dashboard/settings", key: "admin.nav.settings", Icon: Settings },
]

const LANGUAGE_ORDER: Locale[] = ["ru", "uz", "en"]

const AdminLayout = () => {
  const { t, locale } = useI18n()
  const { setSetting } = useSettings()
  const { user, isSuperAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const handleLogout = async () => {
    await logout()
    navigate("/home")
  }

  return (
    <ToastProvider>
    <div className="flex min-h-screen bg-[#111] text-white">
      <aside className="sticky top-0 flex h-screen w-68 shrink-0 flex-col border-r border-white/5 bg-[#161616] px-3 py-5">
        {/* aligned with the nav links' left padding and the 40px row height they use */}
        <div className="mb-6 flex h-10 items-center px-3">
          <Wordmark className="text-3xl" />
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
          {/* account row: photo or initials, name, role; the chevron opens a small menu with Profile and Log out */}
          <PopoverPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverPrimitive.Trigger asChild>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#2b2a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 data-[state=open]:bg-[#2b2a2a]"
              >
                <AvatarThumb url={user?.avatarUrl} name={user?.fullName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{user?.fullName || user?.phone}</span>
                  <span className="block truncate text-xs text-[#8a8a8a]">{isSuperAdmin ? t("admin.roles.SUPERADMIN") : t("admin.roles.ADMIN")}</span>
                </span>
                <ChevronsUpDown className="size-4 shrink-0 text-[#8a8a8a]" />
              </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                side="top"
                align="start"
                sideOffset={8}
                className="z-70 w-(--radix-popover-trigger-width) rounded-xl border border-white/10 bg-[#1c1c1c] p-1 text-sm text-white shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
              >
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/10">
                  <UserRound className="size-4" />
                  {t("nav.profile")}
                </Link>
                <div className="my-1 h-px bg-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setLogoutOpen(true)
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-[#ff6b6b] transition-colors hover:bg-white/10"
                >
                  <LogOut className="size-4" />
                  {t("admin.nav.logout")}
                </button>
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>

          {/* "back to site" icon on the left, RU / UZ / EN language pills on the right (same setting as the site) */}
          <div className="mt-1 flex items-center justify-between px-1">
            <Link
              to="/home"
              title={t("admin.nav.site")}
              aria-label={t("admin.nav.site")}
              className="grid size-8 place-items-center rounded-md text-[#c4c4c4] transition-colors hover:bg-[#2b2a2a] hover:text-white"
            >
              <Undo2 className="size-4" />
            </Link>
            <div role="radiogroup" aria-label={t("languages.label")} className="flex items-center gap-1">
              {LANGUAGE_ORDER.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={l === locale}
                  lang={l}
                  title={LOCALE_NAMES[l]}
                  onClick={() => setSetting("locale", l)}
                  className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase transition-colors ${
                    l === locale ? "bg-[#2b2a2a] text-white" : "text-[#c4c4c4] hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
    <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={handleLogout} />
    </ToastProvider>
  )
}

export default AdminLayout
