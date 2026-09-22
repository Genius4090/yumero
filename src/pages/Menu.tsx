import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import type { productType } from "@/@types"
import { useCategories, useProducts } from "@/api/hooks"
import { FoodCard, ProductModal, SearchBar } from "@/components"
import { Skeleton } from "@/components/ui/skeleton"
import { MENU_TAB_KEY, POPULAR_TAB_ID } from "@/data/categories"
import { useI18n } from "@/i18n/useI18n"
import { pickText } from "@/lib/localized"

const readStoredTab = () => {
  try {
    return Number(localStorage.getItem(MENU_TAB_KEY)) || POPULAR_TAB_ID
  } catch {
    return POPULAR_TAB_ID
  }
}

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
  const [activeId, setActiveId] = useState<number>(readStoredTab)
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
  const products = useProducts(
    searching ? { search } : activeId === POPULAR_TAB_ID ? { popular: true } : { categoryId: activeId }
  )

  const tabs = useMemo(
    () => [{ id: POPULAR_TAB_ID, name: t("categories.popular") }, ...(categories.data ?? []).map((c) => ({ id: c.id, name: pickText(c.name, locale) }))],
    [categories.data, t, locale]
  )
  const active = tabs.find((c) => c.id === activeId) ?? tabs[0]

  const selectTab = (id: number) => {
    setActiveId(id)
    setQuery("")
    if (searchParams.has("q")) setSearchParams({}, { replace: true })
    try {
      localStorage.setItem(MENU_TAB_KEY, String(id))
    } catch {
      // ignore
    }
  }

  const items = products.data?.items ?? []

  return (
    <section className="py-30">
      <ul className="flex flex-wrap justify-center gap-3 border-t border-b border-[#333333] py-4">
        {tabs.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => selectTab(item.id)}
              aria-pressed={item.id === activeId && !searching}
              className={`cursor-pointer rounded-lg border px-2 py-1 tracking-wider transition-colors ${
                item.id === activeId && !searching ? "border-[#77FF00]" : "border-transparent hover:text-white/80"
              }`}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>

      <div className="containers">
        <div className="flex w-full justify-between">
          <SearchBar value={query} onChange={setQuery} extraClass="w-[300px]!" />
        </div>

        <h2 className="mt-10 mb-6 text-2xl font-semibold">{searching ? `${t("common.search")}: ${search}` : active.name}</h2>

        {products.isError ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-[#1c1c1c] p-6">
            <p className="text-[#c4c4c4]">{t("menu.loadError")}</p>
            <button type="button" onClick={() => products.refetch()} className="cursor-pointer rounded-lg bg-[#ff0099] px-4 py-2 text-sm font-semibold">
              {t("menu.retry")}
            </button>
          </div>
        ) : products.isPending ? (
          <ul className="grid grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <li key={i}>
                <Skeleton className="aspect-[1/0.93] w-full rounded-xl" />
                <Skeleton className="mt-2 h-14 w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="rounded-2xl bg-[#1c1c1c] p-6 text-[#c4c4c4]">{searching ? t("menu.nothingFound", { query: search }) : t("menu.empty")}</p>
        ) : (
          <ul className={`grid grid-cols-4 gap-6 transition-opacity ${products.isFetching ? "opacity-70" : ""}`}>
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
