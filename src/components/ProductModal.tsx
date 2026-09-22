import { X } from "lucide-react"
import type { productType } from "@/@types"
import { ProductBurgerSet } from "@/assets/images"
import { formatPrice } from "@/lib/format"
import { mediaUrl } from "@/lib/api"
import { pickText } from "@/lib/localized"
import { useSettings } from "@/context/SettingsContext"
import { useCart } from "@/context/CartContext"
import { useI18n } from "@/i18n/useI18n"
import QuantityStepper from "./QuantityStepper"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"

interface ProductModalProps {
  product: productType | null
  onClose: () => void
}

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const { t, locale } = useI18n()
  const { settings } = useSettings()
  const { quantityOf, addItem, setQuantity, subtotal, count, setSidebarOpen } = useCart()

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  const inCart = product ? quantityOf(product.id) : 0

  // The stepper edits the cart directly: + adds one, − removes one (0 = removed)
  const handleQty = (next: number) => {
    if (!product) return
    if (inCart === 0 && next > 0) addItem(product, next)
    else setQuantity(product.id, next)
  }

  const openCart = () => {
    if (settings.closeProductAfterAdd) handleOpenChange(false)
    setSidebarOpen(true)
  }

  return (
    <Dialog open={product !== null} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-120 max-w-[95vw] overflow-hidden rounded-2xl border-0 bg-[#1c1c1c] p-0"
      >
        {product && (
          <>
            <div className="relative grid h-80 place-items-center bg-[#e9e5d9]">
              <img src={mediaUrl(product.imageUrl) ?? ProductBurgerSet} alt={pickText(product.name, locale)} draggable={false} className="h-68 w-auto max-w-[90%] object-contain" />
              <DialogClose
                aria-label={t("common.close")}
                className="absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full bg-[#1c1c1c] text-white transition-colors hover:bg-[#3a3939] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X className="size-5" />
              </DialogClose>
            </div>

            <div className="flex flex-col gap-5 p-6 pt-5">
              <div>
                <DialogTitle className="text-3xl">{pickText(product.name, locale)}</DialogTitle>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xl font-semibold">{formatPrice(product.price)}</span>
                  {product.isPopular && (
                    <span className="rounded-md bg-[#f5c400] px-2 py-1 text-xs font-semibold text-black">{t("product.popular")}</span>
                  )}
                </div>
              </div>

              <DialogDescription className="text-base text-white">{pickText(product.description, locale)}</DialogDescription>

              <div className="mt-1 flex items-stretch gap-3">
                <QuantityStepper value={inCart} min={0} onChange={handleQty} />

                <button
                  type="button"
                  onClick={openCart}
                  className="flex flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg bg-[#ff0099] px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#ff2bab] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <span>{t("product.goToCart")}</span>
                  <span>{count > 0 ? formatPrice(subtotal) : t("common.empty")}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ProductModal
