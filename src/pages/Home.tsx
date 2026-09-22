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
    <section className="py-30 pb-20 min-h-screen">
      <div className="flex flex-col items-center justify-center gap-10">
        <BannerCarousel items={bannerItems} loading={banners.isPending} />

        <ul className="flex flex-wrap max-w-7xl gap-5 justify-center mt-10">
          {categories.isPending
            ? Array.from({ length: 8 }, (_, i) => (
                <li key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-[120px] w-[160px] rounded-lg" />
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
