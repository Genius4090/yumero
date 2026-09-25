import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react"
import { useSearchParams } from "react-router-dom"
import type { productType } from "@/@types"
import { useCategories, useProducts } from "@/api/hooks"
import { FoodCard, ProductModal, SearchBar } from "@/components"
import { Skeleton } from "@/components/ui/skeleton"
import { ALL_TAB_ID, POPULAR_TAB_ID, readMenuTab, saveMenuTab } from "@/data/categories"
import { useI18n } from "@/i18n/useI18n"
import { pickText } from "@/lib/localized"

const useDebounced = <T,>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

const Menu = () => {
  const { t, locale } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeId, setActiveId] = useState<number>(readMenuTab)
  const urlQuery = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(urlQuery)
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery)
  const [selected, setSelected] = useState<productType | null>(null)

  // Header search navigates to /menu?q=…; adopt the URL query whenever it changes
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery)
    if (urlQuery) setQuery(urlQuery)
  }

  const search = useDebounced(query.trim(), 300)
  const searching = search.length > 0

  const categories = useCategories()
  const showAll = activeId === ALL_TAB_ID
  const products = useProducts(
    searching ? { search } : activeId === POPULAR_TAB_ID ? { popular: true } : showAll ? {} : { categoryId: activeId }
  )

  const tabs = useMemo(
    () => [
      { id: POPULAR_TAB_ID, name: t("categories.popular") },
      { id: ALL_TAB_ID, name: t("categories.all") },
      ...(categories.data ?? []).map((c) => ({ id: c.id, name: pickText(c.name, locale) })),
    ],
    [categories.data, t, locale]
  )
  const active = tabs.find((c) => c.id === activeId) ?? tabs[0]

  // On phones the tab row scrolls sideways: keep the active tab in view (no-op when the row wraps on desktop)
  const tabsRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const row = tabsRef.current
    if (!row || row.scrollWidth <= row.clientWidth) return
    row.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ inline: "center", block: "nearest" })
  }, [activeId, searching, tabs])

  // Fingers scroll the row natively; this adds click-and-drag for a mouse (desktop browsers at narrow widths).
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const swallowClick = useRef(false)
  const onTabsPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false }
  }
  const onTabsPointerMove = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 4) d.moved = true
    e.currentTarget.scrollLeft = d.left - dx
  }
  const onTabsPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    // the click that follows a drag must not select a tab
    swallowClick.current = true
    window.setTimeout(() => {
      swallowClick.current = false
    }, 0)
  }
  const onTabsClickCapture = (e: MouseEvent<HTMLUListElement>) => {
    if (!swallowClick.current) return
    e.preventDefault()
    e.stopPropagation()
  }

  // "All": one section per category (in the categories' own order), each with its heading
  const sections = useMemo(() => {
    const items = products.data?.items ?? []
    if (!showAll || searching) return []
    return (categories.data ?? [])
      .map((c) => ({ id: c.id, name: pickText(c.name, locale), items: items.filter((p) => p.categoryId === c.id) }))
      .filter((s) => s.items.length > 0)
  }, [products.data, categories.data, showAll, searching, locale])

  const selectTab = (id: number) => {
    setActiveId(id)
    setQuery("")
    if (searchParams.has("q")) setSearchParams({}, { replace: true })
    saveMenuTab(id)
  }

  const items = products.data?.items ?? []

  return (
    <section className="pt-24 pb-16 sm:py-30">
      {/* phones: one sideways-scrolling row (swipe or drag; a fade on the right hints at more tabs); from md the tabs wrap and centre as before */}
      <div className="relative border-t border-b border-[#333333] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-12 after:bg-linear-to-l after:from-background after:to-transparent md:after:hidden">
        <ul
          ref={tabsRef}
          onPointerDown={onTabsPointerDown}
          onPointerMove={onTabsPointerMove}
          onPointerUp={onTabsPointerUp}
          onPointerLeave={onTabsPointerUp}
          onClickCapture={onTabsClickCapture}
          className="no-scrollbar flex cursor-grab gap-2 overflow-x-auto px-4 py-4 select-none active:cursor-grabbing sm:gap-3 md:flex-wrap md:justify-center md:px-6 md:cursor-auto"
        >
        {tabs.map((item) => (
          <li key={item.id} className="shrink-0">
            <button
              type="button"
              onClick={() => selectTab(item.id)}
              aria-pressed={item.id === activeId && !searching}
              className={`cursor-pointer rounded-lg border px-2 py-1 tracking-wider whitespace-nowrap transition-colors ${
                item.id === activeId && !searching ? "border-[#77FF00]" : "border-transparent hover:text-white/80"
              }`}
            >
              {item.name}
            </button>
          </li>
        ))}
        </ul>
      </div>

      <div className="containers">
        <div className="flex w-full justify-between">
          <SearchBar value={query} onChange={setQuery} extraClass="sm:max-w-75" />
        </div>

        {/* "All" has a heading per category instead of one page title */}
        {showAll && !searching ? (
          <div className="mt-10" />
        ) : (
          <h2 className="mt-10 mb-6 text-2xl font-semibold">{searching ? `${t("common.search")}: ${search}` : active.name}</h2>
        )}

        {products.isError ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-[#1c1c1c] p-6">
            <p className="text-[#c4c4c4]">{t("menu.loadError")}</p>
            <button type="button" onClick={() => products.refetch()} className="cursor-pointer rounded-lg bg-[#ff0099] px-4 py-2 text-sm font-semibold">
              {t("menu.retry")}
            </button>
          </div>
        ) : products.isPending ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i}>
                <Skeleton className="aspect-[1/0.93] w-full rounded-xl" />
                <Skeleton className="mt-2 h-14 w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="rounded-2xl bg-[#1c1c1c] p-6 text-[#c4c4c4]">{searching ? t("menu.nothingFound", { query: search }) : t("menu.empty")}</p>
        ) : showAll && !searching ? (
          <div className={`flex flex-col gap-12 transition-opacity ${products.isFetching ? "opacity-70" : ""}`}>
            {sections.map((section) => (
              <section key={section.id} aria-labelledby={`menu-section-${section.id}`}>
                <h3 id={`menu-section-${section.id}`} className="mb-6 text-2xl font-semibold">
                  {section.name}
                </h3>
                <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <FoodCard product={item} onClick={setSelected} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className={`grid grid-cols-2 gap-3 transition-opacity sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 ${products.isFetching ? "opacity-70" : ""}`}>
            {items.map((item) => (
              <li key={item.id}>
                <FoodCard product={item} onClick={setSelected} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </section>
  )
}

export default Menu
