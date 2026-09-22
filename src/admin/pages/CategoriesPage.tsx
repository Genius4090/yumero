import { useState, type FormEvent } from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/i18n/useI18n"
import { errorKey } from "@/lib/apiErrors"
import { emptyLocalized, pickText } from "@/lib/localized"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAdminCategories, useDeleteCategory, useReorderCategories, useSaveCategory, type AdminCategory, type CategoryInput } from "../api"
import SortableList from "../components/SortableList"
import { isDirty } from "../dirty"
import { useToast } from "../toast"
import { Badge, Btn, DeleteButton, Input, Label, LocalizedInput, Notice, PageHeader, Pagination, Toggle } from "../ui"
import { PAGE_SIZE, usePagination } from "../usePagination"

const toInput = (c: AdminCategory | null): CategoryInput => ({
  slug: c?.slug ?? "",
  name: c?.name ?? emptyLocalized(),
  color: c?.color ?? "#ff0099",
  sort: c?.sort ?? 0,
  isActive: c?.isActive ?? true,
})

const CategoryForm = ({ category, onClose }: { category: AdminCategory | null; onClose: () => void }) => {
  const { t } = useI18n()
  const toast = useToast()
  const save = useSaveCategory()
  const [form, setForm] = useState<CategoryInput>(() => toInput(category))
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const dirty = !category || isDirty(form, toInput(category))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await save.mutateAsync({ id: category?.id, data: { ...form, slug: form.slug.trim().toLowerCase(), sort: Math.round(form.sort) } })
      toast.success(t("admin.common.saved"))
      onClose()
    } catch (err) {
      setError(t(errorKey(err)))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <LocalizedInput label={t("admin.common.name")} value={form.name} onChange={(v) => set("name", v)} />
      <div className="grid grid-cols-2 gap-4">
        <Label label={t("admin.common.slug")}>
          <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} pattern="[a-z0-9-]{2,40}" placeholder="burgers" required />
        </Label>
        <Label label={t("admin.common.color")}>
          <span className="flex items-center gap-2">
            <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="size-10 cursor-pointer rounded-lg bg-transparent" />
            <Input value={form.color} onChange={(e) => set("color", e.target.value)} pattern="#[0-9a-fA-F]{6}" />
          </span>
        </Label>
      </div>
      <Toggle label={t("admin.common.active")} checked={form.isActive} onChange={(v) => set("isActive", v)} />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="mt-2 flex justify-end gap-3">
        <Btn onClick={onClose}>{t("admin.common.cancel")}</Btn>
        <Btn type="submit" variant="primary" disabled={save.isPending || !dirty}>
          {save.isPending ? t("admin.common.saving") : t("admin.common.save")}
        </Btn>
      </div>
    </form>
  )
}

const CategoriesPage = () => {
  const { t, locale } = useI18n()
  const toast = useToast()
  const categories = useAdminCategories()
  const remove = useDeleteCategory()
  const reorder = useReorderCategories()
  const [editing, setEditing] = useState<AdminCategory | null | "new">(null)
  const pager = usePagination(categories.data)

  const del = async (id: number) => {
    try {
      await remove.mutateAsync(id)
      toast.success(t("admin.common.deleted"))
    } catch (err) {
      toast.error(t(errorKey(err)))
    }
  }

  // Dragging reorders within the current page; the API needs the full order, so splice the page back in.
  const handleReorder = async (pageItems: AdminCategory[]) => {
    const all = categories.data ?? []
    const full = [...all.slice(0, pager.from), ...pageItems, ...all.slice(pager.from + pageItems.length)]
    try {
      await reorder.mutateAsync(full.map((c) => c.id))
    } catch (err) {
      toast.error(t(errorKey(err)))
    }
  }

  return (
    <>
      <PageHeader title={t("admin.nav.categories")}>
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t("admin.common.add")}
        </Btn>
      </PageHeader>
      <p className="mb-4 text-sm text-[#8a8a8a]">{t("admin.common.dragToReorder")}</p>

      {categories.isPending && <p className="text-[#8a8a8a]">{t("admin.common.loading")}</p>}

      <div className="overflow-hidden rounded-2xl bg-[#1c1c1c]">
        <div className="grid grid-cols-[32px_40px_1fr_140px_80px_110px_200px] items-center gap-3 px-4 py-3 text-xs font-semibold tracking-wider text-[#8a8a8a] uppercase">
          <span />
          <span>{t("admin.common.color")}</span>
          <span>{t("admin.common.name")}</span>
          <span>{t("admin.common.slug")}</span>
          <span>{t("admin.common.products")}</span>
          <span>{t("admin.orders.status")}</span>
          <span className="text-right">{t("admin.common.actions")}</span>
        </div>
        <SortableList items={pager.slice} onReorder={handleReorder} disabled={reorder.isPending}>
          {(c, handle) => (
            <div className="grid grid-cols-[32px_40px_1fr_140px_80px_110px_200px] items-center gap-3 border-t border-white/5 bg-[#1c1c1c] px-4 py-3 text-sm">
              {handle}
              <span className="block size-8 rounded-lg" style={{ backgroundColor: c.color }} />
              <span className="truncate font-medium">{pickText(c.name, locale)}</span>
              <span className="truncate text-[#c4c4c4]">{c.slug}</span>
              <span className="text-[#c4c4c4]">{c.productsCount}</span>
              <span>{c.isActive ? <Badge tone="green">{t("admin.common.active")}</Badge> : <Badge tone="red">{t("admin.common.inactive")}</Badge>}</span>
              <div className="flex justify-end gap-2">
                <Btn size="sm" onClick={() => setEditing(c)}>
                  {t("admin.common.edit")}
                </Btn>
                <DeleteButton busy={remove.isPending} onConfirm={() => del(c.id)} />
              </div>
            </div>
          )}
        </SortableList>
      </div>
      <Pagination page={pager.page} pages={pager.pages} total={pager.total} pageSize={PAGE_SIZE} onChange={pager.setPage} />

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent aria-describedby={undefined} className="w-[min(640px,95vw)] max-w-none">
          <DialogTitle className="mb-6">{editing === "new" ? t("admin.common.add") : t("admin.common.edit")}</DialogTitle>
          {editing !== null && <CategoryForm category={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CategoriesPage
