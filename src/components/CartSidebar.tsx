import { useEffect, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Trash2, X } from "lucide-react"
import type { cartItemType, orderType, productType } from "@/@types"
import { ProductBurgerSet } from "@/assets/images"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { useOrders } from "@/context/OrdersContext"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"
import { formatPrice } from "@/lib/format"
import { pickText } from "@/lib/localized"
import { formatOrderDate, orderItemCount } from "@/lib/orders"
import OrderStatusBadge from "./OrderStatusBadge"
import ProductModal from "./ProductModal"
import QuantityStepper from "./QuantityStepper"

type Tab = "cart" | "orders"

/** Top-right slot of a cart card: quantity badge that expands into − N + 🗑 on click. */
const CartQuantityControl = ({ item }: { item: cartItemType }) => {
  const { t } = useI18n()
  const { setQuantity, removeItem } = useCart()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open])

  return (
    <div ref={rootRef} className="absolute top-3 right-3">
      {open ? (
        <QuantityStepper
          value={item.quantity}
          onChange={(q) => setQuantity(item.product.id, q)}
          onRemove={() => removeItem(item.product.id)}
        />
      ) : (
        <button
          type="button"
          aria-label={t("cart.quantityAria", { count: item.quantity })}
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="grid size-12 cursor-pointer place-items-center rounded-lg border border-[#4a1236] bg-[#2b1424] text-lg font-bold text-[#ff4fb6] transition-colors hover:bg-[#4a1236]"
        >
          {item.quantity}
        </button>
      )}
    </div>
  )
}

const MAX_THUMBS = 4

