import { hasYandexKey, loadYandexMaps } from "./yandexMaps"

export interface GeocodeResult {
  /** Street (or district as a fallback) */
  address: string
  /** House number, if resolved */
  house: string
}

const viaYandex = async (lat: number, lng: number): Promise<GeocodeResult | null> => {
  const api = await loadYandexMaps()
  const res = await api.geocode([lat, lng], { kind: "house", results: 1 })
  const obj = res.geoObjects.get(0) as ymaps.GeocodeResult | undefined
  if (!obj) return null
  const street = obj.getThoroughfare() ?? obj.getLocalities()[0] ?? obj.getAddressLine()
  return { address: street ?? "", house: obj.getPremiseNumber() ?? "" }
}

const viaNominatim = async (lat: number, lng: number, signal: AbortSignal): Promise<GeocodeResult | null> => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ru`,
    { signal }
  )
  const data = (await res.json()) as {
    display_name?: string
    address?: { road?: string; house_number?: string; neighbourhood?: string; suburb?: string }
  }
  const a = data.address ?? {}
  // Prefer a street; otherwise fall back to the first two parts of the full name
  const street = a.road ?? a.neighbourhood ?? a.suburb ?? ""
  const fallback = (data.display_name ?? "").split(",").slice(0, 2).join(",").trim()
  return { address: street || fallback, house: a.house_number ?? "" }
}

/**
 * Reverse-geocode a coordinate. Uses the Yandex geocoder when an API key is
 * configured (far better coverage in Uzbekistan), otherwise OSM Nominatim.
 * Best-effort: resolves to null on any failure or abort.
 */
export const reverseGeocode = async (lat: number, lng: number, signal: AbortSignal): Promise<GeocodeResult | null> => {
  try {
    if (hasYandexKey) {
      try {
        const r = await viaYandex(lat, lng)
        if (signal.aborted) return null
        if (r) return r
      } catch {
        // fall through to Nominatim
      }
    }
    return await viaNominatim(lat, lng, signal)
  } catch {
    return null
  }
}
