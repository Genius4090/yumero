import type { restaurantSettingsType } from "@/@types"

/** Fallback while `GET /api/settings` is loading; the real values come from the admin panel. */
export const DEFAULT_SETTINGS: restaurantSettingsType = {
  name: "Yumero",
  address: { ru: "Ташкент, сквер Амира Темура, 1", en: "Tashkent, Amir Temur Square, 1", uz: "Toshkent, Amir Temur xiyoboni, 1" },
  lat: 41.3111,
  lng: 69.2797,
  packagingFee: 1000,
  deliveryFee: 0,
  phone: "",
  telegramUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  vkUrl: null,
  isOpen: true,
}

/** Straight-line distance in km between two coordinates. */
export const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
