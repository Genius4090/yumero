export interface MapViewProps {
  lat: number
  lng: number
  /** Fired when the user finishes dragging/zooming; receives the new map centre. */
  onChange: (lat: number, lng: number) => void
  /** true while the map is being moved (used to lift the pin) */
  onDragStateChange: (dragging: boolean) => void
  /** Provider could not initialise; caller may switch to a fallback */
  onError?: (err: unknown) => void
}
