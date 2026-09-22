import { useState } from "react"
import { ChevronDown, Plus, RefreshCw } from "lucide-react"
import CreateOrderDialog from "../components/CreateOrderDialog"
import { formatPhone } from "../format"
import type { orderStatusApi, orderType } from "@/@types"
import { useI18n } from "@/i18n/useI18n"
import { errorKey } from "@/lib/apiErrors"
import { formatPrice } from "@/lib/format"
import { pickText } from "@/lib/localized"
import { formatOrderDate } from "@/lib/orders"
import { useAdminOrders, useSetOrderStatus } from "../api"
import { useToast } from "../toast"
import { Badge, Btn, Input, PageHeader, Pagination, Select, Table, type SelectOption } from "../ui"
import { PAGE_SIZE } from "../usePagination"

const STATUSES: orderStatusApi[] = ["NEW", "COOKING", "ON_THE_WAY", "READY", "DELIVERED", "PICKED_UP", "CANCELLED"]
const TONE: Record<orderStatusApi, "amber" | "blue" | "green" | "red" | "neutral"> = {
  NEW: "amber",
  COOKING: "amber",
  ON_THE_WAY: "blue",
  READY: "blue",
  DELIVERED: "green",
  PICKED_UP: "green",
  CANCELLED: "red",
}

/** Mirrors the backend transition table (lib/orderStatus.ts). */
const nextStatuses = (o: orderType): orderStatusApi[] => {
  switch (o.status) {
    case "NEW":
      return ["COOKING"]
    case "COOKING":
      return [o.mode === "delivery" ? "ON_THE_WAY" : "READY"]
    case "ON_THE_WAY":
      return ["DELIVERED"]
    case "READY":
      return ["PICKED_UP"]
    default:
      return []
  }
}
const canCancel = (o: orderType) => o.status === "NEW" || o.status === "COOKING"

type Filter = "active" | "all" | orderStatusApi

