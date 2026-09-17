import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"

const HeaderSearch = () => {
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

  return (
    <div
      ref={rootRef}
      className={`relative flex h-11 items-center overflow-hidden rounded-full bg-[#2b2a2a] transition-[width] duration-300 ease-out ${
        open ? "w-80" : "w-11"
      }`}
    >
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Поиск в Yumero"
        aria-label="Поиск"
        tabIndex={open ? 0 : -1}
        className={`h-full w-full bg-transparent pl-5 pr-11 text-[#c4c4c4] outline-none transition-opacity duration-200 placeholder:text-[#8a8a8a] ${
          open ? "opacity-100 delay-100" : "pointer-events-none opacity-0"
        }`}
      />

      <button
        type="button"
        aria-label={open ? "Закрыть поиск" : "Поиск"}
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
    </div>
  )
}

export default HeaderSearch
