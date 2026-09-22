import { Minus, Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/i18n/useI18n"

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  /** Renders a trash button and lets "−" go down to 0, which calls this instead of onChange. */
  onRemove?: () => void
  min?: number
  size?: "md" | "sm"
  className?: string
}

/** − / count / + control in the site's dark-magenta style. */
const QuantityStepper = ({ value, onChange, onRemove, min, size = "md", className = "" }: QuantityStepperProps) => {
  const { t } = useI18n()
  const floor = min ?? (onRemove ? 0 : 1)
  const btn = size === "sm" ? "size-10" : "size-12"
  const icon = size === "sm" ? "size-4" : "size-5"
  const num = size === "sm" ? "min-w-7 text-base" : "min-w-8 text-lg"

  const decrement = () => {
    const next = value - 1
    if (next <= 0 && onRemove) onRemove()
    else onChange(Math.max(floor, next))
  }

  return (
    <div className={`flex items-center rounded-lg bg-[#4a1236] text-[#ff4fb6] ${className}`}>
      <button
        type="button"
        aria-label={t("stepper.decrease")}
        onClick={decrement}
        disabled={value <= floor}
        className={`grid ${btn} cursor-pointer place-items-center transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <Minus className={icon} />
      </button>
      <span className={`${num} text-center font-semibold`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={t("stepper.increase")}
        onClick={() => onChange(value + 1)}
        className={`grid ${btn} cursor-pointer place-items-center transition-colors hover:text-white`}
      >
        <Plus className={icon} />
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={t("stepper.remove")}
          onClick={onRemove}
          className={`grid ${btn} cursor-pointer place-items-center border-l border-white/10 transition-colors hover:text-white`}
        >
          <Trash2 className={icon} />
        </button>
      )}
    </div>
  )
}

export default QuantityStepper
