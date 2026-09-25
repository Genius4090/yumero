import type { Locale } from "@/i18n"

export interface menuListType {
  id: number
  content: string
  image: string
  menuColor: string
}

/** Text stored in all three site languages; pick one with `pickText()` from `@/lib/localized`. */
export type LocalizedText = Record<Locale, string>

export interface addressType {
  id: string
  title: string
  address: string
  house: string
  apartment: string
  floor: string
  entrance: string
  comment: string
  lat: number
  lng: number
}

export interface categoryType {
  id: number
  slug: string
  name: LocalizedText
  color: string
  sort: number
  isActive: boolean
}

export interface productType {
  id: number
  categoryId: number
  name: LocalizedText
  description: LocalizedText
  /** UZS */
  price: number
  /** `/uploads/...` path or absolute URL; null = placeholder image */
  imageUrl: string | null
  isPopular: boolean
  isAvailable: boolean
  sort: number
}

export interface bannerType {
  id: number
  imageUrl: string
  link: string | null
  sort: number
  isActive: boolean
}

export interface restaurantSettingsType {
  name: string
  address: LocalizedText
  lat: number
  lng: number
  packagingFee: number
  deliveryFee: number
  phone: string
  telegramUrl: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  vkUrl: string | null
  isOpen: boolean
}

export interface cartItemType {
  product: productType
  quantity: number
}

export type orderModeType = "delivery" | "pickup"
export type orderPaymentType = "cash" | "card"

/** Backend order status; the UI derives its display status from it in `@/lib/orders`. */
export type orderStatusApi = "NEW" | "COOKING" | "ON_THE_WAY" | "ARRIVED" | "READY" | "DELIVERED" | "PICKED_UP" | "CANCELLED"

export type orderSourceApi = "WEB" | "ADMIN"

export interface orderType {
  id: string
  /** Human-readable number shown as "Order #1001" (localized via `order.number`) */
  number: number
  status: orderStatusApi
  /** WEB = placed by the customer on the site, ADMIN = entered by staff */
  source: orderSourceApi
  /** Epoch ms */
  createdAt: number
  updatedAt?: number
  /** Epoch ms; set when the order was cancelled */
  cancelledAt?: number
  mode: orderModeType
  /** Delivery address, or the restaurant address for pickup */
  address: string
  comment: string
  payment: orderPaymentType
  items: cartItemType[]
  subtotal: number
  packaging: number
  delivery: number
  discount: number
  promoCode: string | null
  total: number
  /** Present on admin endpoints only; `id` is missing for account-less (custom) customers */
  customer?: { id?: string; phone: string; fullName: string }
}

/** Customer or staff account as listed in the admin panel */
export interface adminUserType {
  id: string
  phone: string
  fullName: string
  role: userRole
  avatarUrl: string | null
  telegramLinked: boolean
  createdAt: string
  ordersCount: number
  lastOrderAt: string | null
  /** staff only */
  ordersCreated?: number
}

export interface promoCodeType {
  id: number
  code: string
  percent: number
  isActive: boolean
  validFrom: string | null
  validTo: string | null
  maxUses: number | null
  usedCount: number
  createdAt: string
}

export type userRole = "USER" | "ADMIN" | "SUPERADMIN"

export interface AuthUser {
  id: string
  /** Digits only: 998XXXXXXXXX */
  phone: string
  fullName: string
  role: userRole
  /** "/uploads/<file>" or null; render through mediaUrl() */
  avatarUrl: string | null
  telegramLinked: boolean
}
