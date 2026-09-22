import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query"
import type { LocalizedText, addressType, adminUserType, bannerType, categoryType, orderStatusApi, orderType, productType, promoCodeType, restaurantSettingsType } from "@/@types"
import { apiFetch } from "@/lib/api"
import { queryKeys } from "@/api/hooks"

const A = "/api/admin"

export const adminKeys = {
  dashboard: (days: number) => ["admin", "dashboard", days] as const,
  users: (params: UsersParams) => ["admin", "users", params] as const,
  userAddresses: (id: string) => ["admin", "users", id, "addresses"] as const,
  staff: ["admin", "staff"] as const,
  products: (params: AdminProductParams) => ["admin", "products", params] as const,
  categories: ["admin", "categories"] as const,
  banners: ["admin", "banners"] as const,
  promos: ["admin", "promos"] as const,
  orders: (params: AdminOrderParams) => ["admin", "orders", params] as const,
  settings: ["admin", "settings"] as const,
}

/** Mutation that invalidates admin + public caches so the storefront reflects changes immediately. */
const useAdminMutation = <TInput, TResult>(fn: (input: TInput) => Promise<TResult>, keys: QueryKey[]) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of keys) void qc.invalidateQueries({ queryKey: key })
    },
  })
}

/* ---------- dashboard ---------- */

export interface DashboardData {
  activeOrders: number
  ordersToday: number
  revenueToday: number
  productsCount: number
  subscribers: number
  customers: number
  byStatus: Partial<Record<orderStatusApi, number>>
  days: number
  series: { date: string; orders: number; revenue: number }[]
  period: { orders: number; revenue: number; averageOrder: number }
}

export const useDashboard = (days: number) =>
  useQuery({ queryKey: adminKeys.dashboard(days), queryFn: () => apiFetch<DashboardData>(`${A}/dashboard?days=${days}`), refetchInterval: 30_000, placeholderData: (prev) => prev })

const DASHBOARD_KEY: QueryKey = ["admin", "dashboard"]

/* ---------- products ---------- */

export interface AdminProductParams {
  categoryId?: number
  popular?: boolean
  search?: string
}

export interface ProductInput {
  categoryId: number
  name: LocalizedText
  description: LocalizedText
  price: number
  imageUrl: string | null
  isPopular: boolean
  isAvailable: boolean
  sort: number
}

export const useAdminProducts = (params: AdminProductParams) =>
  useQuery({
    queryKey: adminKeys.products(params),
    queryFn: () => {
      const q = new URLSearchParams({ includeUnavailable: "true", limit: "500" })
      if (params.categoryId) q.set("categoryId", String(params.categoryId))
      if (params.popular) q.set("popular", "true")
      if (params.search) q.set("search", params.search)
      return apiFetch<{ items: productType[]; total: number }>(`${A}/products?${q}`)
    },
    placeholderData: (prev) => prev,
  })

const productKeys: QueryKey[] = [["admin", "products"], ["products"], DASHBOARD_KEY]

export const useSaveProduct = () =>
  useAdminMutation(
    ({ id, data }: { id?: number; data: ProductInput }) =>
      id ? apiFetch<productType>(`${A}/products/${id}`, { method: "PATCH", body: data }) : apiFetch<productType>(`${A}/products`, { method: "POST", body: data }),
    productKeys
  )

export const useDeleteProduct = () =>
  useAdminMutation((id: number) => apiFetch<{ deleted: boolean; hidden: boolean }>(`${A}/products/${id}`, { method: "DELETE" }), productKeys)

/* ---------- categories ---------- */

export type AdminCategory = categoryType & { productsCount: number }

export interface CategoryInput {
  slug: string
  name: LocalizedText
  color: string
  sort: number
  isActive: boolean
}

export const useAdminCategories = () => useQuery({ queryKey: adminKeys.categories, queryFn: () => apiFetch<AdminCategory[]>(`${A}/categories`) })

const categoryKeys: QueryKey[] = [adminKeys.categories, queryKeys.categories, ["products"], ["admin", "products"]]

