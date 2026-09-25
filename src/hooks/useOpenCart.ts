import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/context/CartContext"

/** Desktop opens the cart drawer; phones and tablets (below `lg`) navigate to the full cart page. */
export const useOpenCart = () => {
  const navigate = useNavigate()
  const { setSidebarOpen } = useCart()
  return useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) setSidebarOpen(true)
    else navigate("/cart")
  }, [navigate, setSidebarOpen])
}
