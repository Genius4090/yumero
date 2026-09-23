import { Search, X } from "lucide-react"
import { useI18n } from "@/i18n/useI18n"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  extraClass?: string
}

const SearchBar = ({ value, onChange, extraClass = "" }: SearchBarProps) => {
  const { t } = useI18n()
  return (
    <label className={`mt-10 flex w-full max-w-125 items-center justify-center gap-2 rounded-full bg-[#2b2a2a] px-4 py-3 ${extraClass}`}>
      <Search className="w-4 shrink-0 text-white" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("nav.searchPlaceholder")}
        aria-label={t("common.search")}
        className="outline-none w-full placeholder:text-[#c4c4c4] text-[#c4c4c4] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label={t("common.close")} className="cursor-pointer text-[#8a8a8a] hover:text-white">
          <X className="size-4" />
        </button>
      )}
    </label>
  )
}

export default SearchBar
