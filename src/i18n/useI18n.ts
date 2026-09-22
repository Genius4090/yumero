import { useMemo } from "react"
import { useSettings } from "@/context/SettingsContext"
import { createTranslator, type Translator } from "./index"

/** `const { t, plural, locale, tag } = useI18n()` — bound to the locale from settings. */
export const useI18n = (): Translator => {
  const { settings } = useSettings()
  return useMemo(() => createTranslator(settings.locale), [settings.locale])
}
