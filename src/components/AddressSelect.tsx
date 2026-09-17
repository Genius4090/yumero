import { useState } from "react"
import { Check, ChevronDown, MapPin, Plus } from "lucide-react"
import { useAddresses } from "@/hooks/useAddresses"
import AddressModal from "./AddressModal"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

const AddressSelect = () => {
  const { addresses, selected, selectAddress, addAddress } = useAddresses()
  const [listOpen, setListOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const hasAddresses = addresses.length > 0
  const label = selected ? selected.title || selected.address : "Ваш адрес"

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
          <button
            type="button"
            aria-label="Адрес доставки"
            className="flex h-11 cursor-pointer items-center gap-3 rounded-full pr-3 text-base font-semibold text-white transition-colors hover:bg-[#2b2a2a]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span className="grid size-10 place-items-center rounded-full bg-[#2b2a2a]">
              <MapPin className="size-5" />
            </span>
            <span className="max-w-56 truncate">{label}</span>
            <ChevronDown className={`size-4 text-[#c4c4c4] transition-transform duration-200 ${listOpen ? "rotate-180" : ""}`} />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[460px] rounded-2xl border border-white/10 bg-[#1c1c1c] p-3 text-white shadow-xl ring-0"
        >
          <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {addresses.map((item) => {
              const active = item.id === selected?.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      selectAddress(item.id)
                      setListOpen(false)
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      active ? "bg-[#2b2a2a]" : "hover:bg-[#2b2a2a]/60"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.title || item.address}</span>
                      {item.title && (
                        <span className="block truncate text-sm text-[#c4c4c4]">
                          {[item.address, item.house].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </span>
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full transition-all duration-200 ${
                        active ? "scale-100 bg-white text-black opacity-100" : "scale-75 opacity-0"
                      }`}
                    >
                      <Check className="size-4" strokeWidth={3} />
                    </span>
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
            Добавить новый адрес
          </button>
        </PopoverContent>
      </Popover>

      <AddressModal open={modalOpen} onOpenChange={setModalOpen} onSave={addAddress} />
    </>
  )
}

export default AddressSelect
