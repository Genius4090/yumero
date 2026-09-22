import { useState, type FormEvent } from "react"
import { Plus } from "lucide-react"
import type { productType } from "@/@types"
import { ProductBurgerSet } from "@/assets/images"
import { useI18n } from "@/i18n/useI18n"
import { mediaUrl } from "@/lib/api"
import { errorKey } from "@/lib/apiErrors"
import { formatPrice } from "@/lib/format"
import { emptyLocalized, pickText } from "@/lib/localized"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAdminCategories, useAdminProducts, useDeleteProduct, useSaveProduct, type ProductInput } from "../api"
import { isDirty } from "../dirty"
import { useToast } from "../toast"
import { Badge, Btn, DeleteButton, ImageUpload, Input, Label, LocalizedInput, Notice, NumberInput, PageHeader, Pagination, Select, Table, Toggle } from "../ui"
import { PAGE_SIZE, usePagination } from "../usePagination"

const ALL_CATEGORIES = "__all__"
const POPULAR = "__popular__"

const toInput = (p: productType | null, fallbackCategory: number): ProductInput => ({
  categoryId: p?.categoryId ?? fallbackCategory,
  name: p?.name ?? emptyLocalized(),
  description: p?.description ?? emptyLocalized(),
  price: p?.price ?? 0,
  imageUrl: p?.imageUrl ?? null,
  isPopular: p?.isPopular ?? false,
  isAvailable: p?.isAvailable ?? true,
  sort: p?.sort ?? 0,
})

const ProductForm = ({ product, onClose }: { product: productType | null; onClose: () => void }) => {
  const { t, locale } = useI18n()
  const toast = useToast()
  const categories = useAdminCategories()
  const save = useSaveProduct()
  const [form, setForm] = useState<ProductInput>(() => toInput(product, categories.data?.[0]?.id ?? 0))
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const dirty = !product || isDirty(form, toInput(product, 0))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await save.mutateAsync({ id: product?.id, data: { ...form, price: Math.round(form.price), sort: Math.round(form.sort) } })
      toast.success(t("admin.common.saved"))
      onClose()
    } catch (err) {
      setError(t(errorKey(err)))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-[auto_1fr] gap-6">
        <ImageUpload value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
        <div className="flex flex-col gap-4">
          <Label label={t("admin.common.category")}>
            <Select
              value={form.categoryId ? String(form.categoryId) : ""}
              onChange={(v) => set("categoryId", Number(v))}
              placeholder={t("admin.common.category")}
              options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: pickText(c.name, locale) }))}
            />
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Label label={t("admin.common.price")}>
              <NumberInput min={0} step={1000} value={form.price} onChange={(v) => set("price", v ?? 0)} suffix="UZS" required />
            </Label>
            <Label label={t("admin.common.sort")}>
              <NumberInput min={0} value={form.sort} onChange={(v) => set("sort", v ?? 0)} />
            </Label>
          </div>
          <Toggle label={t("admin.common.popular")} checked={form.isPopular} onChange={(v) => set("isPopular", v)} />
          <Toggle label={t("admin.common.available")} checked={form.isAvailable} onChange={(v) => set("isAvailable", v)} />
        </div>
      </div>
      <LocalizedInput label={t("admin.common.name")} value={form.name} onChange={(v) => set("name", v)} />
      <LocalizedInput label={t("admin.common.description")} value={form.description} onChange={(v) => set("description", v)} multiline />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="mt-2 flex justify-end gap-3">
        <Btn onClick={onClose}>{t("admin.common.cancel")}</Btn>
        <Btn type="submit" variant="primary" disabled={save.isPending || !form.categoryId || !dirty}>
          {save.isPending ? t("admin.common.saving") : t("admin.common.save")}
        </Btn>
      </div>
    </form>
  )
}