const OrderRow = ({ order, highlight }: { order: orderType; highlight?: boolean }) => {
  const { t, tag, locale } = useI18n()
  const toast = useToast()
  const setStatus = useSetOrderStatus()
  const [open, setOpen] = useState(Boolean(highlight))

  const move = async (status: orderStatusApi) => {
    try {
      await setStatus.mutateAsync({ id: order.id, status })
      toast.success(t("admin.orders.statusUpdated", { number: order.number, status: t(`admin.status.${status}`) }))
    } catch (err) {
      toast.error(t(errorKey(err)))
    }
  }

  // Choosing from a dropdown needs two deliberate clicks, so a stray click cannot advance the order.
  const transitions: SelectOption[] = [
    ...nextStatuses(order).map((s) => ({ value: s, label: t(`admin.status.${s}`) })),
    ...(canCancel(order) ? [{ value: "CANCELLED", label: t("admin.orders.cancel"), tone: "danger" as const }] : []),
  ]

  return (
    <>
      <tr className={`cursor-pointer hover:bg-white/[0.03] ${highlight ? "bg-[#ff0099]/10" : ""}`} onClick={() => setOpen((v) => !v)}>
        <td className="font-semibold whitespace-nowrap">
          #{order.number}
          {order.source === "ADMIN" && (
            <span className="ml-2">
              <Badge tone="neutral">{t("admin.orders.sourceADMIN")}</Badge>
            </span>
          )}
        </td>
        <td className="text-[#c4c4c4]">{formatOrderDate(order.createdAt, tag)}</td>
        <td>
          {order.customer ? (
            <>
              <span className="block font-medium">{order.customer.fullName || "—"}</span>
              <span className="block text-xs text-[#8a8a8a]">{formatPhone(order.customer.phone)}</span>
            </>
          ) : (
            "—"
          )}
        </td>
        <td className="text-[#c4c4c4]">{order.mode === "delivery" ? t("order.delivery") : t("order.pickup")}</td>
        <td className="text-[#c4c4c4]">{order.payment === "cash" ? t("order.cash") : t("order.card")}</td>
        <td className="font-semibold">{formatPrice(order.total)}</td>
        <td>
          <Badge tone={TONE[order.status]}>{t(`admin.status.${order.status}`)}</Badge>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            {transitions.length > 0 && (
              <Select
                size="sm"
                value=""
                onChange={(s) => move(s as orderStatusApi)}
                placeholder={t("admin.orders.changeStatus")}
                disabled={setStatus.isPending}
                className="w-44"
                aria-label={t("admin.orders.changeStatus")}
                options={transitions}
              />
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={t("admin.orders.details")}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#8a8a8a] transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronDown className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#161616]">
          <td colSpan={8}>
            <div className="grid grid-cols-[1fr_320px] gap-8 py-2">
              <ul className="divide-y divide-white/5">
                {order.items.map((i, idx) => (
                  <li key={idx} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      {pickText(i.product.name, locale)} <span className="text-[#8a8a8a]">× {i.quantity}</span>
                    </span>
                    <span>{formatPrice(i.product.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#8a8a8a]">{order.mode === "delivery" ? t("order.delivery") : t("order.pickup")}</dt>
                  <dd className="max-w-52 text-right">{order.address}</dd>
                </div>
                {order.comment && (
                  <div className="flex justify-between">
                    <dt className="text-[#8a8a8a]">{t("admin.orders.comment")}</dt>
                    <dd className="max-w-52 text-right">{order.comment}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[#8a8a8a]">{t("order.subtotal")}</dt>
                  <dd>{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#8a8a8a]">{t("order.packaging")}</dt>
                  <dd>{formatPrice(order.packaging)}</dd>
                </div>
                {order.mode === "delivery" && (
                  <div className="flex justify-between">
                    <dt className="text-[#8a8a8a]">{t("order.deliveryFee")}</dt>
                    <dd>{formatPrice(order.delivery)}</dd>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#8a8a8a]">
                      {t("order.discount")} {order.promoCode && `(${order.promoCode})`}
                    </dt>
                    <dd className="text-[#77FF00]">−{formatPrice(order.discount)}</dd>
                  </div>
                )}
                <div className="mt-1 flex justify-between font-semibold">
                  <dt>{t("order.total")}</dt>
                  <dd>{formatPrice(order.total)}</dd>
                </div>
              </dl>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const OrdersPage = () => {
  const { t } = useI18n()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>("active")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const pageSize = PAGE_SIZE

  const orders = useAdminOrders({
    active: filter === "active" || undefined,
    status: filter !== "active" && filter !== "all" ? filter : undefined,
    search: search.trim() || undefined,
    page,
    pageSize,
  })

  const pages = Math.max(1, Math.ceil((orders.data?.total ?? 0) / pageSize))
  const tabs: { value: Filter; label: string }[] = [
    { value: "active", label: t("admin.orders.active") },
    { value: "all", label: t("admin.orders.all") },
    ...STATUSES.map((s) => ({ value: s as Filter, label: t(`admin.status.${s}`) })),
  ]

  return (
    <>
      <PageHeader title={t("admin.nav.orders")}>
        <Input
          placeholder={t("admin.orders.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-72"
        />
        <Btn onClick={() => orders.refetch()} aria-label={t("admin.common.refresh")} title={t("admin.common.refresh")} className="w-11 px-0">
          <RefreshCw className={`size-4 ${orders.isFetching ? "animate-spin" : ""}`} />
        </Btn>
        <Btn variant="primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          {t("admin.orders.create")}
        </Btn>
      </PageHeader>

      <CreateOrderDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(order) => {
          setCreatedId(order.id)
          setFilter("active")
          setSearch("")
          setPage(1)
          toast.success(t("admin.orders.created", { number: order.number }))
        }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.value}
            type="button"
            onClick={() => {
              setFilter(tb.value)
              setPage(1)
            }}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === tb.value ? "bg-white text-black" : "bg-[#2b2a2a] text-[#c4c4c4] hover:text-white"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <Table>
        <thead>
          <tr>
            <th>#</th>
            <th>{t("admin.orders.date")}</th>
            <th>{t("admin.orders.customer")}</th>
            <th>{t("checkout.modeAria")}</th>
            <th>{t("order.payment")}</th>
            <th>{t("admin.orders.total")}</th>
            <th>{t("admin.orders.status")}</th>
            <th className="text-right">{t("admin.common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {orders.isPending && (
            <tr>
              <td colSpan={8} className="text-[#8a8a8a]">{t("admin.common.loading")}</td>
            </tr>
          )}
          {orders.data?.items.length === 0 && (
            <tr>
              <td colSpan={8} className="text-[#8a8a8a]">{t("admin.orders.noOrders")}</td>
            </tr>
          )}
          {orders.data?.items.map((o) => (
            <OrderRow key={o.id} order={o} highlight={o.id === createdId} />
          ))}
        </tbody>
      </Table>

      <Pagination page={page} pages={pages} total={orders.data?.total ?? 0} pageSize={pageSize} onChange={setPage} />
    </>
  )
}

export default OrdersPage
