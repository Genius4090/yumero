import { useState } from "react"
import { Plus } from "lucide-react"
import type { adminUserType } from "@/@types"
import { useAuth } from "@/context/AuthContext"
import { useI18n } from "@/i18n/useI18n"
import { errorKey } from "@/lib/apiErrors"
import { useDeleteStaff, useSaveStaff, useStaff } from "../api"
import AccountDialog from "../components/AccountDialog"
import { formatPhone } from "../format"
import { useToast } from "../toast"
import { AvatarThumb, Badge, Btn, DeleteButton, PageHeader, Pagination, Table } from "../ui"
import { PAGE_SIZE, usePagination } from "../usePagination"

const StaffPage = () => {
  const { t, tag } = useI18n()
  const { user: me } = useAuth()
  const staff = useStaff()
  const save = useSaveStaff()
  const remove = useDeleteStaff()
  const [editing, setEditing] = useState<adminUserType | null | "new">(null)
  const toast = useToast()
  const pager = usePagination(staff.data)

  const del = async (id: string) => {
    try {
      await remove.mutateAsync(id)
      toast.success(t("admin.common.deleted"))
    } catch (err) {
      toast.error(t(errorKey(err)))
    }
  }

  return (
    <>
      <PageHeader title={t("admin.staff.title")}>
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t("admin.staff.add")}
        </Btn>
      </PageHeader>

      <Table>
        <thead>
          <tr>
            <th>{t("admin.common.name")}</th>
            <th>{t("admin.common.phone")}</th>
            <th>{t("admin.staff.role")}</th>
            <th>{t("admin.staff.ordersCreated")}</th>
            <th>{t("admin.common.registered")}</th>
            <th className="text-right">{t("admin.common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {staff.isPending && (
            <tr>
              <td colSpan={6} className="text-[#8a8a8a]">{t("admin.common.loading")}</td>
            </tr>
          )}
          {pager.slice.map((u) => {
            const isMe = u.id === me?.id
            const isSuper = u.role === "SUPERADMIN"
            return (
              <tr key={u.id}>
                <td className="font-medium">
                  <span className="flex items-center gap-3">
                    <AvatarThumb url={u.avatarUrl} name={u.fullName} />
                    <span>
                      {u.fullName || "—"}
                      {isMe && <span className="ml-2 text-xs text-[#8a8a8a]">({t("admin.staff.you")})</span>}
                    </span>
                  </span>
                </td>
                <td className="text-[#c4c4c4] whitespace-nowrap">{formatPhone(u.phone)}</td>
                <td>{isSuper ? <Badge tone="amber">{t("admin.roles.SUPERADMIN")}</Badge> : <Badge tone="blue">{t("admin.roles.ADMIN")}</Badge>}</td>
                <td className="text-[#c4c4c4]">{u.ordersCreated ?? 0}</td>
                <td className="text-[#c4c4c4] whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString(tag)}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    {(!isSuper || isMe) && (
                      <Btn size="sm" onClick={() => setEditing(u)}>
                        {t("admin.common.edit")}
                      </Btn>
                    )}
                    {!isSuper && !isMe && <DeleteButton busy={remove.isPending} onConfirm={() => del(u.id)} />}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
      <Pagination page={pager.page} pages={pager.pages} total={pager.total} pageSize={PAGE_SIZE} onChange={pager.setPage} />

      {editing !== null && (
        <AccountDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          account={editing === "new" ? null : editing}
          title={editing === "new" ? t("admin.staff.add") : t("admin.staff.edit")}
          description={editing === "new" ? t("admin.staff.addHint") : undefined}
          onSave={async (data) => {
            await save.mutateAsync({ id: editing === "new" ? undefined : editing.id, data })
            toast.success(t("admin.common.saved"))
          }}
        />
      )}
    </>
  )
}

export default StaffPage
