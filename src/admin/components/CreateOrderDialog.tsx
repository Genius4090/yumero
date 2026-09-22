import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Check, Minus, Plus, Search, Trash2, X } from "lucide-react"
import type { adminUserType, orderType, productType } from "@/@types"
import { ProductBurgerSet } from "@/assets/images"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import { formatPrice } from "@/lib/format"
import { pickText } from "@/lib/localized"
import { PhoneField } from "@/components/auth/Fields"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAdminProducts, useAdminSettings, useCreateAdminOrder, useCustomerAddresses, useCustomerSearch, type AdminOrderCustomer } from "../api"
import { formatPhone } from "../format"
import { Btn, Input, Label, Notice, Segmented, Select, inputCls } from "../ui"

const useDebounced = (value: string, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

interface Line {
  product: productType
  quantity: number
}

/** Sentinel for the "enter the address manually" option (Radix Select forbids "" as an item value). */
const MANUAL_ADDRESS = "__manual__"

const CreateOrderDialog = ({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (order: orderType) => void }) => {
  const { t, locale } = useI18n()
  const create = useCreateAdminOrder()
  const { data: settings } = useAdminSettings()

  const [customerType, setCustomerType] = useState<"client" | "custom">("client")
  const [clientQuery, setClientQuery] = useState("")
  const [client, setClient] = useState<adminUserType | null>(null)
  const [customName, setCustomName] = useState("")
  const [customPhone, setCustomPhone] = useState("")

  const [mode, setMode] = useState<"delivery" | "pickup">("delivery")
  const [addressId, setAddressId] = useState<string>("")
  const [addressText, setAddressText] = useState("")
  const [payment, setPayment] = useState<"cash" | "card">("cash")
  const [promo, setPromo] = useState("")
  const [comment, setComment] = useState("")

  const [productQuery, setProductQuery] = useState("")
  const [lines, setLines] = useState<Line[]>([])
  const [error, setError] = useState<string | null>(null)

  const clientSearch = useCustomerSearch(useDebounced(clientQuery))
  const addresses = useCustomerAddresses(customerType === "client" ? (client?.id ?? null) : null)
  const productSearch = useAdminProducts({ search: useDebounced(productQuery) || undefined })

  const reset = () => {
    setCustomerType("client")
    setClientQuery("")
    setClient(null)
    setCustomName("")
    setCustomPhone("")
    setMode("delivery")
    setAddressId("")
    setAddressText("")
    setPayment("cash")
    setPromo("")
    setComment("")
    setProductQuery("")
    setLines([])
    setError(null)
  }

  const handleOpenChange = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.product.price * l.quantity, 0), [lines])
  const packaging = settings?.packagingFee ?? 0
  const delivery = mode === "delivery" ? (settings?.deliveryFee ?? 0) : 0

  const addLine = (product: productType) =>
    setLines((prev) => (prev.some((l) => l.product.id === product.id) ? prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l)) : [...prev, { product, quantity: 1 }]))
  const setQty = (id: number, qty: number) => setLines((prev) => (qty <= 0 ? prev.filter((l) => l.product.id !== id) : prev.map((l) => (l.product.id === id ? { ...l, quantity: qty } : l))))

  const customerOk = customerType === "client" ? Boolean(client) : customName.trim().length > 0 && customPhone.length === 9
  const addressOk = mode === "pickup" || (customerType === "client" && addressId) || addressText.trim().length > 0
  const canSubmit = customerOk && addressOk && lines.length > 0 && !create.isPending

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    const customer: AdminOrderCustomer = customerType === "client" ? { type: "client", userId: client!.id } : { type: "custom", name: customName.trim(), phone: customPhone }
    try {
      const order = await create.mutateAsync({
        customer,
        mode,
        paymentMethod: payment,
        ...(mode === "delivery" ? (customerType === "client" && addressId ? { addressId } : { addressText: addressText.trim() }) : {}),
        comment: comment.trim(),
        promoCode: promo.trim() || undefined,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      })
      onCreated(order)
      handleOpenChange(false)
    } catch (err) {
      setError(t(errorKey(err)))
    }
  }

  const availableProducts = (productSearch.data?.items ?? []).filter((p) => p.isAvailable)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[92vh] w-[min(1280px,96vw)] max-w-none overflow-y-auto">
        <DialogTitle className="mb-6">{t("admin.orders.createTitle")}</DialogTitle>
        {/* three columns: customer & delivery | dish picker | added dishes & totals */}
        <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* ---------- left: customer + delivery ---------- */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm text-[#c4c4c4]">{t("admin.orders.customerType")}</p>
              <Segmented
                value={customerType}
                onChange={setCustomerType}
                options={[
                  { value: "client", label: t("admin.orders.typeClient") },
                  { value: "custom", label: t("admin.orders.typeCustom") },
                ]}
              />
            </div>

            {customerType === "client" ? (
              client ? (
                <div className="flex items-center gap-3 rounded-xl bg-[#2b2a2a] px-4 py-3">
                  <Check className="size-4 text-[#77FF00]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{client.fullName || "—"}</p>
                    <p className="text-xs text-[#8a8a8a]">{formatPhone(client.phone)}</p>
                  </div>
                  <button type="button" onClick={() => setClient(null)} aria-label={t("common.close")} className="cursor-pointer text-[#8a8a8a] hover:text-white">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8a8a8a]" />
                    <Input value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} placeholder={t("admin.orders.searchCustomer")} className="pl-11" autoFocus />
                  </div>
                  {clientQuery.trim().length >= 2 && (
                    <ul className="absolute top-full right-0 left-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#1c1c1c] p-1 shadow-2xl [scrollbar-color:#3a3939_transparent] [scrollbar-width:thin]">
                      {clientSearch.isPending && <li className="px-3 py-2 text-sm text-[#8a8a8a]">{t("admin.common.loading")}</li>}
                      {clientSearch.data?.items.length === 0 && <li className="px-3 py-2 text-sm text-[#8a8a8a]">{t("admin.orders.noCustomers")}</li>}
                      {clientSearch.data?.items.map((u) => (
                        <li key={u.id}>
                          <button type="button" onClick={() => setClient(u)} className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">
                            <span className="truncate font-medium">{u.fullName || "—"}</span>
                            <span className="shrink-0 text-xs text-[#8a8a8a]">{formatPhone(u.phone)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            ) : (
              <>
                <Label label={t("admin.common.name")}>
                  <Input value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={60} required />
                </Label>
                <PhoneField id="custom-phone" value={customPhone} onChange={setCustomPhone} />
              </>
            )}

            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "delivery", label: t("order.delivery") },
                { value: "pickup", label: t("order.pickup") },
              ]}
            />

            {mode === "delivery" && (
              <>
                {customerType === "client" && client && (addresses.data?.length ?? 0) > 0 && (
                  <Label label={t("admin.orders.savedAddress")}>
                    <Select
                      value={addressId || MANUAL_ADDRESS}
                      onChange={(v) => setAddressId(v === MANUAL_ADDRESS ? "" : v)}
                      options={[
                        { value: MANUAL_ADDRESS, label: t("admin.orders.manualAddress") },
                        ...(addresses.data ?? []).map((a) => ({ value: a.id, label: [a.title, a.address, a.house].filter(Boolean).join(", ") })),
                      ]}
                    />
                  </Label>
                )}
                {!addressId && (
                  <Label label={t("checkout.addressPlaceholder")}>
                    <Input value={addressText} onChange={(e) => setAddressText(e.target.value)} placeholder={t("admin.orders.addressPlaceholder")} maxLength={300} />
                  </Label>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Label label={t("order.payment")}>
                <Select
                  value={payment}
                  onChange={(v) => setPayment(v as "cash" | "card")}
                  options={[
                    { value: "cash", label: t("order.cash") },
                    { value: "card", label: t("order.card") },
                  ]}
                />
              </Label>
              <Label label={t("admin.orders.promo")}>
                <Input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} className="uppercase" maxLength={32} />
              </Label>
            </div>
            <Label label={t("admin.orders.comment")}>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} className={`${inputCls} min-h-16 resize-y`} />
            </Label>
          </div>

          {/* ---------- right: items ---------- */}
          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-2 text-sm text-[#c4c4c4]">
              {t("admin.orders.items")}
              {/* number of dishes in the picker below (all available dishes, or the search matches) */}
              {productSearch.data && <span className="rounded-full bg-[#ff0099]/15 px-2 py-0.5 text-xs font-semibold text-[#ff4fb6]">{availableProducts.length}</span>}
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8a8a8a]" />
              <Input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder={t("admin.orders.searchProducts")} className="pl-11" />
            </div>
            <ul className="flex max-h-120 flex-col gap-2 overflow-y-auto pr-3 [scrollbar-color:#3a3939_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]">
              {productSearch.isPending && <li className="px-2 py-3 text-sm text-[#8a8a8a]">{t("admin.common.loading")}</li>}
              {!productSearch.isPending && availableProducts.length === 0 && <li className="px-2 py-3 text-sm text-[#8a8a8a]">{t("admin.common.empty")}</li>}
              {availableProducts.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => addLine(p)} className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-[#2b2a2a] p-2 text-left text-sm transition-colors hover:bg-[#3a3939]">
                    <img src={mediaUrl(p.imageUrl) ?? ProductBurgerSet} alt="" className="size-9 rounded-lg bg-[#e9e5d9] object-contain p-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{pickText(p.name, locale)}</span>
                      <span className="text-xs text-[#8a8a8a]">{formatPrice(p.price)}</span>
                    </span>
                    <Plus className="size-4 shrink-0 text-[#ff4fb6]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- right: added dishes + totals ---------- */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm text-[#c4c4c4]">
                {t("admin.orders.added")}
                {lines.length > 0 && <span className="rounded-full bg-[#ff0099]/15 px-2 py-0.5 text-xs font-semibold text-[#ff4fb6]">{lines.reduce((s, l) => s + l.quantity, 0)}</span>}
              </p>
              {lines.length > 0 && (
                <button type="button" onClick={() => setLines([])} className="cursor-pointer text-sm font-semibold text-[#8a8a8a] transition-colors hover:text-[#ff6b6b]">
                  {t("admin.orders.clearItems")}
                </button>
              )}
            </div>
            <div className="rounded-2xl bg-[#161616] p-3">
              {lines.length === 0 && <p className="px-2 py-3 text-sm text-[#8a8a8a]">{t("admin.orders.noItems")}</p>}
              {/* 6 rows tall (each row is 49px); longer orders scroll inside instead of stretching the dialog */}
              {/* the scrollbar's gutter is always reserved, so rows don't shift when it appears */}
              <ul className="max-h-74 divide-y divide-white/5 overflow-y-auto pr-3 [scrollbar-color:#3a3939_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]">
                {lines.map((l) => (
                  <li key={l.product.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{pickText(l.product.name, locale)}</span>
                    <span className="flex items-center rounded-lg bg-[#4a1236] text-[#ff4fb6]">
                      <button type="button" onClick={() => setQty(l.product.id, l.quantity - 1)} className="grid size-8 cursor-pointer place-items-center hover:text-white" aria-label={t("stepper.decrease")}>
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-6 text-center font-semibold">{l.quantity}</span>
                      <button type="button" onClick={() => setQty(l.product.id, l.quantity + 1)} className="grid size-8 cursor-pointer place-items-center hover:text-white" aria-label={t("stepper.increase")}>
                        <Plus className="size-3.5" />
                      </button>
                    </span>
                    <span className="w-24 text-right font-semibold">{formatPrice(l.product.price * l.quantity)}</span>
                    <button type="button" onClick={() => setQty(l.product.id, 0)} className="cursor-pointer text-[#8a8a8a] hover:text-[#ff6b6b]" aria-label={t("stepper.remove")}>
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 flex flex-col gap-1 border-t border-white/5 pt-3 text-sm">
                <div className="flex justify-between text-[#c4c4c4]">
                  <dt>{t("order.subtotal")}</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-[#c4c4c4]">
                  <dt>{t("order.packaging")}</dt>
                  <dd>{formatPrice(packaging)}</dd>
                </div>
                {mode === "delivery" && (
                  <div className="flex justify-between text-[#c4c4c4]">
                    <dt>{t("order.deliveryFee")}</dt>
                    <dd>{formatPrice(delivery)}</dd>
                  </div>
                )}
                <div className="mt-1 flex justify-between text-base font-semibold">
                  <dt>{t("admin.orders.summary")}</dt>
                  <dd>{formatPrice(subtotal + packaging + delivery)}</dd>
                </div>
              </dl>
            </div>

            {error && <Notice tone="error">{error}</Notice>}
            <div className="mt-auto flex justify-end gap-3">
              <Btn onClick={() => handleOpenChange(false)}>{t("admin.common.cancel")}</Btn>
              <Btn type="submit" variant="primary" disabled={!canSubmit}>
                {create.isPending ? t("admin.common.saving") : t("admin.orders.create")}
              </Btn>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateOrderDialog
