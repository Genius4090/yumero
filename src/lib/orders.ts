import type { orderStatusApi, orderType } from "@/@types"
import type { TranslationKey } from "@/i18n"

/** User-facing status: one colour and label each (see OrderStatusBadge). */
export type orderStatus = "received" | "cooking" | "transit" | "arrived" | "ready" | "delivered" | "pickedUp" | "cancelled"

const DISPLAY: Record<orderStatusApi, orderStatus> = {
  NEW: "received",
  COOKING: "cooking",
  ON_THE_WAY: "transit",
  ARRIVED: "arrived",
  READY: "ready",
  DELIVERED: "delivered",
  PICKED_UP: "pickedUp",
  CANCELLED: "cancelled",
}

export const orderStatusOf = (order: Pick<orderType, "status">): orderStatus => DISPLAY[order.status] ?? "received"

/** An order can only be cancelled while the kitchen hasn't handed it over yet. */
export const canCancelOrder = (order: Pick<orderType, "status">) => order.status === "NEW" || order.status === "COOKING"

/** Still in progress (polled for live status updates). */
export const isActiveOrder = (order: Pick<orderType, "status">) =>
  order.status === "NEW" || order.status === "COOKING" || order.status === "ON_THE_WAY" || order.status === "ARRIVED" || order.status === "READY"

/** Dictionary key for a status label; translate with `t()`. */
export const statusKey = (status: orderStatus): TranslationKey => `order.stage.${status}`

const dateFormats = new Map<string, Intl.DateTimeFormat>()

/** formatOrderDate(1758190000000, "ru-RU") -> "18 сентября, 14:32" */
export const formatOrderDate = (ts: number, tag: string) => {
  let format = dateFormats.get(tag)
  if (!format) {
    format = new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    dateFormats.set(tag, format)
  }
  return format.format(ts)
}

export const orderItemCount = (order: orderType) => order.items.reduce((s, i) => s + i.quantity, 0)
