import { useCallback, useState } from "react"
import { hasYandexKey } from "@/lib/yandexMaps"
import LeafletMapView from "./map/LeafletMapView"
import YandexMapView from "./map/YandexMapView"

interface MapPickerProps {
  lat: number
  lng: number
  /** Fired when the user finishes dragging/zooming; receives the new map centre. */
  onChange: (lat: number, lng: number) => void
  className?: string
}

/**
 * Yandex-style picker: the pin is fixed in the middle of the viewport and the
 * user drags the map underneath it. The map centre *is* the chosen location.
 * Uses Yandex Maps when a key is configured, otherwise Leaflet + OpenStreetMap.
 */
const MapPicker = ({ lat, lng, onChange, className = "" }: MapPickerProps) => {
  const [dragging, setDragging] = useState(false)
  const [provider, setProvider] = useState<"yandex" | "leaflet">(hasYandexKey ? "yandex" : "leaflet")

  const handleYandexError = useCallback((err: unknown) => {
    console.warn("Yandex Maps unavailable, falling back to OpenStreetMap:", err)
    setProvider("leaflet")
  }, [])

  const viewProps = { lat, lng, onChange, onDragStateChange: setDragging }

  return (
    <div className={`relative ${className}`}>
      {provider === "yandex" ? (
        <YandexMapView key="yandex" {...viewProps} onError={handleYandexError} />
      ) : (
        <LeafletMapView key="leaflet" {...viewProps} />
      )}

      {/* Fixed centre pin; its tip marks the exact coordinate */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-1100 -translate-x-1/2 -translate-y-full"
      >
        <svg
          width="44"
          height="56"
          viewBox="0 0 44 56"
          className={`transition-transform duration-200 ease-out ${dragging ? "-translate-y-2" : "translate-y-0"}`}
        >
          <line x1="22" y1="30" x2="22" y2="52" stroke="#111" strokeWidth="3" strokeLinecap="round" />
          <circle cx="22" cy="20" r="18" fill="#e63946" />
          <circle cx="22" cy="20" r="7" fill="#fff" />
        </svg>
        <span
          className={`mx-auto block h-1.5 rounded-full bg-black/40 blur-[1px] transition-all duration-200 ${
            dragging ? "w-3 opacity-60" : "w-5 opacity-90"
          }`}
        />
      </div>
    </div>
  )
}

export default MapPicker
