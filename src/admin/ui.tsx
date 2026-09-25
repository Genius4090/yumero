import { useRef, useState, type ComponentProps, type ReactNode } from "react"
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ImagePlus, Trash2, Upload, UserRound } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"
import type { LocalizedText } from "@/@types"
import { LOCALES, LOCALE_NAMES } from "@/i18n"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl, uploadFile } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import { cn } from "@/lib/utils"

export const inputCls =
  "w-full rounded-xl bg-[#2b2a2a] px-4 py-2.5 text-white outline-none transition-shadow placeholder:text-[#7a7a7a] focus:ring-2 focus:ring-white/40 disabled:opacity-60"

export const Input = ({ className, ...props }: ComponentProps<"input">) => <input className={cn(inputCls, className)} {...props} />

/**
 * Number field with custom up/down arrows instead of the browser spinner.
 * `value` null = empty field; typing keeps the raw text so clearing the field does not snap to 0.
 */
export const NumberInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  className,
  disabled,
  ...rest
}: {
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  /** Unit shown inside the field, e.g. "%" or "UZS". */
  suffix?: ReactNode
  className?: string
} & Pick<ComponentProps<"input">, "id" | "placeholder" | "required" | "disabled" | "autoFocus" | "aria-label">) => {
  const [text, setText] = useState(value == null ? "" : String(value))
  const [seenValue, setSeenValue] = useState(value)
  // Adopt an external value (e.g. arrows, form reset) without clobbering text the user is typing.
  if (value !== seenValue) {
    setSeenValue(value)
    const typed = text === "" ? null : Number(text)
    if (typed !== value) setText(value == null ? "" : String(value))
  }

  const decimals = (String(step).split(".")[1] ?? "").length
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
  const bump = (dir: 1 | -1) => {
    const base = value ?? (dir === 1 ? (min ?? 0) - step : (max ?? 0) + step)
    onChange(clamp(Number((base + dir * step).toFixed(decimals))))
  }

  return (
    <div className={cn("relative", className)}>
      <input
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          const n = raw === "" ? null : Number(raw)
          if (n === null || Number.isFinite(n)) onChange(n)
        }}
        className={cn(inputCls, "pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none", suffix && "pr-20")}
        {...rest}
      />
      {suffix && <span className="pointer-events-none absolute top-1/2 right-12 -translate-y-1/2 text-sm text-[#8a8a8a]">{suffix}</span>}
      <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-[#3a3939]">
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || (max != null && value != null && value >= max)}
          onClick={() => bump(1)}
          className="grid h-4.5 w-7 cursor-pointer place-items-center text-[#c4c4c4] transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="+"
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || (min != null && value != null && value <= min)}
          onClick={() => bump(-1)}
          className="grid h-4.5 w-7 cursor-pointer place-items-center text-[#c4c4c4] transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="−"
        >
          <ChevronDown className="size-3" />
        </button>
      </div>
    </div>
  )
}

/** Styled checkbox with a label. */
export const Checkbox = ({ checked, onChange, label, className }: { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; className?: string }) => (
  <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm text-[#c4c4c4] select-none", className)}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
    <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/20 bg-[#2b2a2a] transition-colors peer-checked:border-[#ff0099] peer-checked:bg-[#ff0099] peer-focus-visible:ring-2 peer-focus-visible:ring-white/40">
      <Check className={cn("size-3.5 text-white transition-opacity", checked ? "opacity-100" : "opacity-0")} />
    </span>
    {label}
  </label>
)

/** Pill-style radio group (e.g. Customer | No account). */
export const Segmented = <T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) => (
  <div role="radiogroup" className={cn("flex rounded-full bg-[#2b2a2a] p-1", className)}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        onClick={() => onChange(o.value)}
        className={cn("flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold transition-colors", value === o.value ? "bg-white text-black" : "text-[#c4c4c4] hover:text-white")}
      >
        {o.label}
      </button>
    ))}
  </div>
)

