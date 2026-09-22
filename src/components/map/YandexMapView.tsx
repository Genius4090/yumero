import { useEffect, useRef } from "react"
import { loadYandexMaps } from "@/lib/yandexMaps"
import { MARKER_SIZE, markerSvg, type MapViewProps } from "./types"

/** Yandex Maps JS API 2.1. Requires VITE_YANDEX_MAPS_API_KEY. */
const YandexMapView = ({ lat, lng, zoom = 16, onChange, onDragStateChange, marker, onError }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<ymaps.Map | null>(null)
  const markerRef = useRef<ymaps.Placemark | null>(null)
  const apiRef = useRef<typeof ymaps | null>(null)
  const onChangeRef = useRef(onChange)
  const onDragRef = useRef(onDragStateChange)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onChangeRef.current = onChange
    onDragRef.current = onDragStateChange
    onErrorRef.current = onError
  }, [onChange, onDragStateChange, onError])

  const syncMarker = (api: typeof ymaps, map: ymaps.Map) => {
    if (!marker) {
      if (markerRef.current) map.geoObjects.remove(markerRef.current)
      markerRef.current = null
      return
    }
    if (markerRef.current) {
      markerRef.current.geometry?.setCoordinates([marker.lat, marker.lng])
      return
    }
    const [, , ax, ay] = MARKER_SIZE[marker.icon ?? "pin"]
    const layout = api.templateLayoutFactory.createClass(markerSvg(marker.icon))
    markerRef.current = new api.Placemark(
      [marker.lat, marker.lng],
      { hintContent: marker.title ?? "" },
      { iconLayout: layout, iconOffset: [-ax, -ay] }
    )
    map.geoObjects.add(markerRef.current)
  }

  // Load the API and create the map once
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let disposed = false

    loadYandexMaps()
      .then((api) => {
        if (disposed || !containerRef.current) return
        apiRef.current = api
        const map = new api.Map(
          containerRef.current,
          { center: [lat, lng], zoom, controls: ["zoomControl"] },
          { suppressMapOpenBlock: true }
        )
        map.events.add("actionbegin", () => onDragRef.current?.(true))
        map.events.add("actionend", () => {
          onDragRef.current?.(false)
          const [cLat, cLng] = map.getCenter()
          onChangeRef.current?.(cLat, cLng)
        })
        mapRef.current = map
        syncMarker(api, map)
        window.setTimeout(() => map.container.fitToViewport(), 250)
      })
      .catch((err) => {
        if (!disposed) onErrorRef.current?.(err)
      })

    return () => {
      disposed = true
      mapRef.current?.destroy()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (apiRef.current && mapRef.current) syncMarker(apiRef.current, mapRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker])

  // Follow external coordinate changes (e.g. geolocation) without feedback loops
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const [cLat, cLng] = map.getCenter()
    if (Math.abs(cLat - lat) < 1e-7 && Math.abs(cLng - lng) < 1e-7) return
    map.setCenter([lat, lng], Math.max(map.getZoom(), zoom), { duration: 300 })
  }, [lat, lng, zoom])

  return <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
}

export default YandexMapView
