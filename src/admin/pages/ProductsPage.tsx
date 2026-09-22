import { Fragment, useMemo, useState, type FormEvent } from "react";
import { LayoutGrid, LayoutList, Plus } from "lucide-react";
import type { productType } from "@/@types";
import { ProductBurgerSet } from "@/assets/images";
import { useI18n } from "@/i18n/useI18n";
import { mediaUrl } from "@/lib/api";
import { errorKey } from "@/lib/apiErrors";
import { formatPrice } from "@/lib/format";
import { emptyLocalized, pickText } from "@/lib/localized";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  useAdminCategories,
  useAdminProducts,
  useDeleteProduct,
  useSaveProduct,
  type ProductInput,
} from "../api";
import { isDirty } from "../dirty";
import { useToast } from "../toast";
import {
  Badge,
  Btn,
  DeleteButton,
  ImageUpload,
  Input,
  Label,
  LocalizedInput,
  Notice,
  NumberInput,
  PageHeader,
  Pagination,
  Select,
  Table,
  Toggle,
} from "../ui";
import { PAGE_SIZE, usePagination } from "../usePagination";

const ALL_CATEGORIES = "__all__";
const POPULAR = "__popular__";

type ProductsView = "table" | "cards";
const VIEW_KEY = "admin:productsView";
/** Last chosen layout; table when nothing is stored or storage is unavailable. */
const readView = (): ProductsView => {
  try {
    return localStorage.getItem(VIEW_KEY) === "cards" ? "cards" : "table";
  } catch {
    return "table";
  }
};
const viewBtnCls = (active: boolean) =>
  `grid size-9 cursor-pointer place-items-center rounded-full transition-colors ${active ? "bg-white text-black" : "text-[#c4c4c4] hover:text-white"}`;

const toInput = (
  p: productType | null,
  fallbackCategory: number,
): ProductInput => ({
  categoryId: p?.categoryId ?? fallbackCategory,
  name: p?.name ?? emptyLocalized(),
  description: p?.description ?? emptyLocalized(),
  price: p?.price ?? 0,
  imageUrl: p?.imageUrl ?? null,
  isPopular: p?.isPopular ?? false,
  isAvailable: p?.isAvailable ?? true,
  sort: p?.sort ?? 0,
});

