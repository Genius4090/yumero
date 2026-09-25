import { CartPanel } from "@/components/CartSidebar"
import { useI18n } from "@/i18n/useI18n"

/** Full-page cart for phones and tablets (the desktop header opens the same content as a drawer). */
const Cart = () => {
  const { t } = useI18n()
  return (
    <section className="min-h-screen pt-24 pb-16 sm:py-30">
      <div className="mx-auto w-full max-w-md px-4 sm:px-6">
        <CartPanel layout="page" title={<h1 className="text-2xl font-semibold">{t("cart.title")}</h1>} />
      </div>
    </section>
  )
}

export default Cart
