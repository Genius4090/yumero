import { useCallback, useState } from "react"
import type { addressType } from "@/@types"

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

const persist = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable – keep in-memory state only
  }
}

/** Saved delivery addresses + the currently selected one, persisted in localStorage. */
export const useAddresses = () => {
  const [addresses, setAddresses] = useState<addressType[]>(readList)
  const [selectedId, setSelectedId] = useState<string | null>(readSelected)

  const selectAddress = useCallback((id: string) => {
    setSelectedId(id)
    persist(SELECTED_KEY, id)
  }, [])

  const addAddress = useCallback(
    (data: Omit<addressType, "id">) => {
      const created: addressType = { ...data, id: crypto.randomUUID() }
      setAddresses((prev) => {
        const next = [...prev, created]
        persist(LIST_KEY, JSON.stringify(next))
        return next
      })
      selectAddress(created.id)
      return created
    },
    [selectAddress]
  )

  const selected = addresses.find((a) => a.id === selectedId) ?? null

  return { addresses, selected, selectAddress, addAddress }
}
