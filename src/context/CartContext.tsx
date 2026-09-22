/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import type { cartItemType, productType } from "@/@types"

interface CartContextValue {
  items: cartItemType[]
  /** Total number of units across all lines */
  count: number
  /** Σ price × quantity */
  subtotal: number
  addItem: (product: productType, quantity: number) => void
  /** quantity ≤ 0 removes the line */
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clear: () => void
  /** Quantity of one product in the cart (0 if absent) */
  quantityOf: (productId: number) => number
  /** Cart drawer visibility, so any screen (e.g. the product modal) can open it */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

// v2: products carry API ids, numeric prices and localized names; older carts are discarded
const STORAGE_KEY = "cart:v2"

const isCartItem = (v: unknown): v is cartItemType => {
  const item = v as cartItemType
  return (
    typeof item?.quantity === "number" &&
    typeof item.product?.id === "number" &&
    typeof item.product.price === "number" &&
    typeof item.product.name === "object"
  )
}

const read = (): cartItemType[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : []
  } catch {
    return []
  }
}

const persist = (items: cartItemType[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage unavailable – in-memory only
  }
}

const CartContext = createContext<CartContextValue | null>(null)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<cartItemType[]>(read)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const update = useCallback((fn: (prev: cartItemType[]) => cartItemType[]) => {
    setItems((prev) => {
      const next = fn(prev)
      persist(next)
      return next
    })
  }, [])

  const addItem = useCallback(
    (product: productType, quantity: number) =>
      update((prev) => {
        const existing = prev.find((i) => i.product.id === product.id)
        if (!existing) return [...prev, { product, quantity }]
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i))
      }),
    [update]
  )

  const setQuantity = useCallback(
    (productId: number, quantity: number) =>
      update((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.product.id !== productId)
          : prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      ),
    [update]
  )

  const removeItem = useCallback((productId: number) => update((prev) => prev.filter((i) => i.product.id !== productId)), [update])

  const clear = useCallback(() => update(() => []), [update])

  const quantityOf = useCallback((productId: number) => items.find((i) => i.product.id === productId)?.quantity ?? 0, [items])

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
    }),
    [items]
  )

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, addItem, setQuantity, removeItem, clear, quantityOf, sidebarOpen, setSidebarOpen }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>")
  return ctx
}
