import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Car,
  DollarSign,
  FileText,
  LineChart,
  Plus,
  Sparkles,
} from "lucide-react"

type AnyRow = any // dashboard query rows are intentionally untyped — see handoff gotcha #5

function fmt(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n)
}

function daysAgo(date: string | null | undefined): number {
  if (!date) return 0
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

  const [vehiclesRes, salesRes, customersRes, profileRes] = await Promise.all([
    supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("sales").select("*").eq("user_id", user.id).order("sale_date", { ascending: false }),
    supabase.from("customers").select("id, hot").eq("user_id", user.id),
    supabase.from("profiles").select("dealer_name, ai_name").eq("id", user.id).single(),
  ])

  const vehicles  = (vehiclesRes.data  || []) as AnyRow[]
  const sales     = (salesRes.data     || []) as AnyRow[]
  const customers = (customersRes.data || []) as AnyRow[]
  const profile   = profileRes.data as { dealer_name?: string; ai_name?: string } | null

  const available  = vehicles.filter((v) => v.status === "Available")
  const mtdSales   = sales.filter((s) => String(s.sale_date) >= mtdStart)
  const hotLeads   = customers.filter((c) => c.hot === true)
  const mtdRevenue = mtdSales.reduce((s, x) => s + (Number(x.sale_price) || 0), 0)
  const mtdProfit  = mtdSales.reduce((s, x) => s + (Number(x.profit) || 0), 0)
  const avgMargin  = mtdSales.length
    ? mtdSales.reduce((s, x) => s + (Number(x.margin) || 0), 0) / mtdSales.length
    : 0

  const aged60 = available.filter((v) => daysAgo(String(v.acquisition_date) || String(v.created_at)) >= 60)
  const aged30 = available.filter((v) => {
    const d = daysAgo(String(v.acquisition_date) || String(v.created_at))
    return d >= 30 && d < 60
  })
  const fresh  = available.filter((v) => daysAgo(String(v.acquisition_date) || String(v.created_at)) < 30)

  // 6-month sales trend
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const count = sales.filter((s) => String(s.sale_date || "").startsWith(key)).length
    return { month: monthNames[d.getMonth()], count }
  })
  const trendMax = Math.max(...trendData.map((t) => t.count), 1)

  // Body type breakdown
  const bodyMap: Record<string, number> = {}
  for (const v of available) {
    const b = (v.body as string) || "Other"
    bodyMap[b] = (bodyMap[b] || 0) + 1
  }
  const bodyData = Object.entries(bodyMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const today = now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })
  const dealerName = profile?.dealer_name || "your dealership"
  const aiName = profile?.ai_name || "MAX"

  const agedValue = aged60.reduce((s, v) => s + (Number(v.price) || 0), 0)

  const recentStock = available.slice(0, 5)
  const recentSales = sales.slice(0, 5)

  return (
    <div className="space-y-6 -m-6 p-6">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">{dealerName}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/assistant"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1.5 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask {aiName}
          </Link>
          <Link
            href="/dashboard/stock"
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Vehicle
          </Link>
        </div>
      </div>

      {/* Aged alert strip — shown only when there's something to act on */}
      {aged60.length > 0 && (
        <Link
          href="/dashboard/stock"
          className="group flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 hover:bg-destructive/10 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <div className="text-sm min-w-0">
              <span className="font-medium text-destructive">{aged60.length} vehicle{aged60.length === 1 ? "" : "s"} aged 60+ days</span>
              <span className="text-muted-foreground"> · {fmt(agedValue)} tied up</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-destructive/70 group-hover:text-destructive transition-colors shrink-0" />
        </Link>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="In stock"    value={String(available.length)} sub={`${vehicles.length} total`} />
        <Stat label="Sold MTD"    value={String(mtdSales.length)}  sub={`${sales.length} all-time`} accent />
        <Stat label="MTD revenue" value={fmt(mtdRevenue)}          sub="this month" />
        <Stat label="MTD profit"  value={fmt(mtdProfit)}           sub={`${avgMargin.toFixed(1)}% avg margin`} accent />
      </div>

      {/* Health row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Inventory by age */}
        <Panel title="Inventory by age" sub={`${available.length} available`}>
          <div className="space-y-3">
            <AgeBar label="Fresh"   sublabel="0–30d"  count={fresh.length}   total={available.length} tone="ok" />
            <AgeBar label="Watch"   sublabel="31–60d" count={aged30.length}  total={available.length} tone="warn" />
            <AgeBar label="Aged"    sublabel="60d+"   count={aged60.length}  total={available.length} tone="danger" />
          </div>
        </Panel>

        {/* Body mix */}
        <Panel title="By body type" sub="Current stock mix">
          {bodyData.length === 0 ? (
            <Empty>No stock yet.</Empty>
          ) : (
            <div className="space-y-2.5">
              {bodyData.map(([name, count]) => {
                const pct = available.length ? Math.round((count / available.length) * 100) : 0
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground/80">{name}</span>
                      <span className="text-muted-foreground tabular-nums">{count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>

        {/* Trend */}
        <Panel title="Sales trend" sub="Last 6 months">
          <div className="flex items-end justify-between gap-2 h-28 pt-3">
            {trendData.map((t, i) => {
              const isCurrent = i === trendData.length - 1
              const h = t.count === 0 ? 4 : Math.max((t.count / trendMax) * 92, 8)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {t.count > 0 ? t.count : ""}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-sm",
                      isCurrent ? "bg-primary" : "bg-primary/30"
                    )}
                    style={{ height: `${h}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground/80">{t.month}</span>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {/* Aged detail + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <Panel
            title="Aged stock"
            sub="Oldest available cars — act on price or wholesale"
            action={
              <Link
                href="/dashboard/stock"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            }
          >
            {(() => {
              const agedRows = available
                .map((v) => ({ ...v, days: daysAgo(String(v.acquisition_date) || String(v.created_at)) }))
                .filter((v) => v.days >= 30)
                .sort((a, b) => b.days - a.days)
                .slice(0, 6)
              if (agedRows.length === 0) {
                return <Empty>No aged stock. Nice.</Empty>
              }
              return (
                <ul className="divide-y divide-border/60">
                  {agedRows.map((v) => {
                    const danger = v.days >= 60
                    return (
                      <li key={String(v.id)} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {v.year} {v.make} {v.model}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {(v.rego as string) || "No rego"}{v.stock_number ? ` · #${v.stock_number}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-sm font-medium tabular-nums text-foreground/90">
                            {fmt(Number(v.price) || 0)}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold tabular-nums w-12 text-right",
                              danger ? "text-destructive" : "text-amber-400"
                            )}
                          >
                            {v.days}d
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )
            })()}
          </Panel>
        </div>

        <Panel title="Today" sub={`${hotLeads.length} hot lead${hotLeads.length === 1 ? "" : "s"}`}>
          <nav className="grid gap-1">
            <ActionLink href="/dashboard/stock"     label="Add vehicle"      Icon={Plus} />
            <ActionLink href="/dashboard/sales"     label="Record a sale"    Icon={DollarSign} />
            <ActionLink href="/dashboard/assistant" label={`Ask ${aiName}`}  Icon={Sparkles} />
            <ActionLink href="/dashboard/forms"     label="Compliance forms" Icon={FileText} />
            <ActionLink href="/dashboard/intel"     label="Market intel"     Icon={LineChart} />
          </nav>
        </Panel>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel
          title="Recent stock"
          action={
            <Link href="/dashboard/stock" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          {recentStock.length === 0 ? (
            <Empty>
              No vehicles yet.{" "}
              <Link href="/dashboard/stock" className="text-primary hover:underline">
                Add your first
              </Link>
              .
            </Empty>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentStock.map((v) => {
                const days = daysAgo(String(v.acquisition_date) || String(v.created_at))
                return (
                  <li key={String(v.id)} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {v.year} {v.make} {v.model}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {(v.rego as string) || "No rego"}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-medium tabular-nums">{fmt(Number(v.price) || 0)}</span>
                      <span
                        className={cn(
                          "text-xs tabular-nums w-10 text-right",
                          days >= 60 ? "text-destructive" : days >= 30 ? "text-amber-400" : "text-emerald-400/90"
                        )}
                      >
                        {days}d
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent sales"
          action={
            <Link href="/dashboard/sales" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          {recentSales.length === 0 ? (
            <Empty>
              No sales yet.{" "}
              <Link href="/dashboard/sales" className="text-primary hover:underline">
                Record your first
              </Link>
              .
            </Empty>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentSales.map((s) => (
                <li key={String(s.id)} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {s.year} {s.make} {s.model}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {(s.buyer_name as string) || "Buyer"} · {s.sale_date as string}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-medium tabular-nums">{fmt(Number(s.sale_price) || 0)}</span>
                    <span className="text-xs tabular-nums text-emerald-400/90 w-16 text-right">
                      +{fmt(Number(s.profit) || 0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums leading-none",
          accent && "text-emerald-400"
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function Panel({
  title,
  sub,
  action,
  children,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card/40 p-4">
      <header className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold leading-tight">{title}</h2>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

function AgeBar({
  label,
  sublabel,
  count,
  total,
  tone,
}: {
  label: string
  sublabel: string
  count: number
  total: number
  tone: "ok" | "warn" | "danger"
}) {
  const pct = total ? Math.round((count / total) * 100) : 0
  const barColor =
    tone === "ok" ? "bg-emerald-500/70" : tone === "warn" ? "bg-amber-400/70" : "bg-destructive/70"
  const textColor =
    tone === "ok" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-destructive"
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="text-foreground/85">
          {label}
          <span className="text-muted-foreground/70 font-normal"> · {sublabel}</span>
        </div>
        <div className={cn("tabular-nums font-medium", textColor)}>
          {count}
          <span className="text-muted-foreground font-normal"> · {pct}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ActionLink({
  href,
  label,
  Icon,
}: {
  href: string
  label: string
  Icon: typeof Plus
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-md border border-border/60 bg-card/30 px-3 py-2 hover:bg-secondary hover:border-border transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm text-foreground/85 truncate">{label}</span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-6 text-xs text-muted-foreground">{children}</div>
  )
}

// Suppress unused hint when /admin metrics use hotLeads etc.
export const dynamic = "force-dynamic"
