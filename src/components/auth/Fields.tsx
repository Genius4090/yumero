/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useI18n } from "@/i18n/useI18n"

export const CODE_LENGTH = 6

export const inputClass =
  "w-full rounded-full bg-[#2b2a2a] px-4 py-3 text-white outline-none transition-shadow placeholder:text-[#7a7a7a] focus:ring-2 focus:ring-white/40"

interface FieldProps {
  id: string
  label: string
  type?: string
  placeholder?: string
  autoComplete?: string
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export const Field = ({ id, label, type = "text", placeholder, autoComplete, value, onChange, maxLength }: FieldProps) => (
  <label htmlFor={id} className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
    {label}
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      maxLength={maxLength}
      className={inputClass}
    />
  </label>
)

/** Uzbek phone: fixed +998 prefix, 9 digits formatted "90 123 45 67". Stores digits only. */
export const formatUzPhone = (digits: string) => {
  const d = digits.replace(/\D/g, "").replace(/^998/, "").slice(0, 9)
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean)
  return parts.join(" ")
}

export const PhoneField = ({ id, value, onChange, autoFocus }: { id: string; value: string; onChange: (digits: string) => void; autoFocus?: boolean }) => {
  const { t } = useI18n()
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
      {t("auth.phone")}
      <span className="flex items-center rounded-full bg-[#2b2a2a] pl-4 focus-within:ring-2 focus-within:ring-white/40">
        <span className="text-white select-none">+998</span>
        <input
          id={id}
          name={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          value={formatUzPhone(value)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
          placeholder="90 123 45 67"
          className="w-full bg-transparent px-2 py-3 text-white outline-none placeholder:text-[#7a7a7a]"
        />
      </span>
    </label>
  )
}

export const PasswordField = ({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  hint?: string
}) => {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
      {label}
      <span className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#8a8a8a] transition-colors hover:text-white"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </span>
      {hint && <span className="text-xs text-[#8a8a8a]">{hint}</span>}
    </label>
  )
}

/** Six single-digit boxes with auto-advance, backspace navigation and paste support. */
export const CodeInput = ({ value, onChange }: { value: string; onChange: (code: string) => void }) => {
  const { t } = useI18n()
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "")

  const setAt = (i: number, ch: string) => {
    const next = digits.slice()
    next[i] = ch
    onChange(next.join(""))
  }

  const handleChange = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.replace(/\D/g, "").slice(-1)
    setAt(i, ch)
    if (ch && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
      setAt(i - 1, "")
      e.preventDefault()
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus()
    if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
    if (!pasted) return
    e.preventDefault()
    onChange(pasted)
    refs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
  }

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  return (
    /* boxes shrink evenly on narrow phones instead of overflowing the modal */
    <div className="flex justify-center gap-1.5 sm:gap-2" role="group" aria-label={t("auth.codeAria")}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste}
          aria-label={t("auth.digit", { n: i + 1 })}
          className="aspect-square w-full max-w-12 min-w-0 rounded-xl bg-[#2b2a2a] text-center text-xl font-semibold text-white outline-none transition-shadow focus:ring-2 focus:ring-white/40"
        />
      ))}
    </div>
  )
}

/** Inline error line under a form. */
export const FormError = ({ message }: { message: string | null }) =>
  message ? (
    <p role="alert" className="rounded-xl bg-[#ff6b6b]/10 px-4 py-2.5 text-sm text-[#ff9b9b]">
      {message}
    </p>
  ) : null
