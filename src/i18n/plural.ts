/** CLDR plural categories; `other` is the required fallback. */
export interface PluralForms {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

/** Identity helper so dictionaries keep the `PluralForms` type instead of the literal object shape. */
export const p = (forms: PluralForms): PluralForms => forms
