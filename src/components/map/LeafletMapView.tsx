import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MARKER_SIZE, markerSvg, type MapViewProps, type MarkerIcon } from "./types"

const makeIcon = (icon: MarkerIcon = "pin") => {
  const [w, h, ax, ay] = MARKER_SIZE[icon]
  return L.divIcon({ html: markerSvg(icon), className: "", iconSize: [w, h], iconAnchor: [ax, ay] })
}

/** OpenStreetMap tiles via Leaflet. Used when no Yandex key is configured. */
const LeafletMapView = ({ lat, lng, zoom = 16, onChange, onDragStateChange, marker }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
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

    const map = L.map(el, { center: [lat, lng], zoom, zoomControl: false })
    L.control.zoom({ position: "bottomright" }).addTo(map)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    map.on("movestart", () => onDragRef.current?.(true))
    map.on("moveend", () => {
      onDragRef.current?.(false)
      const c = map.getCenter()
      onChangeRef.current?.(c.lat, c.lng)
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
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fixed marker (restaurant etc.)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!marker) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([marker.lat, marker.lng])
      markerRef.current.setIcon(makeIcon(marker.icon))
    } else {
      markerRef.current = L.marker([marker.lat, marker.lng], { icon: makeIcon(marker.icon), title: marker.title, interactive: false }).addTo(map)
    }
  }, [marker])

  // Follow external coordinate changes (e.g. geolocation) without feedback loops
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const c = map.getCenter()
    if (Math.abs(c.lat - lat) < 1e-7 && Math.abs(c.lng - lng) < 1e-7) return
    map.setView([lat, lng], Math.max(map.getZoom(), zoom), { animate: true })
  }, [lat, lng, zoom])

  return <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
}

export default LeafletMapView
