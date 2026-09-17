import { useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import Button from "./Button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog"

type AuthMode = "login" | "register"

interface FieldProps {
  id: string
  label: string
  type?: string
  placeholder?: string
  autoComplete?: string
}

const Field = ({ id, label, type = "text", placeholder, autoComplete }: FieldProps) => (
  <label htmlFor={id} className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
    {label}
    <input
      id={id}
      name={id}
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full rounded-full bg-[#2b2a2a] px-4 py-3 text-white outline-none transition-shadow placeholder:text-[#7a7a7a] focus:ring-2 focus:ring-white/40"
    />
  </label>
)

const slide = {
  initial: (dir: number) => ({ opacity: 0, x: 24 * dir }),
  animate: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -24 * dir }),
}

const AuthModal = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AuthMode>("login")
  const direction = mode === "login" ? -1 : 1

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="mb-1">{mode === "login" ? "С возвращением" : "Создать аккаунт"}</DialogTitle>
        <DialogDescription className="mb-6">
          {mode === "login" ? "Войдите, чтобы продолжить заказ" : "Регистрация займёт меньше минуты"}
        </DialogDescription>

        <div role="tablist" aria-label="Тип входа" className="mb-6 grid grid-cols-2 rounded-full bg-[#2b2a2a] p-1">
          {(["login", "register"] as const).map((tab) => {
            const active = tab === mode
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab)}
                className={`cursor-pointer rounded-full py-2 text-sm font-semibold transition-colors duration-300 ${
                  active ? "bg-white text-black" : "text-[#c4c4c4] hover:text-white"
                }`}
              >
                {tab === "login" ? "Вход" : "Регистрация"}
              </button>
            )
          })}
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {mode === "login" ? (
              <motion.form
                key="login"
                custom={direction}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col gap-4"
              >
                <Field id="login-email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
                <Field id="login-password" label="Пароль" type="password" placeholder="••••••••" autoComplete="current-password" />
                <Button type="submit" extraClass="mt-2 w-full justify-center py-3 font-semibold">
                  Войти
                </Button>
                <p className="text-center text-sm text-[#c4c4c4]">
                  Нет аккаунта?{" "}
                  <button type="button" onClick={() => setMode("register")} className="cursor-pointer font-semibold text-white hover:underline">
                    Зарегистрироваться
                  </button>
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                custom={direction}
                variants={slide}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                onSubmit={(e) => e.preventDefault()}
                className="flex flex-col gap-4"
              >
                <Field id="register-name" label="Имя" placeholder="Ваше имя" autoComplete="name" />
                <Field id="register-email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
                <Field id="register-password" label="Пароль" type="password" placeholder="••••••••" autoComplete="new-password" />
                <Field id="register-confirm" label="Повторите пароль" type="password" placeholder="••••••••" autoComplete="new-password" />
                <Button type="submit" extraClass="mt-2 w-full justify-center py-3 font-semibold">
                  Зарегистрироваться
                </Button>
                <p className="text-center text-sm text-[#c4c4c4]">
                  Уже есть аккаунт?{" "}
                  <button type="button" onClick={() => setMode("login")} className="cursor-pointer font-semibold text-white hover:underline">
                    Войти
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AuthModal