const ProductForm = ({
  product,
  onClose,
}: {
  product: productType | null;
  onClose: () => void;
}) => {
  const { t, locale } = useI18n();
  const toast = useToast();
  const categories = useAdminCategories();
  const save = useSaveProduct();
  const [form, setForm] = useState<ProductInput>(() =>
    toInput(product, categories.data?.[0]?.id ?? 0),
  );
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const dirty = !product || isDirty(form, toInput(product, 0));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await save.mutateAsync({
        id: product?.id,
        data: {
          ...form,
          price: Math.round(form.price),
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
      <div className="grid grid-cols-[auto_1fr] gap-6">
        <ImageUpload
          value={form.imageUrl}
          onChange={(url) => set("imageUrl", url)}
        />
        <div className="flex flex-col gap-4">
          <Label label={t("admin.common.category")}>
            <Select
              value={form.categoryId ? String(form.categoryId) : ""}
              onChange={(v) => set("categoryId", Number(v))}
              placeholder={t("admin.common.category")}
              options={(categories.data ?? []).map((c) => ({
                value: String(c.id),
                label: pickText(c.name, locale),
              }))}
            />
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Label label={t("admin.common.price")}>
              <NumberInput
                min={0}
                step={1000}
                value={form.price}
                onChange={(v) => set("price", v ?? 0)}
                suffix="UZS"
                required
              />
            </Label>
            <Label label={t("admin.common.sort")}>
              <NumberInput
                min={0}
                value={form.sort}
                onChange={(v) => set("sort", v ?? 0)}
              />
            </Label>
          </div>
          <Toggle
            label={t("admin.common.popular")}
            checked={form.isPopular}
            onChange={(v) => set("isPopular", v)}
          />
          <Toggle
            label={t("admin.common.available")}
            checked={form.isAvailable}
            onChange={(v) => set("isAvailable", v)}
          />
        </div>
      </div>
      <LocalizedInput
        label={t("admin.common.name")}
        value={form.name}
        onChange={(v) => set("name", v)}
      />
      <LocalizedInput
        label={t("admin.common.description")}
        value={form.description}
        onChange={(v) => set("description", v)}
        multiline
      />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="mt-2 flex justify-end gap-3">
        <Btn onClick={onClose}>{t("admin.common.cancel")}</Btn>
        <Btn
          type="submit"
          variant="primary"
          disabled={save.isPending || !form.categoryId || !dirty}
        >
          {save.isPending ? t("admin.common.saving") : t("admin.common.save")}
        </Btn>
      </div>
    </form>
  );
};

const ProductsPage = () => {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  // "all" | "popular" | category id as string
  const [filter, setFilter] = useState<string>(ALL_CATEGORIES);
  const [editing, setEditing] = useState<productType | null | "new">(null);
  const categories = useAdminCategories();
  const products = useAdminProducts({
    search: search.trim() || undefined,
    categoryId:
      filter !== ALL_CATEGORIES && filter !== POPULAR
        ? Number(filter)
        : undefined,
    popular: filter === POPULAR || undefined,
  });
  const remove = useDeleteProduct();
  const toast = useToast();
  const [view, setView] = useState<ProductsView>(readView);

  // "All" shows every dish grouped under its category, in the categories' own order.
  const grouped = filter === ALL_CATEGORIES;
  const ordered = useMemo(() => {
    const items = products.data?.items ?? [];
    if (!grouped) return items;
    const order = new Map((categories.data ?? []).map((c, i) => [c.id, i]));
    return [...items].sort(
      (a, b) =>
        (order.get(a.categoryId) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.categoryId) ?? Number.MAX_SAFE_INTEGER) ||
        a.sort - b.sort ||
        a.id - b.id,
    );
  }, [products.data, categories.data, grouped]);
  const pager = usePagination(ordered);
  // Consecutive dishes of the same category on the current page form one section.
  const sections = grouped
    ? pager.slice.reduce<{ categoryId: number; items: productType[] }[]>(
        (acc, p) => {
          const last = acc[acc.length - 1];
          if (last && last.categoryId === p.categoryId) last.items.push(p);
          else acc.push({ categoryId: p.categoryId, items: [p] });
          return acc;
        },
        [],
      )
    : [{ categoryId: -1, items: pager.slice }];
  const switchView = (v: ProductsView) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // private mode / blocked storage: the choice just won't be remembered
    }
  };

  const categoryName = (id: number) =>
    pickText(categories.data?.find((c) => c.id === id)?.name, locale);
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
      <PageHeader title={t("admin.nav.products")}>
        <Input
          placeholder={t("admin.common.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            pager.setPage(1);
          }}
          className="w-56"
        />
        <Select
          value={filter}
          onChange={(v) => {
            setFilter(v);
            pager.setPage(1);
          }}
          className="w-48"
          aria-label={t("admin.common.category")}
          options={[
            { value: ALL_CATEGORIES, label: t("admin.orders.all") },
            { value: POPULAR, label: `★ ${t("admin.common.popular")}` },
            ...(categories.data ?? []).map((c) => ({
              value: String(c.id),
              label: pickText(c.name, locale),
            })),
          ]}
        />
        <div
          role="radiogroup"
          aria-label={t("admin.common.view")}
          className="flex h-11 items-center rounded-full bg-[#2b2a2a] p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={view === "table"}
            onClick={() => switchView("table")}
            title={t("admin.common.viewTable")}
            className={viewBtnCls(view === "table")}
          >
            <LayoutList className="size-4" />
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={view === "cards"}
            onClick={() => switchView("cards")}
            title={t("admin.common.viewCards")}
            className={viewBtnCls(view === "cards")}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
        <Btn variant="primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t("admin.common.add")}
        </Btn>
      </PageHeader>

      {view === "cards" && (
        <>
          {products.isPending && (
            <p className="text-[#8a8a8a]">{t("admin.common.loading")}</p>
          )}
          {products.data?.items.length === 0 && (
            <p className="text-[#8a8a8a]">{t("admin.common.empty")}</p>
          )}
          {sections.map((section) => (
            <section key={section.categoryId} className="mb-8 last:mb-0">
              {grouped && (
                <h2 className="mb-3 flex items-center gap-3 text-sm font-semibold tracking-wider text-[#c4c4c4] uppercase">
                  {categoryName(section.categoryId) || "—"}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-[#8a8a8a]">
                    {section.items.length}
                  </span>
                </h2>
              )}
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {section.items.map((p) => (
                  <li
                    key={p.id}
                    className={`flex flex-col overflow-hidden rounded-2xl bg-[#1c1c1c] ${p.isAvailable ? "" : "opacity-60"}`}
                  >
                    <div className="relative grid aspect-4/3 place-items-center bg-[#e9e5d9] p-4">
                      <img
                        src={mediaUrl(p.imageUrl) ?? ProductBurgerSet}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                        draggable={false}
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {p.isPopular && (
                          <Badge tone="amber">{t("admin.common.popular")}</Badge>
                        )}
                        {!p.isAvailable && (
                          <Badge tone="red">{t("admin.common.inactive")}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <p
                        className="truncate font-medium"
                        title={pickText(p.name, locale)}
                      >
                        {pickText(p.name, locale)}
                      </p>
                      <p className="truncate text-sm text-[#8a8a8a]">
                        {categoryName(p.categoryId)}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        <span className="font-semibold">
                          {formatPrice(p.price)}
                        </span>
                        <div className="flex gap-2">
                          <Btn size="sm" onClick={() => setEditing(p)}>
                            {t("admin.common.edit")}
                          </Btn>
                          <DeleteButton
                            busy={remove.isPending}
                            onConfirm={() => del(p.id)}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      {view === "table" && (
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
                <td colSpan={7} className="text-[#8a8a8a]">
                  {t("admin.common.loading")}
                </td>
              </tr>
            )}
            {products.data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-[#8a8a8a]">
                  {t("admin.common.empty")}
                </td>
              </tr>
            )}
            {sections.map((section) => (
              <Fragment key={section.categoryId}>
                {grouped && (
                  <tr className="bg-[#161616]">
                    <td
                      colSpan={7}
                      className="py-2! text-xs font-semibold tracking-wider text-[#c4c4c4] uppercase"
                    >
                      {categoryName(section.categoryId) || "—"}
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-[#8a8a8a]">
                        {section.items.length}
                      </span>
                    </td>
                  </tr>
                )}
                {section.items.map((p) => (
                  <tr key={p.id} className={p.isAvailable ? "" : "opacity-60"}>
                    <td>
                      <img
                        src={mediaUrl(p.imageUrl) ?? ProductBurgerSet}
                        alt=""
                        className="size-12 rounded-lg bg-[#e9e5d9] object-contain p-1"
                      />
                    </td>
                    <td className="font-medium">
                      {pickText(p.name, locale)}
                      {p.isPopular && (
                        <span className="ml-2">
                          <Badge tone="amber">{t("admin.common.popular")}</Badge>
                        </span>
                      )}
                    </td>
                    <td className="text-[#c4c4c4]">
                      {categoryName(p.categoryId)}
                    </td>
                    <td>{formatPrice(p.price)}</td>
                    <td className="text-[#c4c4c4]">{p.sort}</td>
                    <td>
                      {p.isAvailable ? (
                        <Badge tone="green">{t("admin.common.available")}</Badge>
                      ) : (
                        <Badge tone="red">{t("admin.common.inactive")}</Badge>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Btn size="sm" onClick={() => setEditing(p)}>
                          {t("admin.common.edit")}
                        </Btn>
                        <DeleteButton
                          busy={remove.isPending}
                          onConfirm={() => del(p.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination
        page={pager.page}
        pages={pager.pages}
        total={pager.total}
        pageSize={PAGE_SIZE}
        onChange={pager.setPage}
      />

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[92vh] w-[min(760px,95vw)] max-w-none overflow-y-auto"
        >
          <DialogTitle className="mb-6">
            {editing === "new" ? t("admin.common.add") : t("admin.common.edit")}
          </DialogTitle>
          {editing !== null && (
            <ProductForm
              product={editing === "new" ? null : editing}
              onClose={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductsPage;
