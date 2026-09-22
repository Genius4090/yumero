import { createContext, useContext, useMemo } from "react"

export type ToastTone = "success" | "error" | "info"

export interface ToastItem {
  id: number
  tone: ToastTone
  text: string
}

export interface ToastApi {
  push: (tone: ToastTone, text: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

/** `const toast = useToast(); toast.success("Saved")` — rendered by <ToastProvider> in the admin layout. */
export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>")
  return useMemo(
    () => ({
      success: (text: string) => ctx.push("success", text),
      error: (text: string) => ctx.push("error", text),
      info: (text: string) => ctx.push("info", text),
    }),
    [ctx]
  )
}
