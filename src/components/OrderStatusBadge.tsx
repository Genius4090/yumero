import { Bike, ChefHat, CircleCheck, ClipboardCheck, MapPinCheck, ShoppingBag, XCircle } from "lucide-react"
import type { orderType } from "@/@types"
import { useI18n } from "@/i18n/useI18n"
import { orderStatusOf, statusKey, type orderStatus } from "@/lib/orders"

/**
 * One colour + icon per status, following the usual delivery-app convention: pink = received (the brand colour),
 * amber = being prepared, blue = on its way, violet = courier waiting at the door, teal = ready to collect,
 * green = completed, red = cancelled.
 */
const STATUS: Record<orderStatus, { className: string; Icon: typeof ChefHat }> = {
  received: { className: "bg-[#ff0099]/15 text-[#ff5cb8]", Icon: ClipboardCheck },
  cooking: { className: "bg-[#f5c400]/15 text-[#f5c400]", Icon: ChefHat },
  transit: { className: "bg-[#4da3ff]/15 text-[#4da3ff]", Icon: Bike },
  arrived: { className: "bg-[#b388ff]/15 text-[#b388ff]", Icon: MapPinCheck },
  ready: { className: "bg-[#2dd4bf]/15 text-[#2dd4bf]", Icon: ShoppingBag },
  delivered: { className: "bg-[#77FF00]/10 text-[#77FF00]", Icon: CircleCheck },
  pickedUp: { className: "bg-[#77FF00]/10 text-[#77FF00]", Icon: CircleCheck },
  cancelled: { className: "bg-[#ff6b6b]/10 text-[#ff6b6b]", Icon: XCircle },
}

/** Pill with the order's current status (as reported by the backend). */
const OrderStatusBadge = ({ order }: { order: Pick<orderType, "status"> }) => {
  const { t } = useI18n()
  const status = orderStatusOf(order)
  const { className, Icon } = STATUS[status]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 pr-3 pl-2.5 text-sm font-semibold whitespace-nowrap ${className}`}>
      <Icon className="size-3.5" strokeWidth={2.5} />
      {t(statusKey(status))}
    </span>
  )
}

export default OrderStatusBadge