export const useSaveCategory = () =>
  useAdminMutation(
    ({ id, data }: { id?: number; data: CategoryInput }) =>
      id ? apiFetch<categoryType>(`${A}/categories/${id}`, { method: "PATCH", body: data }) : apiFetch<categoryType>(`${A}/categories`, { method: "POST", body: data }),
    categoryKeys
  )

export const useDeleteCategory = () => useAdminMutation((id: number) => apiFetch<void>(`${A}/categories/${id}`, { method: "DELETE" }), categoryKeys)

/** Drag-and-drop: optimistic reorder of the cached admin list, rolled back if the server rejects it. */
const useReorder = <T extends { id: number }>(path: string, listKey: QueryKey, invalidate: QueryKey[]) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => apiFetch<T[]>(`${A}/${path}/reorder`, { method: "PATCH", body: { ids } }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: listKey })
      const previous = qc.getQueryData<T[]>(listKey)
      if (previous) {
        const byId = new Map(previous.map((i) => [i.id, i]))
        qc.setQueryData<T[]>(
          listKey,
          ids.map((id, index) => ({ ...byId.get(id)!, sort: index * 10 }))
        )
      }
      return { previous }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous)
    },
    onSettled: () => {
      for (const key of invalidate) void qc.invalidateQueries({ queryKey: key })
    },
  })
}

export const useReorderCategories = () => useReorder<AdminCategory>("categories", adminKeys.categories, categoryKeys)

/* ---------- banners ---------- */

export interface BannerInput {
  imageUrl: string
  link: string | null
  sort: number
  isActive: boolean
}

export const useAdminBanners = () => useQuery({ queryKey: adminKeys.banners, queryFn: () => apiFetch<bannerType[]>(`${A}/banners`) })

const bannerKeys: QueryKey[] = [adminKeys.banners, queryKeys.banners]

export const useSaveBanner = () =>
  useAdminMutation(
    ({ id, data }: { id?: number; data: BannerInput }) =>
      id ? apiFetch<bannerType>(`${A}/banners/${id}`, { method: "PATCH", body: data }) : apiFetch<bannerType>(`${A}/banners`, { method: "POST", body: data }),
    bannerKeys
  )

export const useDeleteBanner = () => useAdminMutation((id: number) => apiFetch<void>(`${A}/banners/${id}`, { method: "DELETE" }), bannerKeys)
export const useReorderBanners = () => useReorder<bannerType>("banners", adminKeys.banners, bannerKeys)

/* ---------- promo codes ---------- */

export interface PromoInput {
  code: string
  percent: number
  isActive: boolean
  validFrom: string | null
  validTo: string | null
  maxUses: number | null
}

export const useAdminPromos = () => useQuery({ queryKey: adminKeys.promos, queryFn: () => apiFetch<promoCodeType[]>(`${A}/promo-codes`) })

export const useSavePromo = () =>
  useAdminMutation(
    ({ id, data }: { id?: number; data: PromoInput }) =>
      id ? apiFetch<promoCodeType>(`${A}/promo-codes/${id}`, { method: "PATCH", body: data }) : apiFetch<promoCodeType>(`${A}/promo-codes`, { method: "POST", body: data }),
    [adminKeys.promos]
  )

export const useDeletePromo = () => useAdminMutation((id: number) => apiFetch<void>(`${A}/promo-codes/${id}`, { method: "DELETE" }), [adminKeys.promos])

/* ---------- orders ---------- */

export interface AdminOrderParams {
  status?: orderStatusApi
  active?: boolean
  search?: string
  page: number
  pageSize: number
}

export interface AdminOrdersPage {
  items: orderType[]
  total: number
  page: number
  pageSize: number
}

export const useAdminOrders = (params: AdminOrderParams) =>
  useQuery({
    queryKey: adminKeys.orders(params),
    queryFn: () => {
      const q = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) })
      if (params.status) q.set("status", params.status)
      if (params.active) q.set("active", "true")
      if (params.search) q.set("search", params.search)
      return apiFetch<AdminOrdersPage>(`${A}/orders?${q}`)
    },
    placeholderData: (prev) => prev,
    refetchInterval: 10_000,
  })

