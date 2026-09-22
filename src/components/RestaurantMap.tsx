import { useCallback, useState } from "react"
import { hasYandexKey } from "@/lib/yandexMaps"
import { useSettings } from "@/api/hooks"
import { DEFAULT_SETTINGS } from "@/data/restaurant"
import { useI18n } from "@/i18n/useI18n"
import LeafletMapView from "./map/LeafletMapView"
import YandexMapView from "./map/YandexMapView"

/** Pannable map with the restaurant pinned at its coordinate from settings (route context on checkout). */
const RestaurantMap = ({ className = "" }: { className?: string }) => {
  const { t } = useI18n()
  const { data } = useSettings()
  const restaurant = data ?? DEFAULT_SETTINGS
  const [provider, setProvider] = useState<"yandex" | "leaflet">(hasYandexKey ? "yandex" : "leaflet")

  const handleYandexError = useCallback((err: unknown) => {
    console.warn("Yandex Maps unavailable, falling back to OpenStreetMap:", err)
    setProvider("leaflet")
  }, [])

  const marker = { lat: restaurant.lat, lng: restaurant.lng, title: restaurant.name, icon: "restaurant" as const }
  const viewProps = { lat: restaurant.lat, lng: restaurant.lng, zoom: 14, marker }

  // `isolate` keeps Leaflet's internal z-indexes (400–1000) inside this box so popovers/dialogs stay above the map
  return (
    <div className={`relative isolate z-0 ${className}`} aria-label={t("checkout.mapAria")}>
      {provider === "yandex" ? (
        <YandexMapView key={`yandex-${restaurant.lat}-${restaurant.lng}`} {...viewProps} onError={handleYandexError} />
      ) : (
        <LeafletMapView key={`leaflet-${restaurant.lat}-${restaurant.lng}`} {...viewProps} />
      )}
    </div>
  )
}

export default RestaurantMap
