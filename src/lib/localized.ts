import type { LocalizedText } from "@/@types"
import type { Locale } from "@/i18n"

/** Text for the locale, falling back to Russian (the source language) and then to any non-empty value. */
export const pickText = (text: LocalizedText | null | undefined, locale: Locale): string => {
  if (!text) return ""
  return text[locale] || text.ru || text.en || text.uz || ""
}

export const emptyLocalized = (): LocalizedText => ({ ru: "", en: "", uz: "" })
