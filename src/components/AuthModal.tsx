import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Send } from "lucide-react"
import type { AuthUser } from "@/@types"
import { useAuth } from "@/context/AuthContext"
import { useI18n } from "@/i18n/useI18n"
import type { TranslationKey } from "@/i18n"
import { apiFetch } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import Button from "./Button"
import { CODE_LENGTH, CodeInput, Field, FormError, PasswordField, PhoneField, formatUzPhone } from "./auth/Fields"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog"

type AuthMode = "login" | "register" | "forgot"
type Step = "form" | "code" | "newPassword"

const RESEND_SECONDS = 60
const POLL_MS = 2000

interface Verification {
  verificationId: string
  delivery: "chat" | "link"
  deepLink?: string
  expiresAt: number
}

type VerificationStatus = "PENDING_LINK" | "AWAITING_CONTACT" | "CODE_SENT" | "VERIFIED" | "CONSUMED"

/* ---------- modal ---------- */

// Soft crossfade: outgoing screen fades/blurs away, incoming one settles in with a slight rise.
const swap = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -6, filter: "blur(6px)", transition: { duration: 0.16, ease: "easeIn" as const } },
}

/** Which dictionary section provides the title/description for each mode + step. */
const copyKey: Record<AuthMode, Record<Step, "login" | "register" | "code" | "forgot" | "newPassword" | null>> = {
  login: { form: "login", code: null, newPassword: null },
  register: { form: "register", code: "code", newPassword: null },
  forgot: { form: "forgot", code: "code", newPassword: "newPassword" },
}

