/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { cartItemType, productType } from "@/@types"
import { apiFetch } from "@/lib/api"
import { useAuth } from "./AuthContext"

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
/** Guest cart (the logged-in cart lives on the server) */
const GUEST_KEY = "cart:v2"
/** Offline copy of the logged-in user's server cart: { userId, items } */
const USER_KEY = "cart:user"
/** Same per-line cap as the server and the stepper */
const MAX_QUANTITY = 50
/** Local edits are sent this long after the last one (a burst of clicks = one request) */
const PUSH_DELAY = 400
/** Picks up changes made on the user's other devices while the tab is open */
const POLL_MS = 30_000

interface CartResponse {
  items: cartItemType[]
}
interface StoredUserCart {
  userId: string
  items: cartItemType[]
}

const isCartItem = (v: unknown): v is cartItemType => {
  const item = v as cartItemType
  return (
    typeof item?.quantity === "number" &&
    typeof item.product?.id === "number" &&
    typeof item.product.price === "number" &&
    typeof item.product.name === "object"
  )
}
const isCart = (v: unknown): v is cartItemType[] => Array.isArray(v) && v.every(isCartItem)

const readStored = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
const store = (key: string, value: unknown) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable – in-memory only
  }
}

const readGuestCart = (): cartItemType[] => {
  const v = readStored(GUEST_KEY)
  return Array.isArray(v) ? v.filter(isCartItem) : []
}
const readUserCart = (): StoredUserCart | null => {
  const v = readStored(USER_KEY) as StoredUserCart | null
  return typeof v?.userId === "string" && isCart(v.items) ? v : null
}

const toLines = (items: cartItemType[]) => items.map((i) => ({ productId: i.product.id, quantity: i.quantity }))
const clamp = (q: number) => Math.min(q, MAX_QUANTITY)
const visible = () => document.visibilityState === "visible"

const CartContext = createContext<CartContextValue | null>(null)

/**
 * Guests keep their cart in localStorage. Logged in, the cart lives on the server (`/api/cart`) and is shared by every
 * device of the account (this site and the app): edits apply at once, are sent shortly after, and the server copy is
 * pulled on login, when the tab regains focus and every 30 s. A guest cart is merged into the account's cart on login.
 */
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, status } = useAuth()
  const userId = status === "authed" ? (user?.id ?? null) : null
  // first paint: the guest cart, or (while the session is being restored) the last copy of the account's cart
  const [items, setItems] = useState<cartItemType[]>(() => (status === "guest" ? readGuestCart() : (readUserCart()?.items ?? [])))
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // sync bookkeeping, never rendered
  const itemsRef = useRef(items)
  /** Whose cart `items` is: a user id, null for the guest cart, undefined before the first decision */
  const owner = useRef<string | null | undefined>(undefined)
  /** Local edit counter and the last edit the server has confirmed: they differ while there is something to send */
  const edits = useRef(0)
  const pushed = useRef(0)
  const inFlight = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const apply = useCallback((next: cartItemType[]) => {
    itemsRef.current = next
    setItems(next)
    const uid = owner.current
    if (uid) store(USER_KEY, { userId: uid, items: next } satisfies StoredUserCart)
    else if (uid === null) store(GUEST_KEY, next)
  }, [])

  const push = useCallback(async () => {
    const uid = owner.current
    if (!uid || inFlight.current) return
    inFlight.current = true
    try {
      // edits made while a request is out go in the next round
      while (owner.current === uid && pushed.current !== edits.current) {
        const sent = edits.current
        const cart = await apiFetch<CartResponse>("/api/cart", { method: "PUT", body: { items: toLines(itemsRef.current) } })
        if (owner.current !== uid) return
        pushed.current = sent
        // the server copy carries current prices and names; take it only if nothing changed in the meantime
        if (edits.current === sent) apply(cart.items)
      }
    } catch {
      // stays unsent: retried on the next edit, focus or poll
    } finally {
      inFlight.current = false
    }
  }, [apply])

  const pull = useCallback(async () => {
    const uid = owner.current
    if (!uid || inFlight.current) return
    // unsent local edits win: send them instead
    if (pushed.current !== edits.current) return void push()
    const started = edits.current
    try {
      const cart = await apiFetch<CartResponse>("/api/cart")
      if (owner.current === uid && edits.current === started && !inFlight.current) apply(cart.items)
    } catch {
      // offline: keep the local copy
    }
  }, [apply, push])

  // Whose cart is shown follows the session: guest cart, or the account's cart (+ a one-time merge of the guest cart).
  useEffect(() => {
    if (status === "loading") return
    const previous = owner.current
    if (previous === userId) return
    owner.current = userId
    edits.current = 0
    pushed.current = 0
    if (timer.current) clearTimeout(timer.current)

    if (!userId) {
      // after a logout the account's cart stays on the server, not in this browser
      if (previous) store(USER_KEY, null)
      apply(previous ? [] : readGuestCart())
      return
    }

    const cached = readUserCart()
    const guestCart = readGuestCart()
    apply(cached?.userId === userId ? cached.items : [])
    // no cleanup flag: the owner check drops a stale answer, and StrictMode's second run must not cancel the first
    ;(async () => {
      try {
        const cart = guestCart.length
          ? await apiFetch<CartResponse>("/api/cart/merge", { method: "POST", body: { items: toLines(guestCart) } })
          : await apiFetch<CartResponse>("/api/cart")
        if (guestCart.length) store(GUEST_KEY, null)
        if (owner.current !== userId) return
        if (edits.current === 0) apply(cart.items)
        else void push()
      } catch {
        // offline: the cached copy stays; the next focus / poll syncs
      }
    })()
  }, [status, userId, apply, push])

  // other devices' changes: pull when the tab comes back and every 30 s while it is visible
  useEffect(() => {
    if (!userId) return
    const onVisible = () => {
      if (visible()) void pull()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    const id = window.setInterval(onVisible, POLL_MS)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
      window.clearInterval(id)
    }
  }, [userId, pull])

  const update = useCallback(
    (fn: (prev: cartItemType[]) => cartItemType[]) => {
      apply(fn(itemsRef.current))
      if (!owner.current) return
      edits.current += 1
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => void push(), PUSH_DELAY)
    },
    [apply, push]
  )

  const addItem = useCallback(
    (product: productType, quantity: number) =>
      update((prev) => {
        const existing = prev.find((i) => i.product.id === product.id)
        if (!existing) return [...prev, { product, quantity: clamp(quantity) }]
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: clamp(i.quantity + quantity) } : i))
      }),
    [update]
  )

  const setQuantity = useCallback(
    (productId: number, quantity: number) =>
      update((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.product.id !== productId)
          : prev.map((i) => (i.product.id === productId ? { ...i, quantity: clamp(quantity) } : i))
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
