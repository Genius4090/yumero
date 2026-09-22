import { Link } from "react-router-dom"
import { UserRound } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"

/** Round avatar in the header; opens the profile page. Shows a person icon until a photo is uploaded. */
const UserMenu = () => {
  const { t } = useI18n()
  const { user } = useAuth()
  const photo = mediaUrl(user?.avatarUrl)
  return (
    <Link
      to="/profile"
      aria-label={t("nav.profile")}
      className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#2b2a2a] text-[#c4c4c4] ring-2 ring-transparent transition-shadow hover:ring-white/30 focus-visible:outline-none focus-visible:ring-white/60"
    >
      {photo ? <img src={photo} alt="" className="size-full object-cover" draggable={false} /> : <UserRound className="size-5" />}
    </Link>
  )
}

export default UserMenu
