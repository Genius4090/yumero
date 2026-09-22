import { useState, type ReactNode } from "react"
import { Check, ChevronDown, MapPin, Plus, Trash2 } from "lucide-react"
import { useAddresses } from "@/hooks/useAddresses"
import { useI18n } from "@/i18n/useI18n"
import AddressModal from "./AddressModal"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

interface AddressSelectProps {
  /** Custom trigger element; defaults to the header pill. */
  children?: ReactNode
  align?: "start" | "end"
}

const AddressSelect = ({ children, align = "start" }: AddressSelectProps) => {
  const { t } = useI18n()
  const { addresses, selected, selectAddress, addAddress, removeAddress } = useAddresses()
  const [listOpen, setListOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const hasAddresses = addresses.length > 0
  const fullAddress = (a: { address: string; house: string }) => [a.address, a.house].filter(Boolean).join(", ")
  const label = selected ? selected.title || fullAddress(selected) : t("address.yourAddress")

  const handleListOpenChange = (open: boolean) => {
    if (open && !hasAddresses) {
      // nothing saved yet – go straight to the form
      setModalOpen(true)
      return
    }
    setListOpen(open)
  }

  const openForm = () => {
    setListOpen(false)
    setModalOpen(true)
  }

  return (
    <>
      <Popover open={listOpen} onOpenChange={handleListOpenChange}>
        <PopoverTrigger asChild>
          {children ?? (
            <button
              type="button"
              aria-label={t("address.deliveryAddress")}
              className="flex h-11 cursor-pointer items-center gap-3 rounded-full pr-3 text-base font-semibold text-white transition-colors hover:bg-[#2b2a2a]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <span className="grid size-10 place-items-center rounded-full bg-[#2b2a2a]">
                <MapPin className="size-5" />
              </span>
              <span className="max-w-44 truncate">{label}</span>
              <ChevronDown className={`size-4 text-[#c4c4c4] transition-transform duration-200 ${listOpen ? "rotate-180" : ""}`} />
            </button>
          )}
        </PopoverTrigger>

        <PopoverContent
          align={align}
          sideOffset={8}
          className="w-92 rounded-2xl border border-white/10 bg-[#1c1c1c] p-3 text-white shadow-xl ring-0"
        >
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {addresses.map((item) => {
              const active = item.id === selected?.id
              return (
                <li
                  key={item.id}
                  className={`group flex items-center gap-1 rounded-xl pr-2 transition-colors ${
                    active ? "bg-[#2b2a2a]" : "hover:bg-[#2b2a2a]/60"
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      selectAddress(item.id)
                      setListOpen(false)
                    }}
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-xl py-3 pl-4 text-left focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.title || fullAddress(item)}</span>
                      {item.title && <span className="block truncate text-sm text-[#c4c4c4]">{fullAddress(item)}</span>}
                    </span>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full transition-all duration-200 ${
                        active ? "scale-100 bg-white text-black opacity-100" : "scale-75 opacity-0"
                      }`}
                    >
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("address.deleteAria", { name: item.title || fullAddress(item) })}
                    onClick={() => removeAddress(item.id)}
                    className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-[#8a8a8a] transition-colors hover:bg-[#3a3939] hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={openForm}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 py-3 font-medium transition-colors hover:border-white hover:bg-white hover:text-black"
          >
            <Plus className="size-4" />
            {t("address.addNew")}
          </button>
        </PopoverContent>
      </Popover>

      <AddressModal open={modalOpen} onOpenChange={setModalOpen} onSave={addAddress} />
    </>
  )
}

export default AddressSelect
