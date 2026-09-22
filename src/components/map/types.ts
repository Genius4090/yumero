export type MarkerIcon = "pin" | "restaurant"

export interface MapViewProps {
  lat: number
  lng: number
  zoom?: number
  /** Fired when the user finishes dragging/zooming; receives the new map centre. */
  onChange?: (lat: number, lng: number) => void
  /** true while the map is being moved (used to lift the pin) */
  onDragStateChange?: (dragging: boolean) => void
  /** A real marker fixed at a coordinate (stays put while the map pans). */
  marker?: { lat: number; lng: number; title?: string; icon?: MarkerIcon }
  /** Provider could not initialise; caller may switch to a fallback */
  onError?: (err: unknown) => void
}

/** Red pin used as the centre overlay (MapPicker) and as a generic marker icon. */
export const PIN_SVG = `<svg width="44" height="56" viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="30" x2="22" y2="52" stroke="#111" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="20" r="18" fill="#e63946"/><circle cx="22" cy="20" r="7" fill="#fff"/></svg>`

/** Pink round marker with a fork & knife – marks the restaurant. */
export const RESTAURANT_PIN_SVG = `<svg width="48" height="60" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg"><line x1="24" y1="42" x2="24" y2="56" stroke="#111" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="22" r="20" fill="#ff0099" stroke="#fff" stroke-width="3"/><g transform="translate(13 11) scale(0.92)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></g></svg>`

/** [width, height, anchorX, anchorY] for each marker icon */
export const MARKER_SIZE: Record<MarkerIcon, [number, number, number, number]> = {
  pin: [44, 56, 22, 52],
  restaurant: [48, 60, 24, 56],
}

export const markerSvg = (icon: MarkerIcon = "pin") => (icon === "restaurant" ? RESTAURANT_PIN_SVG : PIN_SVG)
