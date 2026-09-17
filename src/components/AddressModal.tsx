import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { LocateFixed, Search, X } from "lucide-react"
import type { addressType } from "@/@types"
import { reverseGeocode } from "@/lib/geocode"
import Button from "./Button"
import MapPicker from "./MapPicker"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog"

type AddressDraft = Omit<addressType, "id">

// Amir Temur square, Tashkent – default map position until the user locates themself
const DEFAULT_COORDS = { lat: 41.3111, lng: 69.2797 }

const emptyDraft = (): AddressDraft => ({
  title: "",
  address: "",
  house: "",
  apartment: "",
  floor: "",
  entrance: "",
  comment: "",
  ...DEFAULT_COORDS,
})

const inputClass =
  "w-full rounded-xl bg-[#2b2a2a] px-4 py-3.5 text-white outline-none transition-shadow placeholder:text-[#8a8a8a] focus:ring-2 focus:ring-white/40"

interface AddressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (draft: AddressDraft) => void
}

const AddressModal = ({ open, onOpenChange, onSave }: AddressModalProps) => {
  const [draft, setDraft] = useState<AddressDraft>(emptyDraft)
  const [locating, setLocating] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<number | null>(null)

  const reset = () => {
    setDraft(emptyDraft())
    setLocateError(null)
    setLocating(false)
    setGeocoding(false)
    abortRef.current?.abort()
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  // Cancel any in-flight geocoding if the component unmounts
  useEffect(() => () => {
    abortRef.current?.abort()
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
  }, [])

  const update = (field: keyof AddressDraft) => (e: ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }))

  /** Fill the address fields for a coordinate (debounced so map drags don't spam the API). */
  const fillAddressFor = useCallback((lat: number, lng: number, delay = 0) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setGeocoding(true)
      const result = await reverseGeocode(lat, lng, controller.signal)
      if (controller.signal.aborted) return
      setGeocoding(false)
      if (result) {
        setDraft((d) => ({
          ...d,
          address: result.address || d.address,
          house: result.house || d.house,
        }))
      }
    }, delay)
  }, [])

  // User dragged/zoomed the map: the centre is the new location
  const handleMapChange = useCallback(
    (lat: number, lng: number) => {
      setDraft((d) => ({ ...d, lat, lng }))
      fillAddressFor(lat, lng, 600)
    },
    [fillAddressFor]
  )

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setLocateError("Геолокация недоступна в этом браузере")
      return
    }
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        setDraft((d) => ({ ...d, lat, lng }))
        fillAddressFor(lat, lng)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocateError("Не удалось определить местоположение")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const canSave = draft.address.trim().length > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onSave({ ...draft, address: draft.address.trim(), title: draft.title.trim() })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-[min(1040px,95vw)] max-w-none p-0 md:h-140"
      >
        <div className="grid h-full grid-cols-1 gap-6 p-6 md:grid-cols-2 md:p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="mb-2">
              <DialogTitle>Выберите адрес доставки</DialogTitle>
              <DialogDescription className="mt-1">Это даёт возможность увидеть актуальное меню</DialogDescription>
            </div>

            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#8a8a8a]" />
              <input
                value={draft.address}
                onChange={update("address")}
                placeholder={geocoding ? "Определяем адрес…" : "Введите адрес"}
                aria-label="Адрес"
                autoFocus
                className={`${inputClass} pl-12`}
              />
            </label>

            <input value={draft.title} onChange={update("title")} placeholder="Название" aria-label="Название" className={inputClass} />

            <div className="grid grid-cols-2 gap-3">
              <input value={draft.house} onChange={update("house")} placeholder="Дом" aria-label="Дом" className={inputClass} />
              <input value={draft.apartment} onChange={update("apartment")} placeholder="Квартира" aria-label="Квартира" className={inputClass} />
              <input value={draft.floor} onChange={update("floor")} placeholder="Этаж" aria-label="Этаж" className={inputClass} />
              <input value={draft.entrance} onChange={update("entrance")} placeholder="Подъезд" aria-label="Подъезд" className={inputClass} />
            </div>

            <input value={draft.comment} onChange={update("comment")} placeholder="Комментарий курьеру" aria-label="Комментарий курьеру" className={inputClass} />

            <Button
              type="submit"
              disabled={!canSave}
              extraClass="mt-auto w-full justify-center py-3.5 font-semibold disabled:cursor-not-allowed disabled:bg-[#3a3939] disabled:text-[#8a8a8a] disabled:hover:translate-y-0"
            >
              Сохранить
            </Button>
          </form>

          <div className="relative min-h-80 overflow-hidden rounded-2xl bg-[#2b2a2a]">
            <MapPicker lat={draft.lat} lng={draft.lng} onChange={handleMapChange} className="h-full w-full" />

            <DialogClose
              aria-label="Закрыть"
              className="absolute top-3 right-3 z-1100 grid size-10 cursor-pointer place-items-center rounded-full bg-[#1c1c1c] text-white shadow-lg transition-colors hover:bg-[#2b2a2a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="size-5" />
            </DialogClose>

            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-1100 flex flex-col items-center gap-2">
              {locateError && (
                <span className="rounded-full bg-[#1c1c1c] px-3 py-1 text-xs text-red-300">{locateError}</span>
              )}
              <button
                type="button"
                onClick={locate}
                disabled={locating}
                className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-[#1c1c1c] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-[#2b2a2a] disabled:cursor-wait disabled:opacity-70"
              >
                <LocateFixed className={`size-4 ${locating ? "animate-spin" : ""}`} />
                {locating ? "Определяем…" : "Определение местоположения"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddressModal
