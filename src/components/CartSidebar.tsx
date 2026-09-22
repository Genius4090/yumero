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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold">{t("order.number", { number: order.number })}</p>
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

/** Right-hand drawer with the current order. */
const CartSidebar = ({ children }: { children: ReactNode }) => {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const { items, count, subtotal, clear, sidebarOpen: open, setSidebarOpen: setOpen } = useCart()
  const { orders } = useOrders()
  const { status } = useAuth()
  const authed = status === "authed"
  const [tab, setTab] = useState<Tab>("cart")
  const [selected, setSelected] = useState<productType | null>(null)

  const goToCheckout = () => {
    setOpen(false)
    navigate("/checkout")
  }

  const goToOrder = (order: orderType) => {
    setOpen(false)
    navigate(`/orders#${order.id}`)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {children ? <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger> : null}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-115 max-w-[95vw] flex-col bg-[#1c1c1c] p-6 text-white shadow-2xl outline-none duration-300 ease-out data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right"
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-2xl font-semibold">{t("cart.title")}</DialogPrimitive.Title>
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
              <DialogPrimitive.Close
                aria-label={t("common.close")}
                className="grid size-10 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white transition-colors hover:bg-[#3d3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X className="size-5" />
              </DialogPrimitive.Close>
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
            <div className="mt-8 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
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
            <div className="mt-8 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
              {orders.length === 0 && <p className="text-center text-[#c4c4c4]">{t("cart.noOrders")}</p>}

              {orders.map((order) => (
                <OrderCard key={order.id} order={order} onOpen={() => goToOrder(order)} />
              ))}
            </div>
          )}

          {tab === "cart" && items.length > 0 && (
            /* guests can fill the cart, but checkout needs an account: the button shows "Log in" and stays disabled */
            <button
              type="button"
              onClick={goToCheckout}
              disabled={!authed}
              className="mt-4 flex w-full cursor-pointer items-center gap-4 rounded-xl bg-[#ff0099] py-3 pr-5 pl-3 font-semibold text-white transition-colors hover:bg-[#ff2bab] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:bg-[#3a3939] disabled:text-[#8a8a8a] disabled:hover:bg-[#3a3939]"
            >
              <span className={`grid size-8 place-items-center rounded-full text-sm ${authed ? "bg-black/60" : "bg-black/30"}`}>{count}</span>
              <span>{authed ? t("cart.checkout") : t("nav.login")}</span>
              <span className="ml-auto">{formatPrice(subtotal)}</span>
            </button>
          )}

          <ProductModal product={selected} onClose={() => setSelected(null)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default CartSidebar
