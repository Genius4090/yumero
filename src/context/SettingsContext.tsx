/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { detectLocale, isLocale, type Locale } from "@/i18n"

export interface AppSettings {
  /** Close the product modal when opening the cart from it. */
  closeProductAfterAdd: boolean
  /** UI language. */
  locale: Locale
}

const DEFAULTS: AppSettings = {
  closeProductAfterAdd: true,
  locale: detectLocale(),
}

const STORAGE_KEY = "settings"

const read = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const stored = JSON.parse(raw) as Partial<AppSettings>
    // ignore a stale/unknown locale value rather than rendering raw keys
    if (!isLocale(stored.locale)) delete stored.locale
    return { ...DEFAULTS, ...stored }
  } catch {
    return DEFAULTS
  }
}

interface SettingsContextValue {
  settings: AppSettings
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(read)

  const setSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // storage unavailable – in-memory only
      }
      return next
    })
  }, [])

  // Keep <html lang> in sync so screen readers / hyphenation / form autofill pick the right language
  useEffect(() => {
    document.documentElement.lang = settings.locale
  }, [settings.locale])

  return <SettingsContext.Provider value={{ settings, setSetting }}>{children}</SettingsContext.Provider>
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>")
  return ctx
}
