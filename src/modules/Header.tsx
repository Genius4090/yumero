import { Link, NavLink } from "react-router-dom"
import { useEffect, useState } from "react"
import { WebsiteLogo } from "../assets/images"
import { AddressSelect, AuthModal, Button, HeaderSearch } from "../components"

const navLinks = [
  { to: "/home", label: "Главная" },
  { to: "/menu", label: "Меню" },
  { to: "/contact", label: "Контакты" },
]

const Header = () => {
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
          <Link to="/home" aria-label="Yumero — на главную" className="shrink-0">
            <img src={WebsiteLogo} alt="Yumero" className="h-9 w-auto object-contain" />
          </Link>
          <AddressSelect />
        </div>

        <nav aria-label="Основная навигация">
          <ul className="flex gap-5">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className="rounded-sm px-4 py-2 transition-colors duration-200 hover:text-white/80">
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4 justify-self-end">
          <HeaderSearch />
          <AuthModal>
            <Button extraClass="font-semibold">Войти</Button>
          </AuthModal>
        </div>
      </div>
    </header>
  )
}

export default Header
