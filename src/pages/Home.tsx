import type { menuListType } from "@/@types"
import { MenuItemImg } from "@/assets/images"
import { useBanners, useCategories } from "@/api/hooks"
import { BannerCarousel, Button, MenuItem } from "@/components"
import { Skeleton } from "@/components/ui/skeleton"
import { MENU_TAB_KEY } from "@/data/categories"
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

  const setMenuId = (id: number | string) => {
    try {
      localStorage.setItem(MENU_TAB_KEY, String(id))
    } catch {
      // ignore
    }
  }

  const bannerItems = (banners.data ?? []).map((b) => ({ src: mediaUrl(b.imageUrl) ?? b.imageUrl, link: b.link }))

  return (
    <section className="min-h-screen pt-24 pb-16 sm:pt-30 sm:pb-20">
      <div className="flex flex-col items-center justify-center gap-10">
        <BannerCarousel items={bannerItems} loading={banners.isPending} />

        {/* phones: 2 / 3 equal columns; from md the original fixed 160px tiles that wrap and centre */}
        {/* no side padding from md: seven 160px tiles + gaps need the full 1280px cap to sit on one line */}
        <ul className="mt-10 grid w-full max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:flex md:flex-wrap md:justify-center md:gap-5 md:px-0">
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
