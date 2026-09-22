import { Link } from "react-router-dom"
import { Avatar } from "@/assets/images"
import { useI18n } from "@/i18n/useI18n"

/** Round avatar in the header; opens the profile page. */
const UserMenu = () => {
  const { t } = useI18n()
  return (
    <Link
      to="/profile"
      aria-label={t("nav.profile")}
      className="block size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-transparent transition-shadow hover:ring-white/30 focus-visible:outline-none focus-visible:ring-white/60"
    >
      {/* The photo is ~16x larger than this circle; a sub-pixel blur hides the downscaling aliasing. */}
      <img src={Avatar} alt="" className="size-full object-cover blur-[0.7px]" draggable={false} />
    </Link>
  )
}

export default UserMenu
