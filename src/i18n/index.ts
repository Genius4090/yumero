import { ru } from "./ru"
import { en } from "./en"
import { uz } from "./uz"
import type { PluralForms } from "./plural"

export type { PluralForms } from "./plural"

export type Locale = "ru" | "en" | "uz"

export const LOCALES: readonly Locale[] = ["ru", "en", "uz"]
export const DEFAULT_LOCALE: Locale = "ru"

/** BCP 47 tags for Intl formatters. */
export const LOCALE_TAGS: Record<Locale, string> = { ru: "ru-RU", en: "en-US", uz: "uz-Latn-UZ" }

/** Language names in their own language (for the switcher). */
export const LOCALE_NAMES: Record<Locale, string> = { ru: "Русский", en: "English", uz: "O'zbekcha" }

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v)

/** Best locale for a first visit: the browser language if we support it, otherwise Russian. */
export const detectLocale = (): Locale => {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE
  for (const lang of navigator.languages ?? [navigator.language]) {
    const short = lang?.slice(0, 2).toLowerCase()
    if (isLocale(short)) return short
  }
  return DEFAULT_LOCALE
}

export type Dictionary = typeof ru
export const dictionaries: Record<Locale, Dictionary> = { ru, en, uz }

/* ---------- typed dot-path keys ---------- */

type TextPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : T[K] extends PluralForms ? never : `${K}.${TextPaths<T[K]>}`
}[keyof T & string]

type PluralPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? never : T[K] extends PluralForms ? K : `${K}.${PluralPaths<T[K]>}`
}[keyof T & string]

export type TranslationKey = TextPaths<Dictionary>
export type PluralKey = PluralPaths<Dictionary>

export type TranslationParams = Record<string, string | number>

const lookup = (dict: Dictionary, path: string): unknown =>
  path.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), dict)

const interpolate = (template: string, params?: TranslationParams) =>
  params ? template.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m)) : template

const pluralRules = new Map<Locale, Intl.PluralRules>()
const rulesFor = (locale: Locale) => {
  let rules = pluralRules.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(LOCALE_TAGS[locale])
    pluralRules.set(locale, rules)
  }
  return rules
}

export interface Translator {
  locale: Locale
  /** ISO tag for `Intl` / `toLocaleString`. */
  tag: string
  t: (key: TranslationKey, params?: TranslationParams) => string
  /** plural(3, "order.items") -> "3 товара" / "3 items" / "3 ta mahsulot" */
  plural: (n: number, key: PluralKey) => string
}

export const createTranslator = (locale: Locale): Translator => {
  const dict = dictionaries[locale]
  const fallback = dictionaries[DEFAULT_LOCALE]

  const t: Translator["t"] = (key, params) => {
    const value = lookup(dict, key) ?? lookup(fallback, key)
    return typeof value === "string" ? interpolate(value, params) : key
  }

  const plural: Translator["plural"] = (n, key) => {
    const forms = (lookup(dict, key) ?? lookup(fallback, key)) as PluralForms | undefined
    if (!forms) return `${n} ${key}`
    const rule = rulesFor(locale).select(n) as keyof PluralForms
    return `${n} ${forms[rule] ?? forms.other}`
  }

  return { locale, tag: LOCALE_TAGS[locale], t, plural }
}