const AuthModal = ({ children, defaultOpen = false }: { children?: ReactNode; defaultOpen?: boolean }) => {
  const { t } = useI18n()
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(defaultOpen)
  const [mode, setMode] = useState<AuthMode>("login")
  const [step, setStep] = useState<Step>("form")

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resendIn, setResendIn] = useState(0)

  const [verification, setVerification] = useState<Verification | null>(null)
  const [codeReady, setCodeReady] = useState(false)
  const [linkExpired, setLinkExpired] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fail = (err: unknown) => setError(t(errorKey(err)))

  // Resend countdown while on the code step
  useEffect(() => {
    if (step !== "code" || resendIn <= 0) return
    const tm = window.setInterval(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearInterval(tm)
  }, [step, resendIn])

  // Poll the verification until the Telegram bot has delivered the code
  useEffect(() => {
    if (step !== "code" || !verification || codeReady) return
    let cancelled = false
    const tick = async () => {
      try {
        const s = await apiFetch<{ status: VerificationStatus; expiresAt: number }>(`/api/auth/verification/${verification.verificationId}`, { auth: false })
        if (cancelled) return
        if (s.status === "CODE_SENT" || s.status === "VERIFIED") setCodeReady(true)
        else if (s.status === "CONSUMED" || s.expiresAt < Date.now()) setLinkExpired(true)
      } catch {
        // transient; keep polling
      }
    }
    void tick()
    const id = window.setInterval(tick, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [step, verification, codeReady])

  const go = (nextMode: AuthMode, nextStep: Step = "form") => {
    setMode(nextMode)
    setStep(nextStep)
    setError(null)
    if (nextStep === "code") {
      setCode("")
      setResendIn(RESEND_SECONDS)
    }
    if (nextStep === "form") {
      setVerification(null)
      setCodeReady(false)
      setLinkExpired(false)
    }
  }

  /** One login for everyone: staff accounts land in the admin panel, customers stay where they are. */
  const finishLogin = (session: { user: AuthUser; accessToken: string }) => {
    setSession(session)
    handleOpenChange(false)
    if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") navigate("/dashboard")
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      // reset everything for the next open
      setMode("login")
      setStep("form")
      setPhone("")
      setPassword("")
      setFullName("")
      setCode("")
      setNewPassword("")
      setConfirmPassword("")
      setResendIn(0)
      setVerification(null)
      setCodeReady(false)
      setLinkExpired(false)
      setResetToken(null)
      setBusy(false)
      setError(null)
    }
  }

  const startVerification = (v: Verification) => {
    setVerification(v)
    setCodeReady(v.delivery === "chat")
    setLinkExpired(false)
  }

  const phoneOk = phone.length === 9
  const passwordOk = password.length >= 8
  const codeOk = code.length === CODE_LENGTH
  const section = copyKey[mode][step]
  const title = section ? t(`auth.${section}.title` as TranslationKey) : ""
  const description = section ? t(`auth.${section}.description` as TranslationKey) : ""
  const showTabs = mode !== "forgot" && step === "form"
  const screenKey = `${mode}-${step}`

  const primaryButton = (label: string, disabled = false) => (
    <Button
      type="submit"
      disabled={disabled || busy}
      extraClass="mt-2 w-full justify-center py-3 font-semibold disabled:cursor-not-allowed disabled:bg-[#3a3939] disabled:text-[#8a8a8a] disabled:hover:translate-y-0"
    >
      {label}
    </Button>
  )

  const linkButton = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="cursor-pointer font-semibold text-white hover:underline">
      {label}
    </button>
  )

  /* ---------- actions ---------- */

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const resend = () =>
    run(async () => {
      if (!verification) return
      const v = await apiFetch<Verification>(`/api/auth/verification/${verification.verificationId}/resend`, { method: "POST", auth: false })
      startVerification(v)
      setCode("")
      setResendIn(RESEND_SECONDS)
    })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (busy) return

    if (mode === "login") {
      if (!phoneOk || !password) return
      return run(async () => {
        const session = await apiFetch<{ user: AuthUser; accessToken: string }>("/api/auth/login", { method: "POST", body: { phone, password }, auth: false })
        finishLogin(session)
      })
    }

    if (mode === "register") {
      if (step === "form") {
        if (!phoneOk || !fullName.trim() || !passwordOk) return
        return run(async () => {
          const v = await apiFetch<Verification>("/api/auth/register/start", { method: "POST", body: { phone, fullName: fullName.trim(), password }, auth: false })
          startVerification(v)
          go("register", "code")
        })
      }
      if (step === "code" && codeOk && verification) {
        return run(async () => {
          const session = await apiFetch<{ user: AuthUser; accessToken: string }>("/api/auth/register/verify", {
            method: "POST",
            body: { verificationId: verification.verificationId, code },
            auth: false,
          })
          finishLogin(session)
        })
      }
      return
    }

    // forgot
    if (step === "form") {
      if (!phoneOk) return
      return run(async () => {
        const v = await apiFetch<Verification>("/api/auth/forgot/start", { method: "POST", body: { phone }, auth: false })
        startVerification(v)
        go("forgot", "code")
      })
    }
    if (step === "code" && codeOk && verification) {
      return run(async () => {
        const r = await apiFetch<{ resetToken: string }>("/api/auth/forgot/verify", {
          method: "POST",
          body: { verificationId: verification.verificationId, code },
          auth: false,
        })
        setResetToken(r.resetToken)
        go("forgot", "newPassword")
      })
    }
    if (step === "newPassword" && resetToken && newPassword.length >= 8 && newPassword === confirmPassword) {
      return run(async () => {
        await apiFetch<void>("/api/auth/forgot/reset", { method: "POST", body: { resetToken, password: newPassword }, auth: false })
        const session = await apiFetch<{ user: AuthUser; accessToken: string }>("/api/auth/login", { method: "POST", body: { phone, password: newPassword }, auth: false })
        finishLogin(session)
      })
    }
  }

  /* ---------- screens ---------- */

  const codeScreen = (
    <>
      <p className="text-base font-semibold text-white">+998 {formatUzPhone(phone)}</p>

      {!codeReady && verification?.delivery === "link" && !linkExpired && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[#2b2a2a] p-4 text-center">
          <p className="text-sm text-[#c4c4c4]">{t("auth.telegram.hint")}</p>
          <a
            href={verification.deepLink}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2AABEE] py-3 font-semibold text-white transition-colors hover:bg-[#3db7f2]"
          >
            <Send className="size-4" />
            {t("auth.telegram.open")}
          </a>
          <p className="flex items-center justify-center gap-2 text-xs text-[#8a8a8a]">
            <span className="size-2 animate-pulse rounded-full bg-[#77FF00]" />
            {t("auth.telegram.waiting")}
          </p>
        </div>
      )}

      {linkExpired && (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#2b2a2a] p-4 text-center text-sm">
          <p className="text-[#ff9b9b]">{t("auth.telegram.expired")}</p>
          {linkButton(t("auth.telegram.restart"), () => go(mode, "form"))}
        </div>
      )}

      {codeReady && (
        <>
          <p className="text-center text-xs text-[#77FF00]">{t("auth.telegram.sent")}</p>
          <CodeInput value={code} onChange={setCode} />
        </>
      )}

      <FormError message={error} />
      {primaryButton(t("auth.confirm"), !codeOk || !codeReady)}
      <p className="text-center text-sm text-[#c4c4c4]">
        {resendIn > 0 ? t("auth.resendIn", { seconds: resendIn }) : linkButton(t("auth.resend"), resend)}
      </p>
      <p className="text-center text-sm text-[#c4c4c4]">{linkButton(t("auth.changeNumber"), () => go(mode, "form"))}</p>
    </>
  )

  const renderScreen = () => {
    if (mode === "login") {
      return (
        <>
          <PhoneField id="login-phone" value={phone} onChange={setPhone} />
          <PasswordField id="login-password" label={t("auth.password")} value={password} onChange={setPassword} autoComplete="current-password" />
          <div className="-mt-1 text-right text-sm">{linkButton(t("auth.forgotPassword"), () => go("forgot"))}</div>
          <FormError message={error} />
          {primaryButton(busy ? t("auth.loggingIn") : t("auth.loginButton"), !phoneOk || !password)}
          <p className="text-center text-sm text-[#c4c4c4]">
            {t("auth.noAccount")} {linkButton(t("auth.registerLink"), () => go("register"))}
          </p>
        </>
      )
    }

    if (mode === "register") {
      if (step === "form") {
        return (
          <>
            <Field
              id="register-name"
              label={t("auth.fullName")}
              placeholder={t("auth.fullNamePlaceholder")}
              autoComplete="name"
              value={fullName}
              onChange={setFullName}
              maxLength={60}
            />
            <PhoneField id="register-phone" value={phone} onChange={setPhone} />
            <PasswordField
              id="register-password"
              label={t("auth.password")}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              hint={t("auth.passwordHint")}
            />
            <FormError message={error} />
            {primaryButton(busy ? t("auth.sending") : t("auth.getCode"), !phoneOk || !fullName.trim() || !passwordOk)}
            <p className="text-center text-sm text-[#c4c4c4]">
              {t("auth.haveAccount")} {linkButton(t("auth.loginButton"), () => go("login"))}
            </p>
          </>
        )
      }
      return codeScreen
    }

    // forgot
    if (step === "form") {
      return (
        <>
          <PhoneField id="forgot-phone" value={phone} onChange={setPhone} />
          <FormError message={error} />
          {primaryButton(busy ? t("auth.sending") : t("auth.getCode"), !phoneOk)}
        </>
      )
    }
    if (step === "code") return codeScreen
    return (
      <>
        <PasswordField
          id="new-password"
          label={t("auth.newPasswordLabel")}
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          hint={t("auth.passwordHint")}
        />
        <PasswordField id="confirm-password" label={t("auth.repeatPassword")} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        <FormError message={error} />
        {primaryButton(t("auth.savePassword"), newPassword.length < 8 || newPassword !== confirmPassword)}
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent aria-describedby={undefined}>
        {!showTabs && (
          /* same vertical footprint as the tab row (h-11 + mb-6) so the modal height is stable */
          <button
            type="button"
            onClick={() => (step === "form" ? go("login") : go(mode, "form"))}
            className="mb-6 flex h-11 cursor-pointer items-center gap-1 text-sm text-[#c4c4c4] transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" />
            {step === "form" ? t("auth.backToLogin") : t("common.back")}
          </button>
        )}

        <DialogTitle className="mb-1">{title}</DialogTitle>
        <DialogDescription className="mb-6">{description}</DialogDescription>

        {showTabs && (
          <div role="tablist" aria-label={t("auth.tabsAria")} className="mb-6 grid grid-cols-2 rounded-full bg-[#2b2a2a] p-1">
            {(["login", "register"] as const).map((tab) => {
              const active = tab === mode
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => go(tab)}
                  className={`cursor-pointer rounded-full py-2 text-sm font-semibold transition-colors duration-300 ${
                    active ? "bg-white text-black" : "text-[#c4c4c4] hover:text-white"
                  }`}
                >
                  {tab === "login" ? t("auth.tabLogin") : t("auth.tabRegister")}
                </button>
              )
            })}
          </div>
        )}

        {/* min-height = tallest screen, so switching tabs/steps never resizes the modal */}
        {/* -mx-1 px-1: room for the inputs' focus ring, which the overflow clip would otherwise cut off */}
        <div className="-mx-1 min-h-76 overflow-hidden px-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={screenKey}
              variants={swap}
              initial="initial"
              animate="animate"
              exit="exit"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {renderScreen()}
            </motion.form>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal
