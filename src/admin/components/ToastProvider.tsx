import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ToastContext, type ToastItem, type ToastTone } from "../toast"

const DURATION = 3500
const MAX_VISIBLE = 3

const ICON: Record<ToastTone, typeof CheckCircle2> = { success: CheckCircle2, error: AlertCircle, info: Info }
const ACCENT: Record<ToastTone, string> = { success: "text-[#77FF00]", error: "text-[#ff6b6b]", info: "text-[#4da3ff]" }

/** Minimal top-right toasts for the admin panel: icon + text, auto-dismiss, click to dismiss early. */
const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const timers = useRef(new Map<number, number>())

  const remove = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const schedule = useCallback(
    (id: number) => {
      window.clearTimeout(timers.current.get(id))
      timers.current.set(id, window.setTimeout(() => remove(id), DURATION))
    },
    [remove]
  )

  const push = useCallback(
    (tone: ToastTone, text: string) => {
      const id = ++counter.current
      setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, tone, text }])
      schedule(id)
    },
    [schedule]
  )

  const api = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed top-5 right-5 z-100 flex flex-col items-end gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICON[toast.tone]
            return (
              <motion.button
                key={toast.id}
                type="button"
                layout
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
                role={toast.tone === "error" ? "alert" : "status"}
                onClick={() => remove(toast.id)}
                onMouseEnter={() => window.clearTimeout(timers.current.get(toast.id))}
                onMouseLeave={() => schedule(toast.id)}
                className="pointer-events-auto flex max-w-sm cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-[#1c1c1c] py-3 pr-4 pl-3.5 text-left text-sm font-medium text-white shadow-xl shadow-black/40 outline-none"
              >
                <Icon className={cn("size-4 shrink-0", ACCENT[toast.tone])} />
                <span className="leading-snug">{toast.text}</span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
