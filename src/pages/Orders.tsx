import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Banknote, ChevronDown, CreditCard, LogIn, MapPin, MessageSquare, ShoppingBag, Store, Truck, XCircle } from "lucide-react"
import type { orderType } from "@/@types"
import { ProductBurgerSet } from "@/assets/images"
import { useAuth } from "@/context/AuthContext"
import { useOrders } from "@/context/OrdersContext"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import { formatPrice } from "@/lib/format"
import { pickText } from "@/lib/localized"
import { canCancelOrder, formatOrderDate, orderItemCount } from "@/lib/orders"
import { AuthModal, Button, OrderStatusBadge } from "@/components"
import { Skeleton } from "@/components/ui/skeleton"

const metaRowClass = "flex items-center gap-3 text-base text-[#c4c4c4]"

/** Two-step cancel: the first click asks for confirmation instead of cancelling straight away. */
const CancelOrderButton = ({ onCancel }: { onCancel: () => Promise<void> }) => {
  const { t } = useI18n()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try {
      await onCancel()
    } catch (err) {
      setError(t(errorKey(err)))
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      /* phones: question on top, the two buttons share a row below it */
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-base text-[#c4c4c4]">{t("orders.cancelConfirm")}</p>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="cursor-pointer rounded-xl bg-[#2b2a2a] px-3 py-3 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#3a3939] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:px-5 sm:text-base"
          >
            {t("orders.cancelNo")}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="cursor-pointer rounded-xl bg-[#ee4242] px-3 py-3 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#e74d4da4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60 sm:px-5 sm:text-base"
          >
            {t("orders.cancelYes")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ee4242] py-3.5 font-semibold text-white transition-colors hover:bg-[#e74d4da4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <XCircle className="size-5" />
        {t("orders.cancel")}
      </button>
      {error && <p className="mt-2 text-sm text-[#ff9b9b]">{error}</p>}
    </>
  )
}

const OrderCard = ({ order, open, onToggle, onCancel }: { order: orderType; open: boolean; onToggle: () => void; onCancel: () => Promise<void> }) => {
  const { t, plural, tag, locale } = useI18n()
  const isDelivery = order.mode === "delivery"

  return (
    <li id={`order-${order.id}`} className="scroll-mt-28 rounded-3xl bg-[#1c1c1c]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`order-${order.id}-details`}
        className="flex w-full cursor-pointer items-center gap-4 rounded-3xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:gap-5 sm:p-8"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#2b2a2a] sm:size-14">
          {isDelivery ? <Truck className="size-6" /> : <Store className="size-6" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-lg font-semibold sm:text-xl">{t("order.number", { number: order.number })}</span>
            <OrderStatusBadge order={order} />
          </span>
          <span className="mt-1 block text-[#c4c4c4]">
            {formatOrderDate(order.createdAt, tag)} · {plural(orderItemCount(order), "order.items")} · {formatPrice(order.total)}
          </span>
        </span>
        <ChevronDown className={`size-6 shrink-0 text-[#8a8a8a] transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={`order-${order.id}-details`} className="border-t border-[#3a3a3a] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4">
            <p className={metaRowClass}>
              <MapPin className="size-5 shrink-0" />
              <span className="min-w-0 truncate">
                <span className="font-semibold text-white">{isDelivery ? t("order.delivery") : t("order.pickup")}</span>
                {" · "}
                {order.address}
              </span>
            </p>
            <p className={metaRowClass}>
              {order.payment === "cash" ? <Banknote className="size-5 shrink-0" /> : <CreditCard className="size-5 shrink-0" />}
              <span>
                <span className="font-semibold text-white">{t("order.payment")}</span>
                {" · "}
                {order.payment === "cash" ? t("order.cash") : t("order.card")}
              </span>
            </p>
            {order.comment && (
              <p className={metaRowClass}>
                <MessageSquare className="size-5 shrink-0" />
                <span className="min-w-0 truncate">{order.comment}</span>
              </p>
            )}
          </div>

          <ul className="mt-6 divide-y divide-[#3a3a3a]">
            {order.items.map((item, i) => (
              <li key={`${item.product.id}-${i}`} className="flex items-center gap-4 py-3">
                <img src={mediaUrl(item.product.imageUrl) ?? ProductBurgerSet} alt="" draggable={false} className="size-14 rounded-lg bg-[#e9e5d9] object-contain p-1" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{pickText(item.product.name, locale)}</p>
                  <p className="text-sm text-[#c4c4c4]">
                    {item.quantity} × {formatPrice(item.product.price)}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(item.product.price * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-3 flex flex-col gap-2 border-t border-[#3a3a3a] pt-5 text-base">
            <div className="flex justify-between">
              <dt className="text-[#e6e6e6]">{t("order.subtotal")}</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#e6e6e6]">{t("order.packaging")}</dt>
              <dd>{formatPrice(order.packaging)}</dd>
            </div>
            {isDelivery && (
              <div className="flex justify-between">
                <dt className="text-[#e6e6e6]">{t("order.deliveryFee")}</dt>
                <dd className="text-[#77FF00]">{formatPrice(order.delivery)}</dd>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#e6e6e6]">
                  {t("order.discount")}
                  {order.promoCode ? ` (${order.promoCode})` : ""}
                </dt>
                <dd className="text-[#77FF00]">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="mt-2 flex justify-between text-lg font-semibold">
              <dt>{t("order.total")}</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>

          {canCancelOrder(order) && <CancelOrderButton onCancel={onCancel} />}
        </div>
      )}
    </li>
  )
}

const Orders = () => {
  const { t, plural } = useI18n()
  const { user, status } = useAuth()
  const { orders, isLoading, cancelOrder } = useOrders()
  const { hash } = useLocation()
  // Expanded by default: the order from the URL hash (sidebar "details" button), otherwise the latest one.
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  const hashId = hash.slice(1)
  const isOpen = (order: orderType) => toggled[order.id] ?? (hashId ? order.id === hashId : order.id === orders[0]?.id)

  // Bring a deep-linked order into view (the newest one is already at the top under the title)
  const firstId = orders[0]?.id
  useEffect(() => {
    if (hashId && hashId !== firstId) document.getElementById(`order-${hashId}`)?.scrollIntoView({ block: "start" })
  }, [hashId, firstId])

  if (status === "loading") return <section className="min-h-screen py-30" />

  // Guest: explain why there is nothing to show; the button opens the login modal
  if (!user) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 pt-24 pb-16 sm:py-30">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-[#1c1c1c] px-6 py-10 text-center sm:px-10 sm:py-12">
          <span className="grid size-16 place-items-center rounded-full bg-[#2b2a2a]">
            <LogIn className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold">{t("orders.loginTitle")}</h1>
          <p className="text-[#c4c4c4]">{t("orders.loginHint")}</p>
          <AuthModal>
            <Button extraClass="mt-2 justify-center px-8 py-3 font-semibold">{t("nav.login")}</Button>
          </AuthModal>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen pt-24 pb-16 sm:py-30">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-semibold">{t("orders.title")}</h1>
        <p className="mt-1 text-[#c4c4c4]">{orders.length > 0 ? plural(orders.length, "order.orders") : t("orders.history")}</p>

        {isLoading && orders.length === 0 ? (
          <div className="mt-8 flex flex-col gap-4">
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-28 rounded-3xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-[#1c1c1c] px-6 py-12 text-center sm:px-10 sm:py-16">
            <span className="grid size-20 place-items-center rounded-full bg-[#2b2a2a]">
              <ShoppingBag className="size-9 text-[#c4c4c4]" />
            </span>
            <h2 className="text-2xl font-semibold">{t("orders.empty")}</h2>
            <p className="text-[#c4c4c4]">{t("orders.emptyHint")}</p>
            <Link to="/menu" className="mt-2 rounded-xl bg-[#ff0099] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#ff2bab]">
              {t("orders.goToMenu")}
            </Link>
          </div>
        ) : (
          <ul className="mt-8 flex flex-col gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                open={isOpen(order)}
                onToggle={() => setToggled((prev) => ({ ...prev, [order.id]: !isOpen(order) }))}
                onCancel={() => cancelOrder(order.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default Orders
