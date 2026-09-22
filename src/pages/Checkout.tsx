import { useState, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"
import { Banknote, Check, CircleCheck, CreditCard, LogIn, Map, MapPin, MessageSquare, Plus } from "lucide-react"
import type { orderModeType as Mode, orderPaymentType as Payment, orderType } from "@/@types"
import { ProductBurgerSet } from "@/assets/images"
import { useCreateOrder, useSettings, useValidatePromo, type PromoResult } from "@/api/hooks"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { useAddresses } from "@/hooks/useAddresses"
import { useI18n } from "@/i18n/useI18n"
import { isApiError, mediaUrl } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import { formatPrice } from "@/lib/format"
import { pickText } from "@/lib/localized"
import { DEFAULT_SETTINGS, distanceKm } from "@/data/restaurant"
import { AddressSelect, AuthModal, Button, QuantityStepper, RestaurantMap } from "@/components"

const fieldClass =
  "w-full bg-transparent text-base text-white outline-none placeholder:text-[#8a8a8a]"
const cardClass = "rounded-2xl border border-[#3a3a3a] bg-[#1c1c1c]"
const rowClass = "flex items-center gap-4 px-5 py-4"
const inputClass =
  "rounded-lg bg-[#2b2a2a] px-4 py-3 text-base text-white outline-none placeholder:text-[#7a7a7a] focus:ring-2 focus:ring-white/40"

const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ")
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

const formatSavedAddress = (a: { title: string; address: string; house: string }) =>
  [a.title, [a.address, a.house].filter(Boolean).join(", ")].filter(Boolean).join(" — ")

const Checkout = () => {
  const { t, locale } = useI18n()
  const { status } = useAuth()
  const { items, subtotal, setQuantity, removeItem, clear } = useCart()
  const { selected } = useAddresses()
  const { data: settingsData } = useSettings()
  const settings = settingsData ?? DEFAULT_SETTINGS
  const validatePromo = useValidatePromo()
  const createOrder = useCreateOrder()

  const [mode, setMode] = useState<Mode>("delivery")
  // The address field shows the saved address unless the user edited it for this same saved address;
  // picking another saved address (different id) refills it automatically.
  const [addressEdit, setAddressEdit] = useState<{ forId: string | null; value: string } | null>(null)
  const savedText = selected ? formatSavedAddress(selected) : ""
  const address = addressEdit && addressEdit.forId === (selected?.id ?? null) ? addressEdit.value : savedText
  const setAddress = (value: string) => setAddressEdit({ forId: selected?.id ?? null, value })
  const [comment, setComment] = useState("")
  const [payment, setPayment] = useState<Payment>("cash")
  // Card details stay in the browser only (UI mock); they are never sent to the API.
  const [card, setCard] = useState({ number: "", holder: "", expiry: "", cvc: "" })
  const [promoInput, setPromoInput] = useState("")
  const [promo, setPromo] = useState<PromoResult | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [done, setDone] = useState<orderType | null>(null)

  if (done) {
    return (
      <section className="flex min-h-screen items-center justify-center py-30">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl bg-[#1c1c1c] px-10 py-12 text-center">
          <CircleCheck className="size-16 text-[#77FF00]" />
          <h1 className="text-3xl font-semibold">{t("checkout.done.title", { number: done.number })}</h1>
          <p className="text-[#c4c4c4]">{t("checkout.done.text")}</p>
          <div className="mt-4 flex gap-3">
            <Link to={`/orders#${done.id}`} className="rounded-xl bg-[#ff0099] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#ff2bab]">
              {t("checkout.done.myOrders")}
            </Link>
            <Link to="/menu" className="rounded-xl bg-[#2b2a2a] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#3a3939]">
              {t("checkout.done.toMenu")}
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (status === "loading") return <section className="min-h-screen py-30" />

  if (status === "guest") {
    return (
      <section className="flex min-h-screen items-center justify-center py-30">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl bg-[#1c1c1c] px-10 py-12 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-[#2b2a2a]">
            <LogIn className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold">{t("checkout.loginToOrder")}</h1>
          <p className="text-[#c4c4c4]">{t("checkout.loginToOrderHint")}</p>
          <AuthModal>
            <Button extraClass="mt-2 justify-center px-8 py-3 font-semibold">{t("nav.login")}</Button>
          </AuthModal>
        </div>
      </section>
    )
  }

  if (items.length === 0) return <Navigate to="/menu" replace />

  const isDelivery = mode === "delivery"
  const packaging = settings.packagingFee
  const deliveryFee = isDelivery ? settings.deliveryFee : 0
  const km = isDelivery && selected ? distanceKm(selected.lat, selected.lng, settings.lat, settings.lng) : null
  const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0
  const total = Math.max(0, subtotal + packaging + deliveryFee - discount)

  const cardComplete =
    card.number.replace(/\s/g, "").length === 16 && card.holder.trim().length > 0 && card.expiry.length === 5 && card.cvc.length === 3
  const canOrder = settings.isOpen && (!isDelivery || address.trim().length > 0) && (payment === "cash" || cardComplete) && !createOrder.isPending

  const applyPromo = async (e: FormEvent) => {
    e.preventDefault()
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoError(null)
    try {
      setPromo(await validatePromo.mutateAsync({ code, subtotal }))
    } catch (err) {
      setPromo(null)
      setPromoError(t(errorKey(err)))
    }
  }

  const placeOrder = async () => {
    if (!canOrder) return
    setOrderError(null)
    const usingSaved = isDelivery && selected && address.trim() === savedText
    try {
      const order = await createOrder.mutateAsync({
        mode,
        paymentMethod: payment,
        ...(isDelivery ? (usingSaved ? { addressId: selected.id } : { addressText: address.trim() }) : {}),
        comment: comment.trim(),
        promoCode: promo?.code,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      })
      clear()
      setDone(order)
      window.scrollTo({ top: 0 })
    } catch (err) {
      setOrderError(t(errorKey(err)))
      if (isApiError(err) && err.code === "PRODUCT_UNAVAILABLE") {
        const ids = (err.details as { productIds?: number[] } | undefined)?.productIds ?? []
        ids.forEach(removeItem)
      }
      if (isApiError(err) && err.code.startsWith("PROMO_")) setPromo(null)
    }
  }

  const paymentOption = (value: Payment, label: string, Icon: typeof Banknote) => {
    const active = payment === value
    return (
      <button
        type="button"
        role="radio"
        aria-checked={active}
        onClick={() => setPayment(value)}
        className={`${rowClass} w-full cursor-pointer text-left transition-colors hover:bg-white/5`}
      >
        <Icon className="size-5 shrink-0 text-[#c4c4c4]" />
        <span className="flex-1 text-base font-semibold">{label}</span>
        <span
          className={`grid size-7 place-items-center rounded-full border transition-colors ${
            active ? "border-[#ff0099] bg-[#ff0099]" : "border-[#4a4a4a]"
          }`}
        >
          {active && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      </button>
    )
  }

  return (
    <section className="pt-20 pb-24">
      {/* route context: pannable map with the restaurant pinned */}
      <RestaurantMap className="h-72 w-full" />

      <div className="mx-auto -mt-8 grid max-w-270 grid-cols-[1fr_320px] gap-14 px-8">
        {/* ---------- left column ---------- */}
        <div className="mx-auto flex w-full max-w-110 flex-col gap-12 pt-20">
          <div role="tablist" aria-label={t("checkout.modeAria")} className="grid grid-cols-2 rounded-full bg-[#2b2a2a] p-1">
            {(["delivery", "pickup"] as const).map((m) => {
              const active = m === mode
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(m)}
                  className={`cursor-pointer rounded-full py-3 text-base font-semibold transition-colors duration-300 ${
                    active ? "bg-[#4a4a4a] text-white" : "text-[#c4c4c4] hover:text-white"
                  }`}
                >
                  {m === "delivery" ? t("order.delivery") : t("order.pickup")}
                </button>
              )
            })}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">{isDelivery ? t("checkout.whereTo") : t("checkout.whereFrom")}</h2>
            <div className={`${cardClass} divide-y divide-[#3a3a3a]`}>
              {isDelivery ? (
                <div className={rowClass}>
                  <MapPin className="size-5 shrink-0 text-[#c4c4c4]" />
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("checkout.addressPlaceholder")}
                    aria-label={t("checkout.addressPlaceholder")}
                    className={`${fieldClass} font-semibold`}
                  />
                  <AddressSelect align="end">
                    <button
                      type="button"
                      aria-label={t("checkout.pickOnMap")}
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border border-[#4a4a4a] text-white transition-colors hover:bg-white hover:text-black"
                    >
                      <Map className="size-4" />
                    </button>
                  </AddressSelect>
                </div>
              ) : (
                <div className={rowClass}>
                  <MapPin className="size-5 shrink-0 text-[#c4c4c4]" />
                  <span className="text-sm">
                    <span className="font-semibold">{settings.name}</span>
                    <span className="ml-2 text-[#c4c4c4]">{pickText(settings.address, locale)}</span>
                  </span>
                </div>
              )}
              <div className={rowClass}>
                <MessageSquare className="size-5 shrink-0 text-[#c4c4c4]" />
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  placeholder={isDelivery ? t("checkout.courierComment") : t("checkout.chefComment")}
                  aria-label={isDelivery ? t("checkout.courierCommentAria") : t("checkout.chefCommentAria")}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t("checkout.itemsTitle")}</h2>
              <Link to="/menu" className="flex items-center gap-1 text-base font-medium text-[#ff4fb6] hover:text-white">
                <Plus className="size-4" />
                {t("checkout.addMore")}
              </Link>
            </div>
            <ul className="flex flex-col gap-5">
              {items.map((item) => (
                <li key={item.product.id} className="flex items-center gap-4">
                  <img src={mediaUrl(item.product.imageUrl) ?? ProductBurgerSet} alt="" draggable={false} className="size-16 rounded-lg bg-[#e9e5d9] object-contain p-1" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{pickText(item.product.name, locale)}</p>
                    <p className="text-base text-[#ff4fb6]">{formatPrice(item.product.price)}</p>
                  </div>
                  <QuantityStepper
                    size="sm"
                    value={item.quantity}
                    onChange={(q) => setQuantity(item.product.id, q)}
                    onRemove={() => removeItem(item.product.id)}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">{t("checkout.paymentTitle")}</h2>
            <div role="radiogroup" className={`${cardClass} divide-y divide-[#3a3a3a]`}>
              {paymentOption("cash", t("order.cash"), Banknote)}
              {paymentOption("card", t("order.card"), CreditCard)}
              {payment === "card" && (
                <div className="grid grid-cols-2 gap-4 p-5">
                  <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
                    {t("checkout.cardNumber")}
                    <input
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="0000 0000 0000 0000"
                      className={inputClass}
                    />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
                    {t("checkout.cardHolder")}
                    <input
                      value={card.holder}
                      onChange={(e) => setCard({ ...card, holder: e.target.value })}
                      autoComplete="cc-name"
                      placeholder="IVAN IVANOV"
                      className={`${inputClass} uppercase`}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
                    {t("checkout.expiry")}
                    <input
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      className={inputClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
                    {t("checkout.cvc")}
                    <input
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                      inputMode="numeric"
                      type="password"
                      autoComplete="cc-csc"
                      placeholder="•••"
                      className={inputClass}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">{t("checkout.promoTitle")}</h2>
            <p className="mb-5 text-base text-[#e6e6e6]">{t("checkout.promoText")}</p>
            <form onSubmit={applyPromo} className="flex gap-3">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder={t("checkout.promoPlaceholder")}
                aria-label={t("checkout.promoAria")}
                maxLength={32}
                className="min-w-0 flex-1 rounded-lg border border-[#3a3a3a] bg-transparent px-4 py-3 text-base text-white uppercase outline-none placeholder:normal-case placeholder:text-[#8a8a8a] focus:ring-2 focus:ring-white/40"
              />
              <button
                type="submit"
                disabled={validatePromo.isPending}
                className="shrink-0 cursor-pointer rounded-lg bg-[#ff0099] px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-[#ff2bab] disabled:opacity-60"
              >
                {t("checkout.apply")}
              </button>
            </form>
            {promoError && <p className="mt-2 text-sm text-red-300">{promoError}</p>}
            {promo && (
              <p className="mt-2 text-sm text-[#77FF00]">
                {t("checkout.promoApplied", { code: promo.code, percent: promo.percent })}
              </p>
            )}
          </div>
        </div>

        {/* ---------- right column: summary ---------- */}
        {/* above the (isolated) map, below popovers/dialogs (z-50) */}
        <aside className="relative z-10 self-start rounded-2xl bg-[#1c1c1c] p-6 shadow-2xl md:sticky md:top-28">
          <h2 className="text-xl font-semibold">{t("checkout.summary")}</h2>
          <p className="text-sm text-[#c4c4c4]">{t("checkout.taxNote")}</p>

          <dl className="mt-6 flex flex-col gap-3 text-base">
            <div className="flex justify-between">
              <dt className="text-[#e6e6e6]">{t("order.subtotal")}</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#e6e6e6]">{t("order.packaging")}</dt>
              <dd>{formatPrice(packaging)}</dd>
            </div>
            {isDelivery && (
              <div className="flex justify-between">
                <dt className="text-[#e6e6e6]">
                  {km !== null ? t("order.deliveryDistance", { km: km.toFixed(1) }) : t("order.deliveryFee")}
                </dt>
                <dd className="text-[#77FF00]">{formatPrice(deliveryFee)}</dd>
              </div>
            )}
            {promo && (
              <div className="flex justify-between">
                <dt className="text-[#e6e6e6]">
                  {t("order.discount")} ({promo.code})
                </dt>
                <dd className="text-[#77FF00]">−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="mt-2 flex justify-between text-lg font-semibold">
              <dt>{t("order.total")}</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>

          {!settings.isOpen && <p className="mt-4 rounded-xl bg-[#ff6b6b]/10 px-4 py-2.5 text-sm text-[#ff9b9b]">{t("checkout.closed")}</p>}
          {orderError && (
            <p role="alert" className="mt-4 rounded-xl bg-[#ff6b6b]/10 px-4 py-2.5 text-sm text-[#ff9b9b]">
              {orderError}
            </p>
          )}

          <button
            type="button"
            onClick={placeOrder}
            disabled={!canOrder}
            className="mt-6 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-[#ff0099] px-4 py-3.5 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#ff2bab] disabled:cursor-not-allowed disabled:bg-[#3a3939] disabled:text-[#8a8a8a]"
          >
            <span>{createOrder.isPending ? t("checkout.placing") : t("checkout.placeOrder")}</span>
            <span>{formatPrice(total)}</span>
          </button>
        </aside>
      </div>
    </section>
  )
}

export default Checkout
