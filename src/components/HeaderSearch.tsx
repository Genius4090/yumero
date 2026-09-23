import { useEffect, useRef, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X } from "lucide-react"
import { useI18n } from "@/i18n/useI18n"

/** Expanding search pill in the header; submitting opens the menu filtered by the query. */
const HeaderSearch = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()

    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/menu?q=${encodeURIComponent(q)}` : "/menu")
    setOpen(false)
    setQuery("")
  }

  return (
    <form
      ref={rootRef as unknown as React.RefObject<HTMLFormElement>}
      onSubmit={submit}
      role="search"
      // phones (< md): the open field takes over the whole header row instead of squeezing between the icons
      className={`relative flex h-11 items-center overflow-hidden rounded-full bg-[#2b2a2a] transition-[width] duration-300 ease-out ${
        open ? "z-10 w-80 max-md:fixed max-md:inset-x-4 max-md:top-4 max-md:w-auto" : "w-11"
      }`}
    >
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={t("nav.searchPlaceholder")}
        aria-label={t("common.search")}
        tabIndex={open ? 0 : -1}
        className={`h-full w-full bg-transparent pl-5 pr-11 text-[#c4c4c4] outline-none transition-opacity duration-200 placeholder:text-[#8a8a8a] [&::-webkit-search-cancel-button]:hidden ${
          open ? "opacity-100 delay-100" : "pointer-events-none opacity-0"
        }`}
      />

      <button
        type="button"
        aria-label={open ? t("nav.closeSearch") : t("common.search")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="absolute top-0 right-0 grid size-11 cursor-pointer place-items-center text-white focus-visible:outline-none"
      >
        <Search
          className={`col-start-1 row-start-1 size-5 transition-all duration-300 ${
            open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <X
          className={`col-start-1 row-start-1 size-5 transition-all duration-300 ${
            open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
          }`}
        />
      </button>
    </form>
  )
}

export default HeaderSearch
