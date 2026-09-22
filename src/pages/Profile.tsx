import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Check, ChevronRight, KeyRound, Languages, LayoutDashboard, LogOut, Pencil, Phone, Settings, X } from "lucide-react"
import { Avatar } from "@/assets/images"
import { useAuth } from "@/context/AuthContext"
import { useSettings } from "@/context/SettingsContext"
import { LOCALES, LOCALE_NAMES } from "@/i18n"
import { useI18n } from "@/i18n/useI18n"
import { apiFetch } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import { Button } from "@/components"
import { FormError, PasswordField } from "@/components/auth/Fields"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

/** 998901234567 -> +998 90 123 45 67 */
const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "").replace(/^998/, "")
  return `+998 ${[digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ")}`
}

const inputClass =
  "w-full rounded-full bg-[#2b2a2a] px-4 py-3 text-white outline-none transition-shadow placeholder:text-[#7a7a7a] focus:ring-2 focus:ring-white/40"

/* ---------- inline name editor ---------- */

const NameEditor = ({ value, onSave }: { value: string; onSave: (name: string) => Promise<void> }) => {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const start = () => {
    setDraft(value)
    setEditing(true)
  }
  const cancel = () => setEditing(false)
  const save = async (e: FormEvent) => {
    e.preventDefault()
    const name = draft.trim()
    if (name && name !== value) {
      setSaving(true)
      try {
        await onSave(name)
      } finally {
        setSaving(false)
      }
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && cancel()}
          placeholder={t("profile.namePlaceholder")}
          aria-label={t("profile.nameAria")}
          autoComplete="name"
          maxLength={60}
          disabled={saving}
          className={`${inputClass} min-w-0 text-lg font-semibold`}
        />
        <button
          type="submit"
          aria-label={t("profile.saveName")}
          disabled={saving}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-black transition-colors hover:bg-[#e6e6e6] disabled:opacity-60"
        >
          <Check className="size-5" />
        </button>
        <button
          type="button"
          onClick={cancel}
          aria-label={t("common.cancel")}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white transition-colors hover:bg-[#3a3939]"
        >
          <X className="size-5" />
        </button>
      </form>
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <h1 className={`min-w-0 truncate text-3xl font-semibold ${value ? "" : "text-[#8a8a8a]"}`} title={value || undefined}>
        {value || t("profile.yourName")}
      </h1>
      <button
        type="button"
        onClick={start}
        aria-label={t("profile.editName")}
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-[#c4c4c4] transition-colors hover:bg-[#3a3939] hover:text-white"
      >
        <Pencil className="size-4" />
      </button>
    </div>
  )
}

/* ---------- change password modal ---------- */

const ChangePasswordModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { t } = useI18n()
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setCurrent("")
      setNext("")
      setConfirm("")
      setError(null)
      setDone(false)
    }
    onOpenChange(o)
  }

  const canSave = current.length > 0 && next.length >= 8 && next === confirm && !busy

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setBusy(true)
    setError(null)
    try {
      await apiFetch<void>("/api/auth/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } })
      setDone(true)
      window.setTimeout(() => handleOpenChange(false), 1200)
    } catch (err) {
      setError(t(errorKey(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="mb-1">{t("profile.changePassword")}</DialogTitle>
        <DialogDescription className="mb-6">{t("profile.changePasswordDescription")}</DialogDescription>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordField id="current-password" label={t("profile.currentPassword")} value={current} onChange={setCurrent} autoComplete="current-password" />
          <PasswordField id="next-password" label={t("profile.newPassword")} value={next} onChange={setNext} autoComplete="new-password" hint={t("auth.passwordHint")} />
          <PasswordField id="confirm-next-password" label={t("profile.repeatNewPassword")} value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <FormError message={error} />
          {done && <p className="text-sm text-[#77FF00]">{t("profile.passwordChanged")}</p>}
          <Button
            type="submit"
            disabled={!canSave}
            extraClass="mt-2 w-full justify-center py-3 font-semibold disabled:cursor-not-allowed disabled:bg-[#3a3939] disabled:text-[#8a8a8a]"
          >
            {t("profile.savePassword")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- app settings modal ---------- */

const SettingsModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { t } = useI18n()
  const { settings, setSetting } = useSettings()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="mb-1">{t("profile.settings")}</DialogTitle>
        <DialogDescription className="mb-6">{t("profile.settingsDescription")}</DialogDescription>

        <ul className="flex flex-col gap-3">
          <li>
            <label
              htmlFor="setting-close-after-add"
              className="flex cursor-pointer items-center gap-4 rounded-2xl bg-[#2b2a2a] px-5 py-4 transition-colors hover:bg-[#3a3939]"
            >
              <span className="flex-1">
                <span className="block font-medium">{t("profile.closeProductCard")}</span>
                <span className="mt-0.5 block text-sm text-[#c4c4c4]">{t("profile.closeProductCardHint")}</span>
              </span>
              <Switch
                id="setting-close-after-add"
                checked={settings.closeProductAfterAdd}
                onCheckedChange={(v) => setSetting("closeProductAfterAdd", v)}
              />
            </label>
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- language row ---------- */

/** Segmented RU / EN / UZ switch; the choice is persisted with the other settings. */
const LanguageRow = () => {
  const { t, locale } = useI18n()
  const { setSetting } = useSettings()

  return (
    <div className="flex w-full items-center gap-4 rounded-2xl bg-[#2b2a2a] px-5 h-18">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1c1c1c]">
        <Languages className="size-5" />
      </span>
      <span className="flex-1 font-medium">{t("languages.label")}</span>
      <div role="radiogroup" aria-label={t("languages.label")} className="flex rounded-full bg-[#1c1c1c] p-2">
        {LOCALES.map((l) => {
          const active = l === locale
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              lang={l}
              onClick={() => setSetting("locale", l)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                active ? "bg-white text-black" : "text-[#c4c4c4] hover:text-white"
              }`}
            >
              {LOCALE_NAMES[l]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- page ---------- */

const Profile = () => {
  const { t } = useI18n()
  const { user, status, isAdmin, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (status === "loading") return <section className="min-h-screen py-30" />
  if (!user) return <Navigate to="/home" replace />

  const handleLogout = async () => {
    await logout()
    navigate("/home")
  }

  const rowClass =
    "flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-[#2b2a2a] px-5 py-4 text-left transition-colors hover:bg-[#3a3939] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"

  return (
    <section className="min-h-screen py-30">
      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="rounded-3xl bg-[#1c1c1c] p-8">
          <div className="flex items-center gap-6">
            <img src={Avatar} alt="" className="size-28 shrink-0 rounded-full object-cover ring-4 ring-[#2b2a2a]" draggable={false} />
            <div className="min-w-0 flex-1">
              <NameEditor value={user.fullName} onSave={(fullName) => updateUser({ fullName })} />
              <p className="mt-2 flex items-center gap-2 text-[#c4c4c4]">
                <Phone className="size-4" />
                {formatPhone(user.phone)}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {isAdmin && (
              <Link to="/admin" className={`${rowClass} text-[#77FF00]`}>
                <span className="grid size-10 place-items-center rounded-full bg-[#1c1c1c]">
                  <LayoutDashboard className="size-5" />
                </span>
                <span className="flex-1 font-medium">{t("profile.adminPanel")}</span>
                <ChevronRight className="size-5 text-[#8a8a8a]" />
              </Link>
            )}

            <button type="button" onClick={() => setPasswordOpen(true)} className={rowClass}>
              <span className="grid size-10 place-items-center rounded-full bg-[#1c1c1c]">
                <KeyRound className="size-5" />
              </span>
              <span className="flex-1 font-medium">{t("profile.changePassword")}</span>
              <ChevronRight className="size-5 text-[#8a8a8a]" />
            </button>

            <button type="button" onClick={() => setSettingsOpen(true)} className={rowClass}>
              <span className="grid size-10 place-items-center rounded-full bg-[#1c1c1c]">
                <Settings className="size-5" />
              </span>
              <span className="flex-1 font-medium">{t("profile.settings")}</span>
              <ChevronRight className="size-5 text-[#8a8a8a]" />
            </button>

            <LanguageRow />

            <button type="button" onClick={handleLogout} className={`${rowClass} text-[#ff6b6b]`}>
              <span className="grid size-10 place-items-center rounded-full bg-[#1c1c1c]">
                <LogOut className="size-5" />
              </span>
              <span className="flex-1 font-medium">{t("profile.logout")}</span>
              <ChevronRight className="size-5 text-[#8a8a8a]" />
            </button>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={passwordOpen} onOpenChange={setPasswordOpen} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </section>
  )
}

export default Profile
