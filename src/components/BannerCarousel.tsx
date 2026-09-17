import { useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface BannerCarouselProps {
  images: string[]
}

// Buttons sit on the outer padding edge so half overlaps the poster, half hangs outside.
const arrowClass =
  "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white shadow-lg transition-colors duration-200 hover:bg-[#3d3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"

const BannerCarousel = ({ images }: BannerCarouselProps) => {
  const [viewportRef, embla] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 2,
    duration: 28,
  })

  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla])
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla])

  return (
    <div className="relative mx-auto w-full max-w-360 px-5">
      <button type="button" aria-label="Назад" onClick={scrollPrev} className={`${arrowClass} left-0`}>
        <ArrowLeft className="size-5" />
      </button>

      <div ref={viewportRef} className="overflow-hidden rounded-3xl">
        <div className="-ml-5 flex touch-pan-y">
          {images.map((src, index) => (
            <div key={index} className="min-w-0 flex-[0_0_50%] pl-5">
              <img src={src} alt={`Акция ${index + 1}`} className="w-full rounded-3xl object-cover" draggable={false} />
            </div>
          ))}
        </div>
      </div>

      <button type="button" aria-label="Вперёд" onClick={scrollNext} className={`${arrowClass} right-0`}>
        <ArrowRight className="size-5" />
      </button>
    </div>
  )
}

export default BannerCarousel
