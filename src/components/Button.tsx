import type { FC, MouseEventHandler, ReactNode } from "react"

interface ButtonType {
    children:ReactNode,
    extraClass?:string,
    onClick?:MouseEventHandler<HTMLButtonElement>; 
}


const Button:FC<ButtonType> = ({children,extraClass,onClick}) => {
  return (
    <button onClick={onClick} className={`cursor-pointer bg-white text-black py-2 px-6 rounded-xl ${extraClass}`}>{children}</button>
  )
}

export default Button