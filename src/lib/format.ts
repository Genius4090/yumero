const NBSP = String.fromCharCode(160)

/** 39000 -> "39 000 UZS" (ru-RU grouping, with a regular space instead of NBSP) */
export const formatPrice = (value: number | string) =>
  `${Number(value).toLocaleString("ru-RU").split(NBSP).join(" ")} UZS`
