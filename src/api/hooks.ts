import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { addressType, bannerType, categoryType, orderType, productType, restaurantSettingsType } from "@/@types"
import { apiFetch } from "@/lib/api"
import { isActiveOrder } from "@/lib/orders"

export const queryKeys = {
  categories: ["categories"] as const,
  products: (params: ProductParams) => ["products", params] as const,
  product: (id: number) => ["product", id] as const,
  banners: ["banners"] as const,
  settings: ["settings"] as const,
  addresses: ["addresses"] as const,
  orders: ["orders"] as const,
}

/* ---------- catalogue ---------- */

export const useCategories = () =>
  useQuery({ queryKey: queryKeys.categories, queryFn: () => apiFetch<categoryType[]>("/api/categories", { auth: false }), staleTime: 5 * 60_000 })

export interface ProductParams {
  categoryId?: number
  popular?: boolean
  search?: string
}

export interface ProductPage {
  items: productType[]
  total: number
}

const productQuery = (p: ProductParams) => {
  const q = new URLSearchParams()
  if (p.categoryId) q.set("categoryId", String(p.categoryId))
  if (p.popular) q.set("popular", "true")
  if (p.search) q.set("search", p.search)
  q.set("limit", "200")
  return q.toString()
}

export const useProducts = (params: ProductParams) =>
  useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => apiFetch<ProductPage>(`/api/products?${productQuery(params)}`, { auth: false }),
    placeholderData: (prev) => prev,
  })

export const useBanners = () =>
  useQuery({ queryKey: queryKeys.banners, queryFn: () => apiFetch<bannerType[]>("/api/banners", { auth: false }), staleTime: 5 * 60_000 })

export const useSettings = () =>
  useQuery({ queryKey: queryKeys.settings, queryFn: () => apiFetch<restaurantSettingsType>("/api/settings", { auth: false }), staleTime: 5 * 60_000 })

/* ---------- addresses ---------- */

export const useAddressesQuery = (enabled: boolean) =>
  useQuery({ queryKey: queryKeys.addresses, queryFn: () => apiFetch<addressType[]>("/api/addresses"), enabled })

export const useCreateAddress = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<addressType, "id">) => apiFetch<addressType>("/api/addresses", { method: "POST", body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses }),
  })
}

export const useDeleteAddress = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/addresses/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.addresses }),
  })
}

/* ---------- orders ---------- */

export const useOrdersQuery = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => apiFetch<orderType[]>("/api/orders"),
    enabled,
    // keep polling while something is being cooked / delivered so status badges update live
    refetchInterval: (query) => (query.state.data?.some(isActiveOrder) ? 15_000 : false),
  })

export interface CreateOrderInput {
  mode: "delivery" | "pickup"
  paymentMethod: "cash" | "card"
  addressId?: string
  addressText?: string
  comment: string
  promoCode?: string
  items: { productId: number; quantity: number }[]
}

export const useCreateOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateOrderInput) => apiFetch<orderType>("/api/orders", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders }),
  })
}

export const useCancelOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<orderType>(`/api/orders/${id}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders }),
  })
}

/* ---------- promo / newsletter ---------- */

export interface PromoResult {
  code: string
  percent: number
  discount: number
}

export const useValidatePromo = () =>
  useMutation({ mutationFn: (input: { code: string; subtotal: number }) => apiFetch<PromoResult>("/api/promo/validate", { method: "POST", body: input }) })

export const useSubscribeNewsletter = () =>
  useMutation({ mutationFn: (email: string) => apiFetch<void>("/api/newsletter", { method: "POST", body: { email }, auth: false }) })
