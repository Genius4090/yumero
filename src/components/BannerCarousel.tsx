import { useCallback, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useI18n } from "@/i18n/useI18n"
import { Skeleton } from "./ui/skeleton"

export interface BannerSlideItem {
  src: string
  link?: string | null
}

interface BannerCarouselProps {
  items: BannerSlideItem[]
  /** Render skeleton slides while the banners are loading */
  loading?: boolean
}

// Buttons sit on the outer padding edge so half overlaps the poster, half hangs outside.
const arrowClass =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-[#2b2a2a] text-white shadow-lg transition-colors duration-200 hover:bg-[#3d3c3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"

/**
 * URLs that have finished loading during this page session. Lives in module scope, so it
 * survives route changes (no skeleton when coming back to Home) but resets on a full reload.
 */
const loadedImages = new Set<string>()

/** One poster. The wrapper fixes the box (16:10) so the skeleton and the image share the exact same size. */
const BannerSlide = ({ item, index }: { item: BannerSlideItem; index: number }) => {
  const { t } = useI18n()
  const [loaded, setLoaded] = useState(() => loadedImages.has(item.src))

  const markLoaded = useCallback(() => {
    loadedImages.add(item.src)
    setLoaded(true)
  }, [item.src])

  // Cached images can finish before React attaches onLoad – check on mount too.
  const imgRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.complete && img.naturalWidth > 0) markLoaded()
    },
    [markLoaded]
  )

  const poster = (
    <div className="relative aspect-16/10 w-full overflow-hidden rounded-3xl bg-[#232323]">
      {!loaded && <Skeleton className="absolute inset-0 rounded-3xl" />}
      <img
        ref={imgRef}
        src={item.src}
        alt={t("home.bannerAlt", { n: index + 1 })}
        onLoad={markLoaded}
        onError={markLoaded}
        draggable={false}
        className={`h-full w-full object-cover ${loaded ? "opacity-100" : "opacity-0 transition-opacity duration-500"}`}
      />
    </div>
  )

  if (!item.link) return poster
  const external = /^https?:\/\//.test(item.link)
  return (
    <a href={item.link} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-3xl">
      {poster}
    </a>
  )
}

const BannerCarousel = ({ items, loading = false }: BannerCarouselProps) => {
  const { t } = useI18n()
  const [viewportRef, embla] = useEmblaCarousel({
    loop: items.length > 2,
    align: "start",
    slidesToScroll: 2,
    duration: 28,
  })

  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla])
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla])

  if (!loading && items.length === 0) return null

  return (
    <div className="relative mx-auto w-full max-w-390 px-6">
      <button type="button" aria-label={t("common.prev")} onClick={scrollPrev} className={`${arrowClass} left-0.5`}>
        <ArrowLeft className="size-5" />
      </button>

      <div ref={viewportRef} className="overflow-hidden rounded-3xl">
        <div className="-ml-6 flex touch-pan-y">
          {loading && items.length === 0
            ? [0, 1].map((i) => (
                <div key={i} className="min-w-0 flex-[0_0_50%] pl-6">
                  <Skeleton className="aspect-16/10 w-full rounded-3xl" />
                </div>
              ))
            : items.map((item, index) => (
                <div key={`${item.src}-${index}`} className="min-w-0 flex-[0_0_50%] pl-6">
                  <BannerSlide item={item} index={index} />
                </div>
              ))}
        </div>
      </div>

      <button type="button" aria-label={t("common.next")} onClick={scrollNext} className={`${arrowClass} right-0.5`}>
        <ArrowRight className="size-5" />
      </button>
    </div>
  )
}

export default BannerCarousel
