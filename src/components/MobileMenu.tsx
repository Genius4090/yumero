import { useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { Dialog as DialogPrimitive } from "radix-ui"
import { ChevronRight, House, Menu as MenuIcon, ReceiptText, UserRound, UtensilsCrossed, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import type { TranslationKey } from "@/i18n"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"
import AddressSelect from "./AddressSelect"
import AuthModal from "./AuthModal"
import Button from "./Button"
import Wordmark from "./Wordmark"

const links: { to: string; key: TranslationKey; Icon: typeof House }[] = [
  { to: "/home", key: "nav.home", Icon: House },
  { to: "/menu", key: "nav.menu", Icon: UtensilsCrossed },
  { to: "/orders", key: "nav.orders", Icon: ReceiptText },
]

/**
 * Phone / tablet navigation (below `lg`): a burger button that opens a right-hand sheet with the
 * delivery address, the page links and the account row. Desktop keeps the inline header nav.
 */
const MobileMenu = () => {
  const { t } = useI18n()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const photo = mediaUrl(user?.avatarUrl)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={t("nav.openMenu")}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white transition-colors hover:bg-[#3d3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:hidden"
        >
          <MenuIcon className="size-5" />
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-[#161616] p-5 text-white shadow-2xl outline-none duration-300 ease-out data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right"
        >
          <DialogPrimitive.Title className="sr-only">{t("nav.mainNav")}</DialogPrimitive.Title>

          <div className="flex h-11 items-center justify-between">
            <Link to="/home" onClick={close} aria-label={t("nav.logoAria")} className="flex h-11 items-center">
              <Wordmark className="text-3xl" />
            </Link>
            <DialogPrimitive.Close
              aria-label={t("nav.closeMenu")}
              className="grid size-10 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white transition-colors hover:bg-[#3d3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-6">
            <AddressSelect variant="row" />
          </div>

          <nav aria-label={t("nav.mainNav")} className="mt-6 flex flex-col gap-1">
            {links.map(({ to, key, Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={close}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-colors ${
                    isActive ? "bg-[#2b2a2a] text-white" : "text-[#c4c4c4] hover:bg-[#2b2a2a]/60 hover:text-white"
                  }`
                }
              >
                <Icon className="size-5" />
                {t(key)}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-5">
            {user ? (
              <Link
                to="/profile"
                onClick={close}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[#2b2a2a]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2b2a2a] text-[#c4c4c4]">
                  {photo ? <img src={photo} alt="" className="size-full object-cover" draggable={false} /> : <UserRound className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{user.fullName || t("nav.profile")}</span>
                  <span className="block text-sm text-[#8a8a8a]">{t("nav.profile")}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-[#8a8a8a]" />
              </Link>
            ) : (
              <AuthModal>
                <Button extraClass="w-full justify-center py-3 font-semibold">{t("nav.login")}</Button>
              </AuthModal>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default MobileMenu
