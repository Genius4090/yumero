/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import type { orderType } from "@/@types"
import { useCancelOrder, useOrdersQuery } from "@/api/hooks"
import { useAuth } from "./AuthContext"

interface OrdersContextValue {
  /** Newest first (empty for guests) */
  orders: orderType[]
  isLoading: boolean
  /** Cancels the order on the server (allowed only while it is NEW / COOKING). */
  cancelOrder: (id: string) => Promise<void>
  refetch: () => void
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth()
  const query = useOrdersQuery(status === "authed")
  const cancel = useCancelOrder()

  const cancelOrder = useCallback(
    async (id: string) => {
      await cancel.mutateAsync(id)
    },
    [cancel]
  )

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders: query.data ?? [],
      isLoading: status === "loading" || (status === "authed" && query.isPending),
      cancelOrder,
      refetch: () => void query.refetch(),
    }),
    [query, status, cancelOrder]
  )

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>")
  return ctx
}
