import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import LogoutDialog from "@/components/LogoutDialog"
import { ChevronsUpDown, Image, LayoutDashboard, List, LogOut, Menu as MenuIcon, Percent, Settings, ShieldCheck, ShoppingBag, Undo2, UserRound, Users, UtensilsCrossed, X } from "lucide-react"
import { Dialog as DialogPrimitive, Popover as PopoverPrimitive } from "radix-ui"
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

/** Sidebar body: logo, page links, account row with its menu, and the site-link / language row. Used by the desktop sidebar and the phone drawer. */
const SidebarContent = ({ onNavigate, onLogout, showLogo = true }: { onNavigate?: () => void; onLogout: () => void; showLogo?: boolean }) => {
  const { t, locale } = useI18n()
  const { setSetting } = useSettings()
  const { user, isSuperAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {showLogo && (
        /* aligned with the nav links' left padding and the 40px row height they use */
        <div className="mb-6 flex h-10 items-center px-3">
          <Wordmark className="text-3xl" />
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-1">
        {links
          .filter((l) => !l.superOnly || isSuperAdmin)
          .map(({ to, key, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
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
              <Link
                to="/profile"
                onClick={() => {
                  setMenuOpen(false)
                  onNavigate?.()
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/10"
              >
                <UserRound className="size-4" />
                {t("nav.profile")}
              </Link>
              <div className="my-1 h-px bg-white/10" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onLogout()
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
            onClick={onNavigate}
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
    </>
  )
}

const AdminLayout = () => {
  const { t } = useI18n()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const handleLogout = async () => {
    await logout()
    navigate("/home")
  }
  const askLogout = () => {
    setDrawerOpen(false)
    setLogoutOpen(true)
  }

  return (
    <ToastProvider>
    <div className="flex min-h-screen bg-[#111] text-white">
      {/* desktop: fixed sidebar */}
      <aside className="sticky top-0 hidden h-screen w-68 shrink-0 flex-col border-r border-white/5 bg-[#161616] px-3 py-5 lg:flex">
        <SidebarContent onLogout={askLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* phones/tablets: compact top bar; the burger opens the same sidebar as a drawer */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-[#161616] px-4 lg:hidden">
          <Wordmark className="text-2xl" />
          <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DialogPrimitive.Trigger asChild>
              <button
                type="button"
                aria-label={t("admin.nav.dashboard")}
                className="grid size-10 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white transition-colors hover:bg-[#3a3939] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <MenuIcon className="size-5" />
              </button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
              <DialogPrimitive.Content
                aria-describedby={undefined}
                // extra bottom padding + the safe-area inset keeps the account row clear of the phone's home indicator
                className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col bg-[#161616] px-3 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] text-white shadow-2xl outline-none duration-300 ease-out data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left"
              >
                <DialogPrimitive.Title className="sr-only">{t("admin.title")}</DialogPrimitive.Title>
                <div className="mb-6 flex h-10 items-center justify-between px-3">
                  <Wordmark className="text-3xl" />
                  <DialogPrimitive.Close
                    aria-label={t("common.close")}
                    className="grid size-9 cursor-pointer place-items-center rounded-full text-[#c4c4c4] transition-colors hover:bg-[#2b2a2a] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    <X className="size-5" />
                  </DialogPrimitive.Close>
                </div>
                <SidebarContent showLogo={false} onNavigate={() => setDrawerOpen(false)} onLogout={askLogout} />
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
    <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={handleLogout} />
    </ToastProvider>
  )
}

export default AdminLayout
