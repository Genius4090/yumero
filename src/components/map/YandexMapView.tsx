import { useEffect, useRef } from "react"
import { loadYandexMaps } from "@/lib/yandexMaps"
import type { MapViewProps } from "./types"

/** Yandex Maps JS API 2.1. Requires VITE_YANDEX_MAPS_API_KEY. */
const YandexMapView = ({ lat, lng, onChange, onDragStateChange, onError }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<ymaps.Map | null>(null)
  const onChangeRef = useRef(onChange)
  const onDragRef = useRef(onDragStateChange)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onChangeRef.current = onChange
    onDragRef.current = onDragStateChange
    onErrorRef.current = onError
  }, [onChange, onDragStateChange, onError])

  // Load the API and create the map once
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let disposed = false

    loadYandexMaps()
      .then((api) => {
        if (disposed || !containerRef.current) return
        const map = new api.Map(
          containerRef.current,
          { center: [lat, lng], zoom: 16, controls: ["zoomControl"] },
          { suppressMapOpenBlock: true }
        )
        map.events.add("actionbegin", () => onDragRef.current(true))
        map.events.add("actionend", () => {
          onDragRef.current(false)
          const [cLat, cLng] = map.getCenter()
          onChangeRef.current(cLat, cLng)
        })
        mapRef.current = map
        window.setTimeout(() => map.container.fitToViewport(), 250)
      })
      .catch((err) => {
        if (!disposed) onErrorRef.current?.(err)
      })

    return () => {
      disposed = true
      mapRef.current?.destroy()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Follow external coordinate changes (e.g. geolocation) without feedback loops
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const [cLat, cLng] = map.getCenter()
    if (Math.abs(cLat - lat) < 1e-7 && Math.abs(cLng - lng) < 1e-7) return
    map.setCenter([lat, lng], Math.max(map.getZoom(), 16), { duration: 300 })
  }, [lat, lng])

  return <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
}

export default YandexMapView
