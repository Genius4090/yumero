import { useI18n } from "@/i18n/useI18n"

const NotFound = () => {
  const { t } = useI18n()
  return (
    <section className="grid min-h-screen place-items-center py-30">
      <h1 className="text-3xl font-semibold">{t("notFound.title")}</h1>
    </section>
  )
}

export default NotFound
