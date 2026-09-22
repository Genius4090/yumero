import { useAddressContext } from "@/context/AddressContext"

/** Saved delivery addresses + the currently selected one (shared app-wide via AddressProvider). */
export const useAddresses = useAddressContext
