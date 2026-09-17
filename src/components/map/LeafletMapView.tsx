import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { MapViewProps } from "./types"

/** OpenStreetMap tiles via Leaflet. Used when no Yandex key is configured. */
const LeafletMapView = ({ lat, lng, onChange, onDragStateChange }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const onChangeRef = useRef(onChange)
  const onDragRef = useRef(onDragStateChange)

  useEffect(() => {
    onChangeRef.current = onChange
    onDragRef.current = onDragStateChange
  }, [onChange, onDragStateChange])

  // Create the map once
  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, { center: [lat, lng], zoom: 16, zoomControl: false })
    L.control.zoom({ position: "bottomright" }).addTo(map)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    map.on("movestart", () => onDragRef.current(true))
    map.on("moveend", () => {
      onDragRef.current(false)
      const c = map.getCenter()
      onChangeRef.current(c.lat, c.lng)
    })
    mapRef.current = map

    // The dialog animates in; make sure tiles fill the final box
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    const t = window.setTimeout(() => map.invalidateSize(), 250)

    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Follow external coordinate changes (e.g. geolocation) without feedback loops
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const c = map.getCenter()
    if (Math.abs(c.lat - lat) < 1e-7 && Math.abs(c.lng - lng) < 1e-7) return
    map.setView([lat, lng], Math.max(map.getZoom(), 16), { animate: true })
  }, [lat, lng])

  return <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
}

export default LeafletMapView
