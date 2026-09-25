import { Link, NavLink } from "react-router-dom"
import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { AddressSelect, AuthModal, Button, CartSidebar, HeaderSearch, UserMenu } from "../components"
import Wordmark from "../components/Wordmark"
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
      {/* phones/tablets: logo + address (icon only on phones) … search; cart, profile and the page links live in the
          bottom navigation bar. Desktop (lg+): logo+address | nav | search, cart, profile */}
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-0">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none lg:gap-6">
          {/* same 44px row height as the address select / cart button so the wordmark sits on their centre line */}
          <Link to="/home" aria-label={t("nav.logoAria")} className="flex h-11 shrink-0 items-center">
            {/* a notch smaller on 320px phones so everything fits on one row */}
            <Wordmark className="text-2xl min-[400px]:text-3xl" />
          </Link>
          {/* desktop: address next to the logo; below lg it moves to the right-hand icon group */}
          <div className="hidden lg:block">
            <AddressSelect />
          </div>
        </div>

        <nav aria-label={t("nav.mainNav")} className="hidden lg:block">
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

        <div className="flex shrink-0 items-center gap-3 sm:gap-4 lg:justify-self-end">
          <div className="lg:hidden">
            <AddressSelect align="end" />
          </div>
          <HeaderSearch />
          {/* desktop only (the bottom bar covers phones); the cart drawer itself is mounted here for every width */}
          <div className="hidden lg:contents">
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
      </div>
    </header>
  )
}

export default Header
