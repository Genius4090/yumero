import { NavLink } from "react-router-dom"
import { House, ReceiptText, ShoppingBag, UserRound, UtensilsCrossed } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"
import AuthModal from "./AuthModal"

const itemClass = "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none transition-colors focus-visible:outline-none"
const toneClass = (active: boolean) => (active ? "text-[#ff0099]" : "text-[#9a9a9a] hover:text-white")

/**
 * App-style bottom navigation for phones and tablets (below `lg`): Home, Menu, Cart, Orders, Profile.
 * Cart is a full page here (/cart); the desktop header opens the same content as a drawer instead.
 */
const BottomNav = () => {
  const { t } = useI18n()
  const { user } = useAuth()
  const { count } = useCart()
  const photo = mediaUrl(user?.avatarUrl)

  return (
    /* floating pill: 16px in from both sides, 12px up from the bottom plus the device's safe area (iPhone home indicator) */
    <nav
      aria-label={t("nav.mainNav")}
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-40 rounded-2xl border border-white/10 bg-[#1c1c1c]/95 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md lg:hidden"
    >
      <ul className="flex h-16 items-stretch overflow-hidden rounded-2xl">
        <li className="flex-1">
          <NavLink to="/home" className={({ isActive }) => `${itemClass} ${toneClass(isActive)}`}>
            <House className="size-5" />
            {t("nav.home")}
          </NavLink>
        </li>
        <li className="flex-1">
          <NavLink to="/menu" className={({ isActive }) => `${itemClass} ${toneClass(isActive)}`}>
            <UtensilsCrossed className="size-5" />
            {t("nav.menu")}
          </NavLink>
        </li>
        <li className="flex-1">
          <NavLink
            to="/cart"
            aria-label={count > 0 ? t("nav.cartCountAria", { count }) : t("nav.cartEmptyAria")}
            className={({ isActive }) => `${itemClass} ${toneClass(isActive)}`}
          >
            <span className="relative">
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-[#ff0099] px-1 text-[10px] font-bold leading-4 text-white">
                  {count}
                </span>
              )}
            </span>
            {t("cart.tabCart")}
          </NavLink>
        </li>
        <li className="flex-1">
          <NavLink to="/orders" className={({ isActive }) => `${itemClass} ${toneClass(isActive)}`}>
            <ReceiptText className="size-5" />
            {t("nav.orders")}
          </NavLink>
        </li>
        <li className="flex-1">
          {user ? (
            <NavLink to="/profile" className={({ isActive }) => `${itemClass} ${toneClass(isActive)}`}>
              {photo ? (
                <img src={photo} alt="" className="size-5 rounded-full object-cover" draggable={false} />
              ) : (
                <UserRound className="size-5" />
              )}
              {t("nav.profile")}
            </NavLink>
          ) : (
            <AuthModal>
              <button type="button" className={`${itemClass} ${toneClass(false)}`}>
                <UserRound className="size-5" />
                {t("nav.login")}
              </button>
            </AuthModal>
          )}
        </li>
      </ul>
    </nav>
  )
}

export default BottomNav
