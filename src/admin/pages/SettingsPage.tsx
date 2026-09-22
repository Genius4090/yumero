import { useState, type FormEvent, type ReactNode } from "react";
import { Lock, MapPin } from "lucide-react";
import type { restaurantSettingsType } from "@/@types";
import MapPicker from "@/components/MapPicker";
import { useI18n } from "@/i18n/useI18n";
import { errorKey } from "@/lib/apiErrors";
import { useAdminSettings, useSaveSettings } from "../api";
import { isDirty } from "../dirty";
import { useToast } from "../toast";
import {
  Btn,
  Card,
  Input,
  Label,
  LocalizedInput,
  NumberInput,
  PageHeader,
  Toggle,
} from "../ui";

const Section = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) => (
  <Card className="flex flex-col gap-4">
    <div>
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-xs text-[#8a8a8a]">{hint}</p>}
    </div>
    {children}
  </Card>
);

const SOCIALS = [
  {
    key: "instagramUrl",
    label: "admin.settings.instagramUrl",
    placeholder: "https://instagram.com/yumero",
  },
  {
    key: "tiktokUrl",
    label: "admin.settings.tiktokUrl",
    placeholder: "https://tiktok.com/@yumero",
  },
  {
    key: "telegramUrl",
    label: "admin.settings.telegramUrl",
    placeholder: "https://t.me/yumero",
  },
  {
    key: "vkUrl",
    label: "admin.settings.vkUrl",
    placeholder: "https://vk.com/yumero",
  },
] as const;

const SettingsForm = ({ initial }: { initial: restaurantSettingsType }) => {
  const { t } = useI18n();
  const save = useSaveSettings();
  const toast = useToast();
  const [form, setForm] = useState<restaurantSettingsType>(initial);
  // Last saved values: the Save button stays disabled until something differs from them.
  const [saved, setSaved] = useState<restaurantSettingsType>(initial);
  const dirty = isDirty(form, saved);
  // The map is locked until "Edit location" is pressed, so a stray drag cannot move the restaurant.
  const [mapEditing, setMapEditing] = useState(false);
  const [draft, setDraft] = useState({ lat: initial.lat, lng: initial.lng });
  const [mapBusy, setMapBusy] = useState(false);

  const set = <K extends keyof restaurantSettingsType>(
    key: K,
    value: restaurantSettingsType[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const startMapEdit = () => {
    setDraft({ lat: form.lat, lng: form.lng });
    setMapEditing(true);
  };
  const cancelMapEdit = () => setMapEditing(false);
  const saveLocation = async () => {
    setMapBusy(true);
    try {
      const result = await save.mutateAsync({ lat: draft.lat, lng: draft.lng });
      setForm((f) => ({ ...f, lat: result.lat, lng: result.lng }));
      setSaved((s) => ({ ...s, lat: result.lat, lng: result.lng }));
      setMapEditing(false);
      toast.success(t("admin.settings.locationSaved"));
    } catch (err) {
      toast.error(t(errorKey(err)));
    } finally {
      setMapBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    try {
      const result = await save.mutateAsync({
        ...form,
        telegramUrl: form.telegramUrl?.trim() || null,
        instagramUrl: form.instagramUrl?.trim() || null,
        tiktokUrl: form.tiktokUrl?.trim() || null,
        vkUrl: form.vkUrl?.trim() || null,
        packagingFee: Math.round(form.packagingFee),
        deliveryFee: Math.round(form.deliveryFee),
      });
      setForm(result);
      setSaved(result);
      toast.success(t("admin.common.saved"));
    } catch (err) {
      toast.error(t(errorKey(err)));
    }
  };

  return (
    <>
      <PageHeader title={t("admin.nav.settings")} className="mx-auto max-w-3xl">
        <Btn
          type="submit"
          form="settings-form"
          variant="primary"
          disabled={save.isPending || !dirty}
        >
          {save.isPending ? t("admin.common.saving") : t("admin.common.save")}
        </Btn>
      </PageHeader>
      <form
        id="settings-form"
        onSubmit={submit}
        className="mx-auto flex max-w-3xl flex-col gap-6"
      >
        <Section title={t("admin.settings.sectionGeneral")}>
          <Toggle
            label={t("admin.settings.isOpen")}
            hint={t("admin.settings.isOpenHint")}
            checked={form.isOpen}
            onChange={(v) => set("isOpen", v)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Label label={t("admin.settings.name")}>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                maxLength={60}
              />
            </Label>
            <Label label={t("admin.settings.phone")}>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+998 90 123 45 67"
                maxLength={30}
              />
            </Label>
          </div>
        </Section>

        <Section
          title={t("admin.settings.sectionLocation")}
          hint={t("admin.settings.mapHint")}
        >
          <LocalizedInput
            label={t("admin.settings.address")}
            value={form.address}
            onChange={(v) => set("address", v)}
          />
          <div
            className={`relative overflow-hidden rounded-2xl bg-[#2b2a2a] ${mapEditing ? "ring-2 ring-[#ff0099]" : ""}`}
          >
            <MapPicker
              lat={mapEditing ? draft.lat : form.lat}
              lng={mapEditing ? draft.lng : form.lng}
              onChange={(lat, lng) =>
                setDraft({
                  lat: Number(lat.toFixed(6)),
                  lng: Number(lng.toFixed(6)),
                })
              }
              className="h-80 w-full"
            />
            {/* MapPicker isolates its own stacking context, so this sibling sits above the map and swallows every touch, drag and wheel event. */}
            {!mapEditing && (
              <div
                className="absolute inset-0 z-10 grid place-items-end bg-black/25 p-3"
                aria-hidden
              >
                <span className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white/90">
                  <Lock className="size-3.5" />
                  {t("admin.settings.mapLocked")}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#8a8a8a]">
              {t("admin.settings.coordinates")}:{" "}
              <span className="font-mono text-[#c4c4c4]">
                {(mapEditing ? draft.lat : form.lat).toFixed(5)},{" "}
                {(mapEditing ? draft.lng : form.lng).toFixed(5)}
              </span>
            </p>
            <div className="flex gap-2">
              {mapEditing ? (
                <>
                  <Btn size="sm" onClick={cancelMapEdit} disabled={mapBusy}>
                    {t("admin.common.cancel")}
                  </Btn>
                  <Btn
                    size="sm"
                    variant="primary"
                    onClick={saveLocation}
                    disabled={mapBusy}
                  >
                    <MapPin className="size-4" />
                    {mapBusy
                      ? t("admin.common.saving")
                      : t("admin.settings.saveLocation")}
                  </Btn>
                </>
              ) : (
                <Btn size="sm" variant="outline" onClick={startMapEdit}>
                  <MapPin className="size-4" />
                  {t("admin.settings.editLocation")}
                </Btn>
              )}
            </div>
          </div>
        </Section>

        <Section title={t("admin.settings.sectionFees")}>
          <div className="grid grid-cols-2 gap-4">
            <Label label={t("admin.settings.packagingFee")}>
              <NumberInput
                min={0}
                step={500}
                value={form.packagingFee}
                onChange={(v) => set("packagingFee", v ?? 0)}
                suffix="UZS"
                required
              />
            </Label>
            <Label label={t("admin.settings.deliveryFee")}>
              <NumberInput
                min={0}
                step={1000}
                value={form.deliveryFee}
                onChange={(v) => set("deliveryFee", v ?? 0)}
                suffix="UZS"
                required
              />
            </Label>
          </div>
        </Section>

        <Section
          title={t("admin.settings.sectionSocials")}
          hint={t("admin.settings.socialsHint")}
        >
          <div className="grid grid-cols-2 gap-4">
            {SOCIALS.map((s) => (
              <Label key={s.key} label={t(s.label)}>
                <Input
                  type="url"
                  value={form[s.key] ?? ""}
                  onChange={(e) => set(s.key, e.target.value)}
                  placeholder={s.placeholder}
                  maxLength={200}
                />
              </Label>
            ))}
          </div>
        </Section>
      </form>
    </>
  );
};

const SettingsPage = () => {
  const { t } = useI18n();
  const settings = useAdminSettings();

  if (!settings.data) {
    return (
      <>
        <PageHeader title={t("admin.nav.settings")} />
        <p className="text-[#8a8a8a]">{t("admin.common.loading")}</p>
      </>
    );
  }
  return <SettingsForm initial={settings.data} />;
};

export default SettingsPage;
