import type { ComponentProps, FC } from "react"

interface ButtonProps extends ComponentProps<"button"> {
  extraClass?: string
}

const Button: FC<ButtonProps> = ({ children, extraClass = "", type = "button", className, ...rest }) => {
  return (
    <button
      type={type}
      className={`cursor-pointer hover:-translate-y-0.5 duration-300 bg-white text-black py-2 px-6 rounded-xl flex justify-between items-center gap-2 ${extraClass} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
