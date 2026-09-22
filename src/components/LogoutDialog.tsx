import { useState } from "react"
import { LogOut } from "lucide-react"
import { useI18n } from "@/i18n/useI18n"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Performs the actual logout; the dialog closes when it resolves. */
  onConfirm: () => Promise<void>
}

/** "Log out?" confirmation shared by the site profile page and the admin sidebar. */
const LogoutDialog = ({ open, onOpenChange, onConfirm }: LogoutDialogProps) => {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent showCloseButton={false} className="max-w-xs p-7 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[#2b2a2a] text-[#e05252]">
          <LogOut className="size-6" />
        </span>
        <DialogTitle className="text-xl">{t("common.logoutTitle")}</DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-relaxed">{t("common.logoutHint")}</DialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="h-11 cursor-pointer rounded-full bg-[#2b2a2a] text-sm font-semibold text-white transition-colors hover:bg-[#3a3939] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="h-11 cursor-pointer rounded-full bg-[#d93a3a] text-sm font-semibold text-white transition-colors hover:bg-[#e64848] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
          >
            {t("common.logout")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LogoutDialog