const ProductsPage = () => {
  const { t, locale } = useI18n()
  const [search, setSearch] = useState("")
  // "all" | "popular" | category id as string
  const [filter, setFilter] = useState<string>(ALL_CATEGORIES)
  const [editing, setEditing] = useState<productType | null | "new">(null)
  const categories = useAdminCategories()
  const products = useAdminProducts({
    search: search.trim() || undefined,
    categoryId: filter !== ALL_CATEGORIES && filter !== POPULAR ? Number(filter) : undefined,
    popular: filter === POPULAR || undefined,
  })
  const remove = useDeleteProduct()
  const pager = usePagination(products.data?.items)
  const toast = useToast()

  const categoryName = (id: number) => pickText(categories.data?.find((c) => c.id === id)?.name, locale)
  const del = async (id: number) => {
    try {
      await remove.mutateAsync(id)
      toast.success(t("admin.common.deleted"))
    } catch (err) {
      toast.error(t(errorKey(err)))
    }
  }

  return (
    <>
      <PageHeader title={t("admin.nav.products")}>
        <Input
          placeholder={t("admin.common.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            pager.setPage(1)
          }}
          className="w-56"
        />
        <Select
          value={filter}
          onChange={(v) => {
            setFilter(v)
            pager.setPage(1)
          }}
          className="w-48"
          aria-label={t("admin.common.category")}
          options={[
            { value: ALL_CATEGORIES, label: t("admin.orders.all") },
            { value: POPULAR, label: `★ ${t("admin.common.popular")}` },
            ...(categories.data ?? []).map((c) => ({ value: String(c.id), label: pickText(c.name, locale) })),
          ]}
        />
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t("admin.common.add")}
        </Btn>
      </PageHeader>

      <Table>
        <thead>
          <tr>
            <th>{t("admin.common.image")}</th>
            <th>{t("admin.common.name")}</th>
            <th>{t("admin.common.category")}</th>
            <th>{t("admin.common.price")}</th>
            <th>{t("admin.common.sort")}</th>
            <th>{t("admin.orders.status")}</th>
            <th className="text-right">{t("admin.common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {products.isPending && (
            <tr>
              <td colSpan={7} className="text-[#8a8a8a]">{t("admin.common.loading")}</td>
            </tr>
          )}
          {products.data?.items.length === 0 && (
            <tr>
              <td colSpan={7} className="text-[#8a8a8a]">{t("admin.common.empty")}</td>
            </tr>
          )}
          {pager.slice.map((p) => (
            <tr key={p.id} className={p.isAvailable ? "" : "opacity-60"}>
              <td>
                <img src={mediaUrl(p.imageUrl) ?? ProductBurgerSet} alt="" className="size-12 rounded-lg bg-[#e9e5d9] object-contain p-1" />
              </td>
              <td className="font-medium">
                {pickText(p.name, locale)}
                {p.isPopular && (
                  <span className="ml-2">
                    <Badge tone="amber">{t("admin.common.popular")}</Badge>
                  </span>
                )}
              </td>
              <td className="text-[#c4c4c4]">{categoryName(p.categoryId)}</td>
              <td>{formatPrice(p.price)}</td>
              <td className="text-[#c4c4c4]">{p.sort}</td>
              <td>{p.isAvailable ? <Badge tone="green">{t("admin.common.available")}</Badge> : <Badge tone="red">{t("admin.common.inactive")}</Badge>}</td>
              <td>
                <div className="flex justify-end gap-2">
                  <Btn size="sm" onClick={() => setEditing(p)}>
                    {t("admin.common.edit")}
                  </Btn>
                  <DeleteButton busy={remove.isPending} onConfirm={() => del(p.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={pager.page} pages={pager.pages} total={pager.total} pageSize={PAGE_SIZE} onChange={pager.setPage} />

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent aria-describedby={undefined} className="max-h-[92vh] w-[min(760px,95vw)] max-w-none overflow-y-auto">
          <DialogTitle className="mb-6">{editing === "new" ? t("admin.common.add") : t("admin.common.edit")}</DialogTitle>
          {editing !== null && <ProductForm product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProductsPage
