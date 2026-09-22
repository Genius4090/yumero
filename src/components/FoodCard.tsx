import type { productType } from "@/@types"
import { ProductBurgerSet } from "@/assets/images"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"
import { pickText } from "@/lib/localized"

interface FoodCardProps {
  product: productType
  onClick: (product: productType) => void
}

/**
 * Menu grid card, four bands top to bottom: pink, thin white line, gray, darker title strip.
 * The dish sits over the pink/gray split.
 */
const FoodCard = ({ product, onClick }: FoodCardProps) => {
  const { locale } = useI18n()
  const name = pickText(product.name, locale)
  return (
    <button
      type="button"
      onClick={() => onClick(product)}
      aria-label={name}
      className="flex w-full cursor-pointer flex-col overflow-hidden rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <div className="relative aspect-[1/0.93] w-full">
        <div className="absolute inset-x-0 top-0 h-[54%] bg-[#ff0099]" />
        <div className="absolute inset-x-0 bottom-0 top-[54%] bg-[#2f2f2f]" />
        <div className="absolute inset-x-0 top-[54%] h-0.75 bg-white" />
        <img
          src={mediaUrl(product.imageUrl) ?? ProductBurgerSet}
          alt=""
          draggable={false}
          loading="lazy"
          className="absolute top-[52%] left-1/2 max-h-[62%] w-[56%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-lg"
        />
      </div>
      <span className="w-full truncate bg-[#1f1f1f] px-4 py-4 text-xl font-semibold">{name}</span>
    </button>
  )
}

export default FoodCard