export const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea className={cn(inputCls, "min-h-20 resize-y", className)} {...props} />
)

export interface SelectOption {
  value: string
  label: ReactNode
  disabled?: boolean
  /** "danger" renders the option in red (e.g. "Cancel order"). */
  tone?: "default" | "danger"
}

/**
 * Styled dropdown (Radix Select) that matches the dark inputs.
 * `value` "" shows the placeholder; option values must be non-empty strings.
 */
export const Select = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: "sm" | "md"
  className?: string
  "aria-label"?: string
}) => (
  <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
    <SelectPrimitive.Trigger
      aria-label={ariaLabel}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-[#2b2a2a] text-left text-white outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60 data-placeholder:text-[#7a7a7a]",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5",
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate">
        <SelectPrimitive.Value placeholder={placeholder} />
      </span>
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 shrink-0 text-[#8a8a8a]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        sideOffset={6}
        className="z-70 max-h-72 min-w-(--radix-select-trigger-width) overflow-y-auto rounded-xl border border-white/10 bg-[#1c1c1c] p-1 text-white shadow-2xl [scrollbar-color:#3a3939_transparent] [scrollbar-width:thin] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      >
        <SelectPrimitive.Viewport>
          {options.map((o) => (
            <SelectPrimitive.Item
              key={o.value}
              value={o.value}
              disabled={o.disabled}
              className={cn(
                "relative flex cursor-pointer items-center rounded-lg py-2 pr-9 pl-3 text-sm outline-none select-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
                o.tone === "danger" ? "text-[#ff9b9b] data-highlighted:bg-[#ee4242]/20" : "data-highlighted:bg-white/10 data-[state=checked]:text-[#ff4fb6]"
              )}
            >
              <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              <SelectPrimitive.ItemIndicator className="absolute right-3">
                <Check className="size-4" />
              </SelectPrimitive.ItemIndicator>
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
)

export const Label = ({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) => (
  <label className={cn("flex flex-col gap-1.5 text-sm text-[#c4c4c4]", className)}>
    <span>{label}</span>
    {children}
    {hint && <span className="text-xs text-[#8a8a8a]">{hint}</span>}
  </label>
)

type BtnVariant = "primary" | "ghost" | "danger" | "outline"
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-[#ff0099] text-white hover:bg-[#ff2bab]",
  ghost: "bg-[#2b2a2a] text-white hover:bg-[#3a3939]",
  outline: "border border-white/30 text-white hover:bg-white hover:text-black",
  danger: "bg-[#ee4242]/15 text-[#ff9b9b] hover:bg-[#ee4242] hover:text-white",
}

export const Btn = ({ variant = "ghost", size = "md", className, type = "button", ...props }: ComponentProps<"button"> & { variant?: BtnVariant; size?: "sm" | "md" }) => (
  <button
    type={type}
    className={cn(
      "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-50",
      // md is a notch shorter on phones so header rows stay compact
      size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm sm:h-11 sm:px-5",
      btnVariants[variant],
      className
    )}
    {...props}
  />
)

/** `solid` = opaque dark pill for badges laid over photos or light backgrounds. */
export const Badge = ({ children, tone = "neutral", solid = false }: { children: ReactNode; tone?: "neutral" | "green" | "red" | "amber" | "blue"; solid?: boolean }) => {
  const tones = {
    neutral: "bg-white/10 text-[#c4c4c4]",
    green: "bg-[#77FF00]/10 text-[#77FF00]",
    red: "bg-[#ff6b6b]/10 text-[#ff6b6b]",
    amber: "bg-[#f5c400]/15 text-[#f5c400]",
    blue: "bg-[#4da3ff]/15 text-[#4da3ff]",
  }
  const solidTones = {
    neutral: "bg-[#1c1c1c] text-[#c4c4c4]",
    green: "bg-[#1c1c1c] text-[#77FF00]",
    red: "bg-[#1c1c1c] text-[#ff6b6b]",
    amber: "bg-[#1c1c1c] text-[#f5c400]",
    blue: "bg-[#1c1c1c] text-[#4da3ff]",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", solid ? `${solidTones[tone]} shadow-md shadow-black/30` : tones[tone])}>
      {children}
    </span>
  )
}

/** "Abdulboriy To'lqinov" -> "AT" */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

/** Small round profile photo for tables and the sidebar; falls back to the person's initials, or a person icon. */
export const AvatarThumb = ({ url, name, className }: { url: string | null | undefined; name?: string; className?: string }) => {
  const src = mediaUrl(url)
  const text = name ? initials(name) : ""
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2b2a2a] text-xs font-semibold text-[#c4c4c4]", className)}>
      {src ? <img src={src} alt="" className="size-full object-cover" draggable={false} /> : text || <UserRound className="size-4 text-[#8a8a8a]" />}
    </span>
  )
}

export const Card = ({ className, ...props }: ComponentProps<"div">) => <div className={cn("rounded-2xl bg-[#1c1c1c] p-4 sm:p-6", className)} {...props} />

/**
 * Title with its controls. From `sm` everything sits on one row: title … toolbar, children.
 * On phones: `children` share the title's row (right-aligned) unless `stack`, which gives them their own
 * full-width row; `toolbar` (search fields etc.) always gets its own full-width row on phones.
 */
export const PageHeader = ({
  title,
  children,
  toolbar,
  className,
  stack = false,
}: {
  title: string
  children?: ReactNode
  toolbar?: ReactNode
  className?: string
  stack?: boolean
}) => (
  <div className={cn("mb-5 flex flex-wrap items-center gap-3 sm:mb-6 sm:gap-4", className)}>
    <h1 className="mr-auto text-2xl font-semibold">{title}</h1>
    {toolbar && <div className="order-last flex w-full items-center gap-2 sm:order-0 sm:w-auto sm:gap-3">{toolbar}</div>}
    {children && (
      <div className={cn("flex flex-wrap items-center justify-end gap-2 sm:order-0 sm:w-auto sm:flex-none sm:gap-3", stack ? "order-last w-full" : "min-w-0")}>
        {children}
      </div>
    )}
  </div>
)

export const Notice = ({ tone, children }: { tone: "error" | "success"; children: ReactNode }) => (
  <p role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl px-4 py-2.5 text-sm", tone === "error" ? "bg-[#ff6b6b]/10 text-[#ff9b9b]" : "bg-[#77FF00]/10 text-[#77FF00]")}>
    {children}
  </p>
)

/** Data table; cells never wrap, so on narrow screens the table grows and scrolls sideways inside its card. */
export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto rounded-2xl bg-[#1c1c1c] [scrollbar-color:#3a3939_transparent] [scrollbar-width:thin]">
    <table className="w-full min-w-160 text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_td]:whitespace-nowrap [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wider [&_th]:whitespace-nowrap [&_th]:text-[#8a8a8a] [&_th]:uppercase [&_tbody_tr]:border-t [&_tbody_tr]:border-white/5">
      {children}
    </table>
  </div>
)

/** Prev / next pager shown under a table; hidden when everything fits on one page. */
export const Pagination = ({ page, pages, total, pageSize, onChange }: { page: number; pages: number; total: number; pageSize: number; onChange: (page: number) => void }) => {
  const { t } = useI18n()
  if (pages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#c4c4c4] sm:gap-4">
      <span className="text-[#8a8a8a]">{t("admin.common.showing", { from, to, total })}</span>
      <div className="flex items-center gap-2">
        <Btn size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="‹" className="w-8 px-0">
          <ChevronLeft className="size-4" />
        </Btn>
        <span className="min-w-14 text-center">
          {page} / {pages}
        </span>
        <Btn size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="›" className="w-8 px-0">
          <ChevronRight className="size-4" />
        </Btn>
      </div>
    </div>
  )
}

/** Two-step delete: first click arms, second confirms. */
export const DeleteButton = ({ onConfirm, busy }: { onConfirm: () => void; busy?: boolean }) => {
  const { t } = useI18n()
  const [armed, setArmed] = useState(false)
  if (armed) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-[#c4c4c4]">{t("admin.common.confirmDelete")}</span>
        <Btn size="sm" variant="danger" disabled={busy} onClick={() => { onConfirm(); setArmed(false) }}>
          {t("admin.common.yes")}
        </Btn>
        <Btn size="sm" onClick={() => setArmed(false)}>
          {t("admin.common.no")}
        </Btn>
      </span>
    )
  }
  return (
    <Btn size="sm" variant="danger" onClick={() => setArmed(true)} aria-label={t("admin.common.delete")} title={t("admin.common.delete")} className="w-11 px-0">
      <Trash2 className="size-4" />
    </Btn>
  )
}

/** RU / EN / UZ inputs for a localized text field. */
export const LocalizedInput = ({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: LocalizedText
  onChange: (next: LocalizedText) => void
  multiline?: boolean
}) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-1.5 text-sm text-[#c4c4c4]">{label}</legend>
    {LOCALES.map((l) => (
      <div key={l} className="flex items-start gap-2">
        <span className="w-8 shrink-0 pt-2.5 text-xs font-semibold uppercase text-[#8a8a8a]" title={LOCALE_NAMES[l]}>
          {l}
        </span>
        {multiline ? (
          <Textarea lang={l} value={value[l]} onChange={(e) => onChange({ ...value, [l]: e.target.value })} maxLength={500} />
        ) : (
          <Input lang={l} value={value[l]} onChange={(e) => onChange({ ...value, [l]: e.target.value })} maxLength={500} required={l === "ru"} />
        )}
      </div>
    ))}
  </fieldset>
)

/** Image picker that uploads to /api/admin/upload and returns the stored URL. "avatar" = round profile photo. */
export const ImageUpload = ({ value, onChange, aspect = "square" }: { value: string | null; onChange: (url: string | null) => void; aspect?: "square" | "wide" | "avatar" }) => {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const { url } = await uploadFile(file)
      onChange(url)
    } catch (err) {
      setError(t(errorKey(err)))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const src = mediaUrl(value)
  return (
    <div className={cn("flex gap-2", aspect === "avatar" ? "items-center gap-4" : "flex-col")}>
      <div
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden bg-[#2b2a2a]",
          aspect === "square" && "aspect-square w-40 rounded-xl",
          aspect === "wide" && "aspect-16/10 w-full max-w-md rounded-xl",
          aspect === "avatar" && "size-20 rounded-full"
        )}
      >
        {src ? (
          <img src={src} alt="" className={cn("h-full w-full", aspect === "avatar" ? "object-cover" : "object-contain")} />
        ) : aspect === "avatar" ? (
          <UserRound className="size-8 text-[#8a8a8a]" />
        ) : (
          <ImagePlus className="size-8 text-[#8a8a8a]" />
        )}
      </div>
      <div className={cn("flex gap-2", aspect === "square" ? "w-40 flex-col" : "flex-wrap items-center")}>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <Btn size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" />
          {busy ? t("admin.common.uploading") : t("admin.common.upload")}
        </Btn>
        {value && (
          <Btn size="sm" variant="danger" onClick={() => onChange(null)}>
            <Trash2 className="size-4" />
            {t("admin.common.removeImage")}
          </Btn>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}

export const Toggle = ({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#2b2a2a] px-4 py-3">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#ff0099]" />
    <span className="flex-1">
      <span className="block text-sm font-medium">{label}</span>
      {hint && <span className="block text-xs text-[#8a8a8a]">{hint}</span>}
    </span>
  </label>
)
