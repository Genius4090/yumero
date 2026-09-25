/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { addressType } from "@/@types"
import { useAddressesQuery, useCreateAddress, useDeleteAddress } from "@/api/hooks"
import { useAuth } from "./AuthContext"

const LIST_KEY = "addresses"
const SELECTED_KEY = "selectedAddressId"

const readList = (): addressType[] => {
  try {
    const raw = localStorage.getItem(LIST_KEY)
    return raw ? (JSON.parse(raw) as addressType[]) : []
  } catch {
    return []
  }
}

const readSelected = (): string | null => {
  try {
    return localStorage.getItem(SELECTED_KEY)
  } catch {
    return null
  }
}

const persist = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // storage unavailable – keep in-memory state only
  }
}

const dedupKey = (a: Pick<addressType, "address" | "house">) => `${a.address.trim().toLowerCase()}|${a.house.trim().toLowerCase()}`

export interface AddressContextValue {
  addresses: addressType[]
  selected: addressType | null
  selectAddress: (id: string) => void
  /** Resolves to the created address, or the existing one when street + house already exist. */
  addAddress: (data: Omit<addressType, "id">) => Promise<addressType>
  removeAddress: (id: string) => Promise<void>
}

const AddressContext = createContext<AddressContextValue | null>(null)

/**
 * Saved delivery addresses + the selected one, shared by the header and the checkout page.
 * Guests keep addresses in localStorage; logged-in users use the API. Guest addresses are
 * uploaded once on login so nothing is lost.
 */
export const AddressProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useAuth()
  const authed = status === "authed"

  const [localList, setLocalList] = useState<addressType[]>(readList)
  const [selectedId, setSelectedId] = useState<string | null>(readSelected)

  const query = useAddressesQuery(authed)
  const create = useCreateAddress()
  const remove = useDeleteAddress()

  const addresses = useMemo(() => (authed ? (query.data ?? []) : localList), [authed, query.data, localList])

  // Push guest addresses to the account once after login
  const migrated = useRef(false)
  useEffect(() => {
    if (!authed || migrated.current || localList.length === 0) return
    migrated.current = true
    const pending = localList
    setLocalList([])
    persist(LIST_KEY, null)
    ;(async () => {
      let lastId: string | null = null
      for (const a of pending) {
        try {
          const { id, ...data } = a
          const saved = await create.mutateAsync(data)
          void id
          if (a.id === selectedId) lastId = saved.id
        } catch {
          // best effort
        }
      }
      if (lastId) {
        setSelectedId(lastId)
        persist(SELECTED_KEY, lastId)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  useEffect(() => {
    if (!authed) migrated.current = false
  }, [authed])

  const selectAddress = useCallback((id: string) => {
    setSelectedId(id)
    persist(SELECTED_KEY, id)
  }, [])

  const addAddress = useCallback<AddressContextValue["addAddress"]>(
    async (data) => {
      if (authed) {
        const saved = await create.mutateAsync(data)
        selectAddress(saved.id)
        return saved
      }
      const existing = localList.find((a) => dedupKey(a) === dedupKey(data))
      if (existing) {
        selectAddress(existing.id)
        return existing
      }
      const created: addressType = { ...data, id: crypto.randomUUID() }
      const next = [...localList, created]
      setLocalList(next)
      persist(LIST_KEY, JSON.stringify(next))
      selectAddress(created.id)
      return created
    },
    [authed, create, localList, selectAddress]
  )

  const removeAddress = useCallback<AddressContextValue["removeAddress"]>(
    async (id) => {
      const remaining = (authed ? (query.data ?? []) : localList).filter((a) => a.id !== id)
      if (!authed) {
        setLocalList(remaining)
        persist(LIST_KEY, JSON.stringify(remaining))
      }
      // if the selected one was removed, fall back to the first remaining address (right away: the row leaves the list at once)
      const previous = selectedId
      if (previous === id) {
        const fallback = remaining[0]?.id ?? null
        setSelectedId(fallback)
        persist(SELECTED_KEY, fallback)
      }
      if (!authed) return
      try {
        await remove.mutateAsync(id)
      } catch (err) {
        // the list is restored by the mutation; restore the selection too
        if (previous === id) selectAddress(id)
        throw err
      }
    },
    [authed, remove, query.data, localList, selectedId, selectAddress]
  )

  // the selected address may have been deleted on another device: fall back to the first one, like a local delete does
  const selected = addresses.find((a) => a.id === selectedId) ?? addresses[0] ?? null

  return (
    <AddressContext.Provider value={{ addresses, selected, selectAddress, addAddress, removeAddress }}>{children}</AddressContext.Provider>
  )
}

export const useAddressContext = () => {
  const ctx = useContext(AddressContext)
  if (!ctx) throw new Error("useAddresses must be used inside <AddressProvider>")
  return ctx
}
