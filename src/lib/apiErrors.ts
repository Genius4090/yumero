import type { TranslationKey } from "@/i18n"
import { isApiError } from "./api"

const KNOWN = new Set([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "INVALID_CREDENTIALS",
  "PHONE_TAKEN",
  "VERIFICATION_NOT_FOUND",
  "VERIFICATION_EXPIRED",
  "VERIFICATION_NOT_LINKED",
  "CODE_INVALID",
  "CODE_ATTEMPTS_EXCEEDED",
  "RESEND_TOO_SOON",
  "RESEND_LIMIT",
  "TOO_MANY_REQUESTS",
  "PROMO_INVALID",
  "PROMO_EXPIRED",
  "PROMO_EXHAUSTED",
  "PRODUCT_UNAVAILABLE",
  "CART_EMPTY",
  "ADDRESS_REQUIRED",
  "RESTAURANT_CLOSED",
  "ORDER_NOT_CANCELLABLE",
  "INVALID_STATUS_TRANSITION",
  "CATEGORY_NOT_EMPTY",
  "CANNOT_DELETE_SELF",
  "FILE_TOO_LARGE",
  "FILE_TYPE",
  "NETWORK",
  "INTERNAL",
])

/** Dictionary key for an API (or network) error; translate with `t()`. */
export const errorKey = (err: unknown): TranslationKey => {
  if (isApiError(err) && KNOWN.has(err.code)) return `errors.${err.code}` as TranslationKey
  if (err instanceof TypeError) return "errors.NETWORK" // fetch failed
  return "errors.INTERNAL"
}