export const useSetOrderStatus = () =>
  useAdminMutation(
    ({ id, status }: { id: string; status: orderStatusApi }) => apiFetch<orderType>(`${A}/orders/${id}/status`, { method: "PATCH", body: { status } }),
    [["admin", "orders"], DASHBOARD_KEY, queryKeys.orders]
  )

export type AdminOrderCustomer = { type: "client"; userId: string } | { type: "custom"; name: string; phone: string }

export interface AdminCreateOrderInput {
  customer: AdminOrderCustomer
  mode: "delivery" | "pickup"
  paymentMethod: "cash" | "card"
  addressId?: string
  addressText?: string
  comment: string
  promoCode?: string
  items: { productId: number; quantity: number }[]
}

export const useCreateAdminOrder = () =>
  useAdminMutation((body: AdminCreateOrderInput) => apiFetch<orderType>(`${A}/orders`, { method: "POST", body }), [["admin", "orders"], DASHBOARD_KEY, ["admin", "users"]])

/* ---------- customers ---------- */

export interface UsersParams {
  search?: string
  page: number
  pageSize: number
}

export interface UsersPage {
  items: adminUserType[]
  total: number
  page: number
  pageSize: number
}

export interface UserInput {
  fullName: string
  phone: string
  password: string
  avatarUrl?: string | null
}

export type UserPatch = Partial<UserInput>

export const useAdminUsers = (params: UsersParams, enabled = true) =>
  useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => {
      const q = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) })
      if (params.search) q.set("search", params.search)
      return apiFetch<UsersPage>(`${A}/users?${q}`)
    },
    placeholderData: (prev) => prev,
    enabled,
  })

/** Customer picker in the order dialog: searches once the query has at least 2 characters. */
export const useCustomerSearch = (search: string) => useAdminUsers({ search, page: 1, pageSize: 8 }, search.trim().length >= 2)

export const useCustomerAddresses = (userId: string | null) =>
  useQuery({ queryKey: adminKeys.userAddresses(userId ?? ""), queryFn: () => apiFetch<addressType[]>(`${A}/users/${userId}/addresses`), enabled: Boolean(userId) })

const userKeys: QueryKey[] = [["admin", "users"], DASHBOARD_KEY]

export const useSaveUser = () =>
  useAdminMutation(
    ({ id, data }: { id?: string; data: UserInput | UserPatch }) =>
      id ? apiFetch<adminUserType>(`${A}/users/${id}`, { method: "PATCH", body: data }) : apiFetch<adminUserType>(`${A}/users`, { method: "POST", body: data }),
    userKeys
  )

export const useDeleteUser = () => useAdminMutation((id: string) => apiFetch<void>(`${A}/users/${id}`, { method: "DELETE" }), userKeys)

/* ---------- staff (superadmin) ---------- */

export const useStaff = () => useQuery({ queryKey: adminKeys.staff, queryFn: () => apiFetch<adminUserType[]>(`${A}/staff`) })

export const useSaveStaff = () =>
  useAdminMutation(
    ({ id, data }: { id?: string; data: UserInput | UserPatch }) =>
      id ? apiFetch<adminUserType>(`${A}/staff/${id}`, { method: "PATCH", body: data }) : apiFetch<adminUserType>(`${A}/staff`, { method: "POST", body: data }),
    [adminKeys.staff]
  )

export const useDeleteStaff = () => useAdminMutation((id: string) => apiFetch<void>(`${A}/staff/${id}`, { method: "DELETE" }), [adminKeys.staff])

/* ---------- settings ---------- */

export const useAdminSettings = () => useQuery({ queryKey: adminKeys.settings, queryFn: () => apiFetch<restaurantSettingsType>(`${A}/settings`) })

export const useSaveSettings = () =>
  useAdminMutation((data: Partial<restaurantSettingsType>) => apiFetch<restaurantSettingsType>(`${A}/settings`, { method: "PATCH", body: data }), [
    adminKeys.settings,
    queryKeys.settings,
  ])
