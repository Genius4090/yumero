import type { menuListType } from "@/@types"
import { MenuItemImg } from "@/assets/images"
import { useBanners, useCategories } from "@/api/hooks"
import { BannerCarousel, Button, MenuItem } from "@/components"
import { Skeleton } from "@/components/ui/skeleton"
import { saveMenuTab } from "@/data/categories"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"
import { pickText } from "@/lib/localized"

import { MoveRight } from "lucide-react"
import { Link } from "react-router-dom"

const Home = () => {
  const { t, locale } = useI18n()
  const categories = useCategories()
  const banners = useBanners()

  // "Popular" is a menu-only tab; the home grid shows the real categories
  const menuList: menuListType[] = (categories.data ?? []).map((c) => ({
    id: c.id,
    content: pickText(c.name, locale),
    image: MenuItemImg,
    menuColor: c.color,
  }))

  const setMenuId = (id: number | string) => saveMenuTab(Number(id))

  const bannerItems = (banners.data ?? []).map((b) => ({ src: mediaUrl(b.imageUrl) ?? b.imageUrl, link: b.link }))

  return (
    <section className="min-h-screen pt-24 pb-16 sm:pt-30 sm:pb-20">
      <div className="flex flex-col items-center justify-center gap-10">
        <BannerCarousel items={bannerItems} loading={banners.isPending} />

        {/* phones: 2 / 3 equal columns; from md the original fixed 160px tiles that wrap and centre */}
        {/* a centred wrapping row at every width, so an odd last tile sits in the middle: tiles are 2 / 3 per row
            on phones and the original fixed 160px tiles from md (no side padding there: seven of them need the full 1280px cap) */}
        <ul className="mt-10 flex w-full max-w-7xl flex-wrap justify-center gap-4 px-4 *:w-[calc(50%-0.5rem)] sm:*:w-[calc(33.333%-0.667rem)] md:gap-5 md:px-0 md:*:w-auto">
          {categories.isPending
            ? Array.from({ length: 8 }, (_, i) => (
                <li key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="aspect-4/3 w-full rounded-lg md:aspect-auto md:h-30 md:w-40" />
                  <Skeleton className="h-4 w-20" />
                </li>
              ))
            : menuList.map((item) => <MenuItem key={item.id} item={item} setMenuId={setMenuId} />)}
        </ul>
      </div>
      <Link to={"/menu"} onClick={() => setMenuId(0)}>
        <Button extraClass="m-auto font-semibold py-3 px-8 mt-8">
          <p>{t("home.menuButton")}</p> <MoveRight className="w-5" />
        </Button>
      </Link>
    </section>
  )
}

export default Home
