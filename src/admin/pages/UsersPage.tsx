import { useState } from "react"
import { Plus } from "lucide-react"
import type { adminUserType } from "@/@types"
import { useI18n } from "@/i18n/useI18n"
import { errorKey } from "@/lib/apiErrors"
import { useAdminUsers, useDeleteUser, useSaveUser } from "../api"
import AccountDialog from "../components/AccountDialog"
import { formatPhone } from "../format"
import { useToast } from "../toast"
import { Badge, Btn, DeleteButton, Input, PageHeader, Pagination, Table } from "../ui"
import { PAGE_SIZE } from "../usePagination"

const UsersPage = () => {
  const { t, tag } = useI18n()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<adminUserType | null | "new">(null)
  const toast = useToast()
  const pageSize = PAGE_SIZE

  const users = useAdminUsers({ search: search.trim() || undefined, page, pageSize })
  const save = useSaveUser()
  const remove = useDeleteUser()
  const pages = Math.max(1, Math.ceil((users.data?.total ?? 0) / pageSize))
  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(tag) : "—")

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
      <PageHeader title={t("admin.users.title")}>
        <Input
          placeholder={t("admin.users.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-72"
        />
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t("admin.users.add")}
        </Btn>
      </PageHeader>

      <Table>
        <thead>
          <tr>
            <th>{t("admin.common.name")}</th>
            <th>{t("admin.common.phone")}</th>
            <th>{t("admin.users.orders")}</th>
            <th>{t("admin.users.lastOrder")}</th>
            <th>{t("admin.common.registered")}</th>
            <th className="text-right">{t("admin.common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {users.isPending && (
            <tr>
              <td colSpan={6} className="text-[#8a8a8a]">{t("admin.common.loading")}</td>
            </tr>
          )}
          {users.data?.items.length === 0 && (
            <tr>
              <td colSpan={6} className="text-[#8a8a8a]">{t("admin.users.empty")}</td>
            </tr>
          )}
          {users.data?.items.map((u) => (
            <tr key={u.id}>
              <td className="font-medium">
                {u.fullName || "—"}
                {u.telegramLinked && (
                  <span className="ml-2">
                    <Badge tone="blue">Telegram</Badge>
                  </span>
                )}
              </td>
              <td className="text-[#c4c4c4]">{formatPhone(u.phone)}</td>
              <td className="text-[#c4c4c4]">{u.ordersCount}</td>
              <td className="text-[#c4c4c4]">{fmtDate(u.lastOrderAt)}</td>
              <td className="text-[#c4c4c4]">{fmtDate(u.createdAt)}</td>
              <td>
                <div className="flex justify-end gap-2">
                  <Btn size="sm" onClick={() => setEditing(u)}>
                    {t("admin.common.edit")}
                  </Btn>
                  <DeleteButton busy={remove.isPending} onConfirm={() => del(u.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination page={page} pages={pages} total={users.data?.total ?? 0} pageSize={pageSize} onChange={setPage} />

      {editing !== null && (
        <AccountDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          account={editing === "new" ? null : editing}
          title={editing === "new" ? t("admin.users.add") : t("admin.users.edit")}
          description={editing === "new" ? undefined : t("admin.users.deleteHint")}
          onSave={async (data) => {
            await save.mutateAsync({ id: editing === "new" ? undefined : editing.id, data })
            toast.success(t("admin.common.saved"))
          }}
        />
      )}
    </>
  )
}

export default UsersPage
