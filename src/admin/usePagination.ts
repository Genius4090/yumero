import { useState } from "react"

/** Rows per page in every admin table. */
export const PAGE_SIZE = 20

/**
 * Client-side pagination for lists the API returns whole (categories, promo codes, staff…).
 * The page is clamped, so deleting the last row of the last page never shows an empty page.
 */
export const usePagination = <T>(items: T[] | undefined, pageSize = PAGE_SIZE) => {
  const [page, setPage] = useState(1)
  const total = items?.length ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const from = (current - 1) * pageSize
  const slice = items ? items.slice(from, from + pageSize) : []
  return { page: current, pages, setPage, slice, from, total }
}