/** Compact past-order card for the orders tab. */
const OrderCard = ({ order, onOpen }: { order: orderType; onOpen: () => void }) => {
  const { t, plural, tag } = useI18n()
  const extra = order.items.length - MAX_THUMBS
  return (
    <div className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] p-5">
      {/* the status badge drops under the number on narrow phones instead of breaking the number in two */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="text-lg font-semibold whitespace-nowrap">{t("order.number", { number: order.number })}</p>
          <p className="mt-0.5 text-sm text-[#c4c4c4]">{formatOrderDate(order.createdAt, tag)}</p>
        </div>
        <OrderStatusBadge order={order} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {order.items.slice(0, MAX_THUMBS).map((item, i) => (
          <img
            key={`${item.product.id}-${i}`}
            src={mediaUrl(item.product.imageUrl) ?? ProductBurgerSet}
            alt=""
            draggable={false}
            className="size-12 rounded-lg bg-[#e9e5d9] object-contain p-1"
          />
        ))}
        {extra > 0 && (
          <span className="grid size-12 place-items-center rounded-lg bg-[#2b2a2a] text-sm font-semibold text-[#c4c4c4]">+{extra}</span>
        )}
      </div>

      <p className="mt-4 text-base">
        {plural(orderItemCount(order), "order.items")} · {formatPrice(order.total)}
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 w-full cursor-pointer rounded-lg bg-[#4a1236] py-3 text-sm font-semibold text-[#ff4fb6] transition-colors hover:text-white"
      >
        {t("cart.details")}
      </button>
    </div>
  )
}

interface CartPanelProps {
  /** Heading element (Dialog title inside the drawer, h1 on the cart page). */
  title: ReactNode
  /** Extra header control, e.g. the drawer's close button. */
  headerExtra?: ReactNode
  /** `drawer`: lists scroll inside a fixed-height panel; `page`: the page scrolls and the checkout button sticks above the bottom bar. */
  layout: "drawer" | "page"
  /** Called right before navigating away (the drawer closes itself). */
  onNavigate?: () => void
}

/** Cart + orders tabs with the item cards and the checkout button; shared by the desktop drawer and the phone cart page. */
export const CartPanel = ({ title, headerExtra, layout, onNavigate }: CartPanelProps) => {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const { items, count, subtotal, clear } = useCart()
  const { orders } = useOrders()
  const { status } = useAuth()
  const authed = status === "authed"
  const [tab, setTab] = useState<Tab>("cart")
  const [selected, setSelected] = useState<productType | null>(null)

  const goToCheckout = () => {
    onNavigate?.()
    navigate("/checkout")
  }

  const goToOrder = (order: orderType) => {
    onNavigate?.()
    navigate(`/orders#${order.id}`)
  }

  const listClass = layout === "drawer" ? "mt-8 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2" : "mt-8 flex flex-col gap-4"

  return (
    <>
          <div className="flex items-center justify-between">
            {title}
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clear}
                  aria-label={t("cart.clear")}
                  title={t("cart.clear")}
                  className="grid size-10 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white transition-colors hover:bg-[#3d3c3c] hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Trash2 className="size-5" />
                </button>
              )}
              {headerExtra}
            </div>
          </div>

          <div role="tablist" aria-label={t("cart.sectionAria")} className="mt-5 grid grid-cols-2 rounded-full bg-[#4a4a4a] p-1">
            {(["cart", "orders"] as const).map((tb) => {
              const active = tb === tab
              return (
                <button
                  key={tb}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(tb)}
                  className={`cursor-pointer rounded-full py-2.5 text-base font-semibold text-white transition-colors duration-300 ${
                    active ? "bg-[#1f1f1f]" : "hover:bg-white/10"
                  }`}
                >
                  {tb === "cart" ? t("cart.tabCart") : t("cart.tabOrders")}
                </button>
              )
            })}
          </div>

          {tab === "cart" && (
            <div className={listClass}>
              {items.length === 0 && <p className="text-center text-[#c4c4c4]">{t("cart.empty")}</p>}

              {items.map((item) => (
                <div key={item.product.id} className="relative rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] p-5">
                  <CartQuantityControl item={item} />

                  <img
                    src={mediaUrl(item.product.imageUrl) ?? ProductBurgerSet}
                    alt={pickText(item.product.name, locale)}
                    draggable={false}
                    className="size-32 object-contain"
                  />

                  <p className="mt-5 text-lg font-semibold">{pickText(item.product.name, locale)}</p>
                  <p className="mt-1 text-base">
                    {t("cart.sum")}: {formatPrice(item.product.price * item.quantity)}
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelected(item.product)}
                    className="mt-5 w-full cursor-pointer rounded-lg bg-[#4a1236] py-3 text-sm font-semibold text-[#ff4fb6] transition-colors hover:text-white"
                  >
                    {t("cart.addMore")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "orders" && (
            <div className={listClass}>
              {orders.length === 0 && <p className="text-center text-[#c4c4c4]">{t("cart.noOrders")}</p>}

              {orders.map((order) => (
                <OrderCard key={order.id} order={order} onOpen={() => goToOrder(order)} />
              ))}
            </div>
          )}

          {tab === "cart" && items.length > 0 && (
            /* guests can fill the cart, but checkout needs an account: the button shows "Log in" and stays disabled.
               On the cart page the button sticks to the bottom of the screen, just above the bottom navigation bar. */
            <div className={layout === "page" ? "sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] mt-2 bg-background py-2" : "mt-4"}>
              <button
                type="button"
                onClick={goToCheckout}
                disabled={!authed}
                /* one line at every width: the count bubble only from sm, and the label can only ellipsize, never wrap */
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-[#ff0099] px-4 py-3.5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#ff2bab] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:bg-[#3a3939] disabled:text-[#8a8a8a] disabled:hover:bg-[#3a3939] sm:gap-4 sm:py-3 sm:pr-5 sm:pl-3 sm:text-base"
              >
                <span className={`hidden size-8 shrink-0 place-items-center rounded-full text-sm sm:grid ${authed ? "bg-black/60" : "bg-black/30"}`}>{count}</span>
                <span className="min-w-0 truncate">{authed ? t("cart.checkout") : t("nav.login")}</span>
                <span className="ml-auto shrink-0">{formatPrice(subtotal)}</span>
              </button>
            </div>
          )}

          <ProductModal product={selected} onClose={() => setSelected(null)} />
    </>
  )
}

/** Right-hand drawer with the current order (desktop; phones open the /cart page instead). */
const CartSidebar = ({ children }: { children: ReactNode }) => {
  const { t } = useI18n()
  const { sidebarOpen: open, setSidebarOpen: setOpen } = useCart()

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {children ? <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger> : null}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-115 max-w-[95vw] flex-col bg-[#1c1c1c] p-6 text-white shadow-2xl outline-none duration-300 ease-out data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right"
        >
          <CartPanel
            layout="drawer"
            onNavigate={() => setOpen(false)}
            title={<DialogPrimitive.Title className="text-2xl font-semibold">{t("cart.title")}</DialogPrimitive.Title>}
            headerExtra={
              <DialogPrimitive.Close
                aria-label={t("common.close")}
                className="grid size-10 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white transition-colors hover:bg-[#3d3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X className="size-5" />
              </DialogPrimitive.Close>
            }
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default CartSidebar
