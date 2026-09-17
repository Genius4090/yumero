/**
 * Lazy loader for the Yandex Maps JS API 2.1.
 * The key comes from VITE_YANDEX_MAPS_API_KEY (see .env.example). Without a key
 * `hasYandexKey` is false and callers should use the Leaflet/OSM fallback.
 */
const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined

export const hasYandexKey = Boolean(API_KEY && API_KEY.trim())

let loader: Promise<typeof ymaps> | null = null

export const loadYandexMaps = (): Promise<typeof ymaps> => {
  if (!hasYandexKey) return Promise.reject(new Error("VITE_YANDEX_MAPS_API_KEY is not set"))
  if (loader) return loader

  loader = new Promise<typeof ymaps>((resolve, reject) => {
    if (typeof window.ymaps !== "undefined") {
      window.ymaps.ready(() => resolve(window.ymaps))
      return
    }
    const script = document.createElement("script")
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(API_KEY!)}&lang=ru_RU`
    script.async = true
    const timeout = window.setTimeout(() => reject(new Error("Yandex Maps load timeout")), 15000)
    script.onload = () => {
      if (typeof window.ymaps === "undefined") {
        window.clearTimeout(timeout)
        reject(new Error("ymaps global missing after load"))
        return
      }
      window.ymaps.ready(() => {
        window.clearTimeout(timeout)
        resolve(window.ymaps)
      })
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error("Yandex Maps script failed to load"))
    }
    document.head.appendChild(script)
  }).catch((err) => {
    loader = null // allow a retry later
    throw err
  })

  return loader
}

declare global {
  interface Window {
    ymaps: typeof ymaps
  }
}
