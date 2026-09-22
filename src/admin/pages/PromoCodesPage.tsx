import { useState, type FormEvent } from "react"
import { Plus } from "lucide-react"
import type { promoCodeType } from "@/@types"
import { useI18n } from "@/i18n/useI18n"
import { errorKey } from "@/lib/apiErrors"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAdminPromos, useDeletePromo, useSavePromo, type PromoInput } from "../api"
import DateTimePicker from "../components/DateTimePicker"
import { isDirty } from "../dirty"
import { useToast } from "../toast"
import { Badge, Btn, Checkbox, DeleteButton, Input, Label, Notice, NumberInput, PageHeader, Pagination, Table, Toggle } from "../ui"
import { PAGE_SIZE, usePagination } from "../usePagination"

const toInput = (p: promoCodeType | null): PromoInput => ({
  code: p?.code ?? "",
  percent: p?.percent ?? 10,
  isActive: p?.isActive ?? true,
  validFrom: p?.validFrom ?? null,
  validTo: p?.validTo ?? null,
  maxUses: p?.maxUses ?? null,
})

const PromoForm = ({ promo, onClose }: { promo: promoCodeType | null; onClose: () => void }) => {
  const { t } = useI18n()
  const toast = useToast()
  const save = useSavePromo()
  const [form, setForm] = useState<PromoInput>(() => toInput(promo))
  const [unlimited, setUnlimited] = useState(promo?.maxUses == null)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof PromoInput>(key: K, value: PromoInput[K]) => setForm((f) => ({ ...f, [key]: value }))
  const dirty = !promo || isDirty({ ...form, maxUses: unlimited ? null : form.maxUses }, toInput(promo))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await save.mutateAsync({ id: promo?.id, data: { ...form, code: form.code.trim().toUpperCase(), percent: Math.round(form.percent), maxUses: unlimited ? null : form.maxUses } })
      toast.success(t("admin.common.saved"))
      onClose()
    } catch (err) {
      setError(t(errorKey(err)))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Label label={t("admin.common.code")}>
          <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} pattern="[A-Za-z0-9_-]{3,32}" placeholder="YUMERO10" required className="uppercase" />
        </Label>
        <Label label={t("admin.common.percent")}>
          <NumberInput min={1} max={100} value={form.percent} onChange={(v) => set("percent", v ?? 0)} suffix="%" required />
        </Label>
        <div className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
          <span>{t("admin.common.validFrom")}</span>
          <DateTimePicker value={form.validFrom} onChange={(v) => set("validFrom", v)} />
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
          <span>{t("admin.common.validTo")}</span>
          <DateTimePicker value={form.validTo} onChange={(v) => set("validTo", v)} />
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-[#c4c4c4]">
          <span>{t("admin.common.maxUses")}</span>
          <NumberInput
            min={1}
            value={form.maxUses}
            onChange={(v) => set("maxUses", v)}
            placeholder={unlimited ? "∞" : "100"}
            required={!unlimited}
            disabled={unlimited}
            aria-label={t("admin.common.maxUses")}
          />
          <Checkbox
            checked={unlimited}
            onChange={(c) => {
              setUnlimited(c)
              if (c) set("maxUses", null)
            }}
            label={t("admin.common.unlimited")}
            className="mt-0.5"
          />
          <span className="text-xs text-[#8a8a8a]">{t("admin.common.maxUsesHint")}</span>
        </div>
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

const PromoCodesPage = () => {
  const { t, tag } = useI18n()
  const promos = useAdminPromos()
  const remove = useDeletePromo()
  const [editing, setEditing] = useState<promoCodeType | null | "new">(null)
  const pager = usePagination(promos.data)
  const toast = useToast()
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(tag) : "—")
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
      <PageHeader title={t("admin.nav.promo")}>
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t("admin.common.add")}
        </Btn>
      </PageHeader>

      <Table>
        <thead>
          <tr>
            <th>{t("admin.common.code")}</th>
            <th>{t("admin.common.percent")}</th>
            <th>{t("admin.common.validFrom")}</th>
            <th>{t("admin.common.validTo")}</th>
            <th>{t("admin.common.usedCount")}</th>
            <th>{t("admin.orders.status")}</th>
            <th className="text-right">{t("admin.common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {promos.isPending && (
            <tr>
              <td colSpan={7} className="text-[#8a8a8a]">{t("admin.common.loading")}</td>
            </tr>
          )}
          {promos.data?.length === 0 && (
            <tr>
              <td colSpan={7} className="text-[#8a8a8a]">{t("admin.common.empty")}</td>
            </tr>
          )}
          {pager.slice.map((p) => (
            <tr key={p.id}>
              <td className="font-mono font-semibold">{p.code}</td>
              <td>−{p.percent}%</td>
              <td className="text-[#c4c4c4]">{fmt(p.validFrom)}</td>
              <td className="text-[#c4c4c4]">{fmt(p.validTo)}</td>
              <td className="text-[#c4c4c4]">
                {p.usedCount} / {p.maxUses ?? "∞"}
              </td>
              <td>{p.isActive ? <Badge tone="green">{t("admin.common.active")}</Badge> : <Badge tone="red">{t("admin.common.inactive")}</Badge>}</td>
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
        <DialogContent aria-describedby={undefined} className="w-[min(600px,95vw)] max-w-none">
          <DialogTitle className="mb-6">{editing === "new" ? t("admin.common.add") : t("admin.common.edit")}</DialogTitle>
          {editing !== null && <PromoForm promo={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PromoCodesPage
