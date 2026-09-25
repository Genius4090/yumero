import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { bannerType } from "@/@types";
import { useI18n } from "@/i18n/useI18n";
import { mediaUrl } from "@/lib/api";
import { errorKey } from "@/lib/apiErrors";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  useAdminBanners,
  useDeleteBanner,
  useReorderBanners,
  useSaveBanner,
  type BannerInput,
} from "../api";
import SortableList from "../components/SortableList";
import { isDirty } from "../dirty";
import { useToast } from "../toast";
import {
  Badge,
  Btn,
  DeleteButton,
  ImageUpload,
  Input,
  Label,
  Notice,
  PageHeader,
  Toggle,
} from "../ui";

const toInput = (b: bannerType | null): BannerInput => ({
  imageUrl: b?.imageUrl ?? "",
  link: b?.link ?? null,
  sort: b?.sort ?? 0,
  isActive: b?.isActive ?? true,
});

const BannerForm = ({
  banner,
  onClose,
}: {
  banner: bannerType | null;
  onClose: () => void;
}) => {
  const { t } = useI18n();
  const toast = useToast();
  const save = useSaveBanner();
  const [form, setForm] = useState<BannerInput>(() => toInput(banner));
  const [error, setError] = useState<string | null>(null);
  const dirty = !banner || isDirty(form, toInput(banner));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) return;
    setError(null);
    try {
      await save.mutateAsync({
        id: banner?.id,
        data: {
          ...form,
          link: form.link?.trim() || null,
          sort: Math.round(form.sort),
        },
      });
      toast.success(t("admin.common.saved"));
      onClose();
    } catch (err) {
      setError(t(errorKey(err)));
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <ImageUpload
        aspect="wide"
        value={form.imageUrl || null}
        onChange={(url) => setForm((f) => ({ ...f, imageUrl: url ?? "" }))}
      />
      <Label label={t("admin.common.link")}>
        <Input
          value={form.link ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
          placeholder="/menu"
        />
      </Label>
      <Toggle
        label={t("admin.common.active")}
        checked={form.isActive}
        onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
      />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="mt-2 flex justify-end gap-3">
        <Btn onClick={onClose}>{t("admin.common.cancel")}</Btn>
        <Btn
          type="submit"
          variant="primary"
          disabled={save.isPending || !form.imageUrl || !dirty}
        >
          {save.isPending ? t("admin.common.saving") : t("admin.common.save")}
        </Btn>
      </div>
    </form>
  );
};

const BannersPage = () => {
  const { t } = useI18n();
  const toast = useToast();
  const banners = useAdminBanners();
  const remove = useDeleteBanner();
  const reorder = useReorderBanners();
  const [editing, setEditing] = useState<bannerType | null | "new">(null);

  const handleReorder = async (items: bannerType[]) => {
    try {
      await reorder.mutateAsync(items.map((b) => b.id));
    } catch (err) {
      toast.error(t(errorKey(err)));
    }
  };

  const del = async (id: number) => {
    try {
      await remove.mutateAsync(id);
      toast.success(t("admin.common.deleted"));
    } catch (err) {
      toast.error(t(errorKey(err)));
    }
  };

  return (
    <>
      <PageHeader title={t("admin.nav.banners")}>
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t("admin.common.add")}
        </Btn>
      </PageHeader>
      <p className="mb-4 text-sm text-[#8a8a8a]">
        {t("admin.common.dragToReorder")}
      </p>
      {banners.isPending && (
        <p className="text-[#8a8a8a]">{t("admin.common.loading")}</p>
      )}
      {banners.data?.length === 0 && (
        <p className="text-[#8a8a8a]">{t("admin.common.empty")}</p>
      )}
      <SortableList
        items={banners.data ?? []}
        onReorder={handleReorder}
        layout="grid"
        disabled={reorder.isPending}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3"
      >
        {(b, handle) => (
          <div
            className={`overflow-hidden rounded-2xl bg-[#1c1c1c] ${b.isActive ? "" : "opacity-60"}`}
          >
            <img
              src={mediaUrl(b.imageUrl) ?? b.imageUrl}
              alt=""
              className="aspect-16/10 w-full object-cover"
              draggable={false}
            />
            <div className="flex items-center gap-3 p-3">
              {handle}
              {b.isActive ? (
                <Badge tone="green">{t("admin.common.active")}</Badge>
              ) : (
                <Badge tone="red">{t("admin.common.inactive")}</Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Btn size="sm" onClick={() => setEditing(b)}>
                  {t("admin.common.edit")}
                </Btn>
                <DeleteButton
                  busy={remove.isPending}
                  onConfirm={() => del(b.id)}
                />
              </div>
            </div>
          </div>
        )}
      </SortableList>
      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent
          aria-describedby={undefined}
          className="w-[min(640px,95vw)] max-w-none"
        >
          <DialogTitle className="mb-6">
            {editing === "new" ? t("admin.common.add") : t("admin.common.edit")}
          </DialogTitle>
          {editing !== null && (
            <BannerForm
              banner={editing === "new" ? null : editing}
              onClose={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BannersPage;
