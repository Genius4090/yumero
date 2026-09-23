import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Camera, Check, ChevronRight, KeyRound, Languages, LayoutDashboard, Loader2, LogOut, Pencil, Phone, Settings, UserRound, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useSettings } from "@/context/SettingsContext"
import { LOCALES, LOCALE_NAMES } from "@/i18n"
import { useI18n } from "@/i18n/useI18n"
import { apiFetch, mediaUrl } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import { Button } from "@/components"
import { FormError, PasswordField } from "@/components/auth/Fields"
import LogoutDialog from "@/components/LogoutDialog"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

/** 998901234567 -> +998 90 123 45 67 */
const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "").replace(/^998/, "")
  return `+998 ${[digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ")}`
}

const inputClass =
  "w-full rounded-full bg-[#2b2a2a] px-4 py-3 text-white outline-none transition-shadow placeholder:text-[#7a7a7a] focus:ring-2 focus:ring-white/40"

/* ---------- profile photo ---------- */

/** Round avatar; hovering dims it and reveals a camera button that uploads a new photo. */
const AvatarEditor = ({ url, onChange }: { url: string | null; onChange: (file: File | null) => Promise<void> }) => {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const photo = mediaUrl(url)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await onChange(file)
    } catch (err) {
      setError(t(errorKey(err)))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div className="group relative size-24 sm:size-28">
        {photo ? (
          <img src={photo} alt="" className="size-full rounded-full object-cover ring-4 ring-[#2b2a2a]" draggable={false} />
        ) : (
          <span className="grid size-full place-items-center rounded-full bg-[#2b2a2a] text-[#8a8a8a] ring-4 ring-[#2b2a2a]">
            <UserRound className="size-10 sm:size-12" />
          </span>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={t("profile.changePhoto")}
          title={t("profile.changePhoto")}
          className={`absolute inset-0 grid cursor-pointer place-items-center rounded-full bg-black/55 text-white transition-opacity duration-200 focus-visible:opacity-100 focus-visible:outline-none ${
            busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {busy ? <Loader2 className="size-7 animate-spin" /> : <Camera className="size-7" />}
        </button>
      </div>
      {error && <p className="max-w-40 text-center text-xs text-[#ff9b9b]">{error}</p>}
    </div>
  )
}

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
      <form onSubmit={save} className="flex w-full items-center gap-2">
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
    /* centred under the avatar on phones, left-aligned next to it from sm */
    <div className="flex min-w-0 items-center justify-center gap-3 sm:justify-start">
      <h1 className={`min-w-0 truncate text-2xl font-semibold sm:text-3xl ${value ? "" : "text-[#8a8a8a]"}`} title={value || undefined}>
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
    /* phones: label row, then the full-width switch underneath; from sm everything on one 72px line */
    <div className="flex w-full flex-col gap-3 rounded-2xl bg-[#2b2a2a] px-5 py-4 sm:h-18 sm:flex-row sm:items-center sm:gap-4 sm:py-0">
      <div className="flex items-center gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1c1c1c]">
          <Languages className="size-5" />
        </span>
        <span className="flex-1 font-medium">{t("languages.label")}</span>
      </div>
      <div role="radiogroup" aria-label={t("languages.label")} className="flex rounded-full bg-[#1c1c1c] p-2 sm:ml-auto">
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
              className={`flex-1 cursor-pointer rounded-full px-2 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:flex-none sm:px-4 ${
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
  const { user, status, isAdmin, logout, updateUser, setAvatar } = useAuth()
  const navigate = useNavigate()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  if (status === "loading") return <section className="min-h-screen py-30" />
  if (!user) return <Navigate to="/home" replace />

  const handleLogout = async () => {
    await logout()
    navigate("/home")
  }

  const rowClass =
    "flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-[#2b2a2a] px-5 py-4 text-left transition-colors hover:bg-[#3a3939] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"

  return (
    <section className="min-h-screen pt-24 pb-16 sm:py-30">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="rounded-3xl bg-[#1c1c1c] p-5 sm:p-8">
          {/* phones: avatar above the name, both centred; from sm side by side */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <AvatarEditor url={user.avatarUrl} onChange={setAvatar} />
            <div className="w-full min-w-0 flex-1">
              <NameEditor value={user.fullName} onSave={(fullName) => updateUser({ fullName })} />
              <p className="mt-2 flex items-center justify-center gap-2 text-[#c4c4c4] sm:justify-start">
                <Phone className="size-4" />
                {formatPhone(user.phone)}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {isAdmin && (
              <Link to="/dashboard" className={rowClass}>
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

            <button type="button" onClick={() => setLogoutOpen(true)} className={`${rowClass} text-[#ff6b6b]`}>
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
      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={handleLogout} />
    </section>
  )
}

export default Profile
