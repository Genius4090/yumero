import { Link, NavLink } from "react-router-dom"
import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { WebsiteLogo } from "../assets/images"
import { AddressSelect, AuthModal, Button, CartSidebar, HeaderSearch, UserMenu } from "../components"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { formatPrice } from "../lib/format"
import { useI18n } from "../i18n/useI18n"

const navLinks = [
  { to: "/home", key: "nav.home" },
  { to: "/menu", key: "nav.menu" },
  { to: "/orders", key: "nav.orders" },
] as const

const Header = () => {
  const { t } = useI18n()
  const { user } = useAuth()
  const { count, subtotal } = useCart()
  const [scrolled, setScrolled] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-[background-color,backdrop-filter] duration-300 ${
        scrolled ? "bg-black/40 backdrop-blur-md" : ""
      }`}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
        <div className="flex items-center gap-6">
          <Link to="/home" aria-label={t("nav.logoAria")} className="shrink-0">
            <img src={WebsiteLogo} alt="Yumero" className="h-9 w-auto object-contain" />
          </Link>
          <AddressSelect />
        </div>

        <nav aria-label={t("nav.mainNav")}>
          <ul className="flex gap-5">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className="rounded-sm px-4 py-2 transition-colors duration-200 hover:text-white/80">
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4 justify-self-end">
          <HeaderSearch />
          {/* empty cart: just the icon; with items: count badge + total price. Guests can fill the cart too. */}
          <CartSidebar>
            <button
              type="button"
              aria-label={count > 0 ? t("nav.cartCountAria", { count }) : t("nav.cartEmptyAria")}
              className={`flex h-11 shrink-0 cursor-pointer items-center rounded-full bg-[#2b2a2a] text-white transition-colors hover:bg-[#3d3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                count > 0 ? "gap-3 pr-4 pl-1" : "w-11 justify-center"
              }`}
            >
              <span className="relative grid size-9 place-items-center">
                <ShoppingBag className="size-5" />
                {count > 0 && (
                  <span className="absolute top-0 right-0 grid size-5 place-items-center rounded-full bg-[#ff0099] text-[11px] font-bold leading-none ring-2 ring-[#2b2a2a]">
                    {count}
                  </span>
                )}
              </span>
              {count > 0 && <span className="font-semibold">{formatPrice(subtotal)}</span>}
            </button>
          </CartSidebar>
          {user ? (
            <UserMenu />
          ) : (
            <AuthModal>
              <Button extraClass="font-semibold">{t("nav.login")}</Button>
            </AuthModal>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
