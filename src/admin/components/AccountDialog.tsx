import { useState, type FormEvent } from "react"
import type { adminUserType } from "@/@types"
import { useI18n } from "@/i18n/useI18n"
import { errorKey } from "@/lib/apiErrors"
import { PasswordField, PhoneField } from "@/components/auth/Fields"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import type { UserInput, UserPatch } from "../api"
import { Btn, ImageUpload, Input, Label, Notice } from "../ui"

interface AccountDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** null = create */
  account: adminUserType | null
  title: string
  description?: string
  onSave: (data: UserInput | UserPatch) => Promise<unknown>
}

/** Create / edit form shared by the Customers and Staff pages. */
const AccountDialog = ({ open, onOpenChange, account, title, description, onSave }: AccountDialogProps) => {
  const { t } = useI18n()
  const [fullName, setFullName] = useState(account?.fullName ?? "")
  const [phone, setPhone] = useState(account?.phone.replace(/^998/, "") ?? "")
  const [password, setPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(account?.avatarUrl ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isNew = account === null
  const dirty =
    isNew || fullName.trim() !== account.fullName || phone !== account.phone.replace(/^998/, "") || password.length > 0 || avatarUrl !== account.avatarUrl
  const canSave = dirty && fullName.trim().length > 0 && phone.length === 9 && (isNew ? password.length >= 8 : password.length === 0 || password.length >= 8) && !busy

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setBusy(true)
    setError(null)
    try {
      const data: UserInput | UserPatch = isNew
        ? { fullName: fullName.trim(), phone, password, avatarUrl }
        : { fullName: fullName.trim(), phone, avatarUrl, ...(password ? { password } : {}) }
      await onSave(data)
      onOpenChange(false)
    } catch (err) {
      setError(t(errorKey(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={description ? undefined : undefined}>
        <DialogTitle className="mb-1">{title}</DialogTitle>
        {description ? <DialogDescription className="mb-6">{description}</DialogDescription> : <div className="mb-5" />}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
            <span>{t("admin.common.photo")}</span>
            <ImageUpload aspect="avatar" value={avatarUrl} onChange={setAvatarUrl} />
          </div>
          <Label label={t("admin.common.name")}>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={60} required autoFocus className="rounded-full" />
          </Label>
          <PhoneField id="account-phone" value={phone} onChange={setPhone} />
          <PasswordField
            id="account-password"
            label={isNew ? t("admin.common.password") : t("admin.common.newPassword")}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={isNew ? t("auth.passwordHint") : t("admin.common.newPasswordHint")}
          />
          {error && <Notice tone="error">{error}</Notice>}
          <div className="mt-2 flex justify-end gap-3">
            <Btn onClick={() => onOpenChange(false)}>{t("admin.common.cancel")}</Btn>
            <Btn type="submit" variant="primary" disabled={!canSave}>
              {busy ? t("admin.common.saving") : t("admin.common.save")}
            </Btn>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AccountDialog
