import { useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { orderStatusApi } from "@/@types"
import { useI18n } from "@/i18n/useI18n"
import type { TranslationKey } from "@/i18n"
import { formatPrice } from "@/lib/format"
import { useDashboard, type DashboardData } from "../api"
import { Card, PageHeader } from "../ui"

const STATUSES: orderStatusApi[] = ["NEW", "COOKING", "ON_THE_WAY", "ARRIVED", "READY", "DELIVERED", "PICKED_UP", "CANCELLED"]
const PERIODS = [7, 30, 90] as const

// one hue per chart (single series each): the site accent for money, a cool blue for counts
const REVENUE_COLOR = "#ff0099"
const ORDERS_COLOR = "#4da3ff"
const GRID = "#2b2a2a"
const AXIS_TEXT = "#8a8a8a"

// phones: both groups share one row (3:2), pills stretch to fill; content-sized from sm
const pillCls = (active: boolean) =>
  `flex-1 cursor-pointer rounded-full px-2 py-1.5 text-center text-xs font-semibold whitespace-nowrap transition-colors sm:flex-none sm:px-4 sm:text-sm ${active ? "bg-white text-black" : "text-[#c4c4c4] hover:text-white"}`
const pillGroupCls = "flex min-w-0 rounded-full bg-[#2b2a2a] p-1 sm:flex-none"

const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))

interface TooltipPayload {
  active?: boolean
  label?: string
  payload?: readonly { value?: number | string }[]
}

const DarkTooltip = ({ active, label, payload, format, title }: TooltipPayload & { format: (v: number) => string; title: string }) => {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm shadow-xl">
      <p className="text-[#8a8a8a]">{label}</p>
      <p className="font-semibold text-white">
        {title}: {format(Number(payload[0].value ?? 0))}
      </p>
    </div>
  )
}

const DailyChart = ({
  data,
  dataKey,
  color,
  title,
  format,
  tag,
}: {
  data: DashboardData["series"]
  dataKey: "orders" | "revenue"
  color: string
  title: string
  format: (v: number) => string
  tag: string
}) => {
  const rows = data.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString(tag, { day: "2-digit", month: "2-digit" }) }))
  const tickEvery = Math.max(1, Math.ceil(rows.length / 8))
  return (
    <Card>
      <h2 className="mb-4 font-semibold">{title}</h2>
      {/* Recharts makes the chart focusable and draws a focus ring on click; hide it */}
      <div className="h-56 **:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={2} accessibilityLayer={false}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={{ fill: AXIS_TEXT, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} interval={tickEvery - 1} />
            <YAxis tick={{ fill: AXIS_TEXT, fontSize: 12 }} axisLine={false} tickLine={false} width={44} tickFormatter={compact} allowDecimals={false} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} content={(p) => <DarkTooltip {...(p as unknown as TooltipPayload)} format={format} title={title} />} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

const Dashboard = () => {
  const { t, tag } = useI18n()
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30)
  const [view, setView] = useState<"chart" | "table">("chart")
  const { data, isPending } = useDashboard(days)

  const today: { key: TranslationKey; value: string }[] = [
    { key: "admin.dashboard.activeOrders", value: String(data?.activeOrders ?? "–") },
    { key: "admin.dashboard.ordersToday", value: String(data?.ordersToday ?? "–") },
    { key: "admin.dashboard.revenueToday", value: data ? formatPrice(data.revenueToday) : "–" },
    { key: "admin.dashboard.customers", value: String(data?.customers ?? "–") },
    { key: "admin.dashboard.products", value: String(data?.productsCount ?? "–") },
  ]
  const period: { key: TranslationKey; value: string }[] = [
    { key: "admin.dashboard.periodOrders", value: String(data?.period.orders ?? "–") },
    { key: "admin.dashboard.periodRevenue", value: data ? formatPrice(data.period.revenue) : "–" },
    { key: "admin.dashboard.averageOrder", value: data ? formatPrice(data.period.averageOrder) : "–" },
  ]

  return (
    <>
      <PageHeader title={t("admin.nav.dashboard")} stack>
        <div className={`${pillGroupCls} flex-3`}>
          {PERIODS.map((p) => (
            <button key={p} type="button" onClick={() => setDays(p)} className={pillCls(days === p)}>
              {t(`admin.dashboard.period${p}`)}
            </button>
          ))}
        </div>
        <div className={`${pillGroupCls} flex-2`}>
          <button type="button" onClick={() => setView("chart")} className={pillCls(view === "chart")}>
            {t("admin.common.chart")}
          </button>
          <button type="button" onClick={() => setView("table")} className={pillCls(view === "table")}>
            {t("admin.common.table")}
          </button>
        </div>
      </PageHeader>

      <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 ${isPending ? "opacity-60" : ""}`}>
        {today.map((s) => (
          <Card key={s.key}>
            <p className="text-xs font-semibold tracking-wider text-[#8a8a8a] uppercase">{t(s.key)}</p>
            <p className="mt-2 text-xl font-semibold whitespace-nowrap sm:text-2xl">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className={`mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-3 ${isPending ? "opacity-60" : ""}`}>
        {period.map((s) => (
          <Card key={s.key} className="border border-white/5">
            <p className="text-xs font-semibold tracking-wider text-[#8a8a8a] uppercase">
              {t(s.key)} · {t(`admin.dashboard.period${days}`)}
            </p>
            <p className="mt-2 text-xl font-semibold whitespace-nowrap sm:text-2xl">{s.value}</p>
          </Card>
        ))}
      </div>

      {data && view === "chart" && (
        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DailyChart data={data.series} dataKey="revenue" color={REVENUE_COLOR} title={t("admin.dashboard.revenue")} format={formatPrice} tag={tag} />
          <DailyChart data={data.series} dataKey="orders" color={ORDERS_COLOR} title={t("admin.dashboard.orders")} format={String} tag={tag} />
        </div>
      )}
      {data && view === "table" && (
        <Card className="mt-6 max-h-96 overflow-y-auto p-0 sm:p-0">
          <table className="w-full text-left text-sm [&_td]:px-4 [&_td]:py-2 [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wider [&_th]:text-[#8a8a8a] [&_th]:uppercase [&_tbody_tr]:border-t [&_tbody_tr]:border-white/5">
            <thead>
              <tr>
                <th>{t("admin.dashboard.date")}</th>
                <th>{t("admin.dashboard.orders")}</th>
                <th>{t("admin.dashboard.revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {[...data.series].reverse().map((r) => (
                <tr key={r.date}>
                  <td>{new Date(r.date).toLocaleDateString(tag)}</td>
                  <td>{r.orders}</td>
                  <td>{formatPrice(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <p className="mt-2 text-xs text-[#8a8a8a]">{t("admin.dashboard.chartHint")}</p>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">{t("admin.dashboard.byStatus")}</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {STATUSES.map((s) => (
            <li key={s} className="rounded-xl bg-[#2b2a2a] p-3">
              <p className="text-xs text-[#8a8a8a]">{t(`admin.status.${s}`)}</p>
              <p className="mt-1 text-xl font-semibold">{data?.byStatus[s] ?? 0}</p>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

export default Dashboard
