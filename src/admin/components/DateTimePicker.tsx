import { useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { useI18n } from "@/i18n/useI18n"
import { cn } from "@/lib/utils"
import { Btn, NumberInput, inputCls } from "../ui"

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** 6 rows × 7 days starting on Monday, including the dimmed days of the neighbouring months. */
const monthGrid = (view: Date) => {
  const first = startOfMonth(view)
  const offset = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i - offset + 1))
}

/**
 * Dark date + time picker (replaces <input type="datetime-local">).
 * `value` is an ISO string or null; the popover edits it in local time with minute precision.
 */
const DateTimePicker = ({ value, onChange, placeholder, id, className }: { value: string | null; onChange: (iso: string | null) => void; placeholder?: string; id?: string; className?: string }) => {
  const { t, tag } = useI18n()
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(value) : null
  const [view, setView] = useState(() => startOfMonth(selected ?? new Date()))
  const today = new Date()

  const handleOpenChange = (o: boolean) => {
    if (o) setView(startOfMonth(selected ?? new Date()))
    setOpen(o)
  }

  const pickDay = (day: Date) => {
    const d = new Date(day)
    d.setHours(selected?.getHours() ?? 0, selected?.getMinutes() ?? 0, 0, 0)
    onChange(d.toISOString())
  }
  const setTime = (hours: number, minutes: number) => {
    const d = selected ? new Date(selected) : new Date()
    d.setHours(hours, minutes, 0, 0)
    onChange(d.toISOString())
  }
  const setNow = () => {
    const d = new Date()
    d.setSeconds(0, 0)
    onChange(d.toISOString())
    setView(startOfMonth(d))
  }

  // Monday-first weekday labels in the current language (2024-01-01 is a Monday)
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(tag, { weekday: "short" }))
  const label = selected ? selected.toLocaleString(tag, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : (placeholder ?? t("admin.common.notSet"))

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <div className={cn("relative", className)}>
        <PopoverPrimitive.Trigger asChild>
          <button type="button" id={id} className={cn(inputCls, "flex cursor-pointer items-center gap-3 pr-11 text-left")}>
            <CalendarDays className="size-4 shrink-0 text-[#8a8a8a]" />
            <span className={cn("flex-1 truncate", !selected && "text-[#7a7a7a]")}>{label}</span>
          </button>
        </PopoverPrimitive.Trigger>
        {selected && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t("admin.common.clear")}
            className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-[#8a8a8a] transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-70 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#1c1c1c] p-4 text-white shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#c4c4c4] transition-colors hover:bg-white/10 hover:text-white"
              aria-label="‹"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-semibold">{capitalize(view.toLocaleDateString(tag, { month: "long", year: "numeric" }))}</p>
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#c4c4c4] transition-colors hover:bg-white/10 hover:text-white"
              aria-label="›"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((w) => (
              <span key={w} className="py-1 text-[11px] font-semibold text-[#8a8a8a] uppercase">
                {w}
              </span>
            ))}
            {monthGrid(view).map((day) => {
              const inMonth = day.getMonth() === view.getMonth()
              const isSelected = selected ? sameDay(day, selected) : false
              const isToday = sameDay(day, today)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={cn(
                    "grid h-9 cursor-pointer place-items-center rounded-lg text-sm transition-colors",
                    inMonth ? "text-white" : "text-[#5a5a5a]",
                    isSelected ? "bg-[#ff0099] font-semibold text-white hover:bg-[#ff2bab]" : "hover:bg-white/10",
                    isToday && !isSelected && "ring-1 ring-[#ff0099]/70"
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-4">
            <span className="text-sm text-[#c4c4c4]">{t("admin.common.time")}</span>
            <div className="ml-auto flex items-center gap-2">
              <NumberInput
                value={selected ? selected.getHours() : null}
                onChange={(h) => setTime(h ?? 0, selected?.getMinutes() ?? 0)}
                min={0}
                max={23}
                placeholder="00"
                className="w-22"
                aria-label="HH"
              />
              <span className="font-semibold text-[#8a8a8a]">:</span>
              <NumberInput
                value={selected ? selected.getMinutes() : null}
                onChange={(m) => setTime(selected?.getHours() ?? 0, m ?? 0)}
                min={0}
                max={59}
                placeholder="00"
                className="w-22"
                aria-label="MM"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Btn size="sm" onClick={setNow}>
                {t("admin.common.today")}
              </Btn>
              {selected && (
                <Btn size="sm" onClick={() => onChange(null)}>
                  {t("admin.common.clear")}
                </Btn>
              )}
            </div>
            <Btn size="sm" variant="primary" onClick={() => setOpen(false)}>
              {t("admin.common.done")}
            </Btn>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export default DateTimePicker
