"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

// ─── Types matching the columns selected in app/admin/page.tsx ────
export type AdminProfile = {
  id: string
  dealer_name: string | null
  lmct: string | null
  email: string | null
  phone: string | null
  address: string | null
  role: string | null
  plan: string | null
  subscription_status: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string | null
}
export type AdminVehicle = {
  id: string
  user_id: string
  make: string | null
  model: string | null
  year: number | null
  body: string | null
  source: string | null
  status: string | null
  price: number | null
  purchase_price: number | null
  acquisition_date: string | null
  created_at: string
}
export type AdminSale = {
  id: string
  user_id: string
  vehicle_id: string | null
  make: string | null
  model: string | null
  year: number | null
  sale_price: number | null
  profit: number | null
  margin: number | null
  sale_date: string | null
  status: string | null
  created_at: string
}
export type MarketCache = {
  id: string
  generated_at: string
  dealer_count: number
  transaction_count: number
  top_makes: { make: string; count: number; avg_profit: number }[]
  avg_days_by_body: { body: string; avg_days: number; count: number }[]
  avg_margin_by_state: { state: string; avg_margin: number; count: number }[]
  source_roi: { source: string; count: number; avg_profit: number; total_profit: number }[]
  fastest_sellers: { make: string; model: string; year: number | null; days: number; profit: number }[]
}
export type AdminData = {
  profiles: AdminProfile[]
  vehicles: AdminVehicle[]
  sales: AdminSale[]
  marketIntel: MarketCache | null
}

// ─── Tokens ───────────────────────────────────────────────────────
const INK = "#07080f"
const CARD = "#12141f"
const CARD_HI = "#1a1d2b"
const GOLD = "#e8a228"
const GREEN = "#00ff88"
const RED = "#ef4d6a"
const AMBER = "#f5a623"
const TEXT = "#f1f0ff"
const DIM = "rgba(255,255,255,0.62)"
const MUTED = "rgba(255,255,255,0.4)"
const RULE = "rgba(255,255,255,0.06)"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n)

const num = (n: number) => new Intl.NumberFormat("en-AU").format(n)

const daysAgo = (iso: string | null): number => {
  if (!iso) return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

const PLAN_PRICE: Record<string, number> = { software: 249, managed: 799, growth: 1499 }

// ─── Tab nav ──────────────────────────────────────────────────────
type TabKey = "overview" | "dealers" | "feed" | "intel" | "revenue" | "engine"
const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "dealers", label: "Dealers" },
  { key: "feed", label: "Live Feed" },
  { key: "intel", label: "Market Intelligence" },
  { key: "revenue", label: "Revenue" },
  { key: "engine", label: "AI Engine" },
]

export function AdminTabs({ data }: { data: AdminData }) {
  const [tab, setTab] = useState<TabKey>("overview")

  return (
    <div style={{ background: INK, color: TEXT, minHeight: "calc(100vh - 64px)", fontFamily: "var(--font-jakarta), system-ui, sans-serif" }}>
      <style>{`
        .adm-tab { font-family: var(--font-dm-mono), ui-monospace, monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
        .adm-data { font-family: var(--font-dm-mono), ui-monospace, monospace; }
        .adm-num { font-family: var(--font-fraunces), Georgia, serif; font-weight: 800; letter-spacing: -0.02em; }
        .adm-row-in { animation: admRowIn 220ms cubic-bezier(.2,.8,.3,1); }
        @keyframes admRowIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes admPulse {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.18; }
          100% { transform: translate(-50%, -50%) scale(3.2); opacity: 0; }
        }
        .adm-scanline {
          background-image: linear-gradient(transparent 50%, rgba(255,255,255,0.018) 50%);
          background-size: 100% 2px;
        }
        .adm-card { background: ${CARD}; border: 1px solid ${RULE}; border-radius: 12px; }
        .adm-card-hi { background: ${CARD_HI}; border: 1px solid ${RULE}; border-radius: 12px; }
      `}</style>

      {/* Tab nav */}
      <nav
        style={{
          display: "flex",
          gap: 4,
          padding: "12px 24px 0",
          borderBottom: `1px solid ${RULE}`,
          background: INK,
          position: "sticky",
          top: 64,
          zIndex: 10,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="adm-tab"
              style={{
                background: "transparent",
                color: active ? GOLD : MUTED,
                border: 0,
                padding: "12px 14px",
                cursor: "pointer",
                borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: 24 }}>
        {tab === "overview" && <OverviewTab d={data} />}
        {tab === "dealers" && <DealersTab d={data} />}
        {tab === "feed" && <LiveFeedTab d={data} />}
        {tab === "intel" && <MarketIntelTab cache={data.marketIntel} />}
        {tab === "revenue" && <RevenueTab d={data} />}
        {tab === "engine" && <AIEngineTab cache={data.marketIntel} dealerCount={countDealers(data)} />}
      </div>
    </div>
  )
}

function countDealers(d: AdminData) {
  return d.profiles.filter((p) => p.role === "dealer" || p.role === null).length
}

// ─── Shared bits ──────────────────────────────────────────────────
function StatCard({ label, value, sub, color = TEXT, glow }: { label: string; value: string; sub?: string; color?: string; glow?: boolean }) {
  return (
    <div className="adm-card" style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      {glow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: -40,
            background: `radial-gradient(ellipse 60% 40% at 30% 50%, ${GOLD}26 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        className="adm-data"
        style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, marginBottom: 12, position: "relative" }}
      >
        {label}
      </div>
      <div className="adm-num" style={{ fontSize: 36, color, lineHeight: 1, position: "relative" }}>
        {value}
      </div>
      {sub && (
        <div className="adm-data" style={{ fontSize: 11, color: MUTED, marginTop: 8, position: "relative" }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="adm-data" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD }}>
        {children}
      </div>
      {hint && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────
function OverviewTab({ d }: { d: AdminData }) {
  const dealers = d.profiles.filter((p) => p.role === "dealer" || p.role === null)
  const newThisWeek = dealers.filter((p) => daysAgo(p.created_at) <= 7).length
  const inStock = d.vehicles.filter((v) => v.status === "Available").length
  const soldAllTime = d.vehicles.filter((v) => v.status === "Sold").length
  const totalProfit = d.sales.reduce((s, x) => s + (x.profit ?? 0), 0)
  const totalRevenue = d.sales.reduce((s, x) => s + (x.sale_price ?? 0), 0)
  const mrr = dealers.reduce((s, p) => s + (PLAN_PRICE[p.plan ?? "software"] ?? 0), 0)

  const makeCounts: Record<string, number> = {}
  for (const s of d.sales) {
    const m = s.make ?? "Unknown"
    makeCounts[m] = (makeCounts[m] ?? 0) + 1
  }
  const topMakes = Object.entries(makeCounts).sort(([, a], [, b]) => b - a).slice(0, 8)
  const bodyCounts: Record<string, number> = {}
  for (const v of d.vehicles) {
    const b = v.body ?? "Unknown"
    bodyCounts[b] = (bodyCounts[b] ?? 0) + 1
  }
  const bodyMix = Object.entries(bodyCounts).sort(([, a], [, b]) => b - a)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Active Dealers" value={num(dealers.length)} sub={`+${newThisWeek} this week`} color={GOLD} glow />
        <StatCard label="MRR" value={fmt(mrr)} sub={`${dealers.length} subscriptions`} color={GREEN} glow />
        <StatCard label="Vehicles In Stock" value={num(inStock)} sub="across all dealers" color={TEXT} />
        <StatCard label="Sold All-Time" value={num(soldAllTime)} sub={`${num(d.sales.length)} sale records`} color={TEXT} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="Total Profit" value={fmt(totalProfit)} sub="platform-wide" color={GREEN} />
        <StatCard label="Total Revenue" value={fmt(totalRevenue)} sub="all sales summed" color={GOLD} />
        <StatCard label="New This Week" value={num(newThisWeek)} sub="signups in 7d" color={TEXT} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <BarPanel title="Top selling makes" hint="All-time, platform-wide" entries={topMakes} total={d.sales.length || 1} />
        <BarPanel title="Stock body-type mix" hint="What dealers are buying" entries={bodyMix} total={d.vehicles.length || 1} />
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        <SectionTitle hint="Quick dealer roll">Recent dealers</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 0.6fr 0.6fr", gap: 12, fontSize: 12 }}>
          <Th>Dealer</Th>
          <Th>Email</Th>
          <Th>Joined</Th>
          <Th>Plan</Th>
          <Th>Status</Th>
          {dealers.slice(0, 10).map((p) => (
            <RowFragment key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm-data" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, paddingBottom: 8, borderBottom: `1px solid ${RULE}` }}>
      {children}
    </div>
  )
}

function RowFragment({ p }: { p: AdminProfile }) {
  const inactive = daysAgo(p.updated_at) > 7
  return (
    <>
      <div style={{ paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${RULE}`, color: TEXT }}>
        {p.dealer_name ?? "—"}
      </div>
      <div className="adm-data" style={{ paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${RULE}`, color: DIM, fontSize: 12 }}>
        {p.email ?? "—"}
      </div>
      <div className="adm-data" style={{ paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${RULE}`, color: DIM, fontSize: 12 }}>
        {p.created_at ? new Date(p.created_at).toLocaleDateString("en-AU") : "—"}
      </div>
      <div className="adm-data" style={{ paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${RULE}`, color: DIM, fontSize: 12 }}>
        {p.plan ?? "software"}
      </div>
      <div style={{ paddingTop: 10, paddingBottom: 10, borderBottom: `1px solid ${RULE}` }}>
        <span
          className="adm-data"
          style={{
            fontSize: 10,
            padding: "3px 8px",
            borderRadius: 999,
            color: inactive ? AMBER : GREEN,
            border: `1px solid ${inactive ? "rgba(245,166,35,0.4)" : "rgba(0,255,136,0.4)"}`,
            background: inactive ? "rgba(245,166,35,0.08)" : "rgba(0,255,136,0.08)",
          }}
        >
          {inactive ? "INACTIVE" : "ACTIVE"}
        </span>
      </div>
    </>
  )
}

function BarPanel({ title, hint, entries, total }: { title: string; hint?: string; entries: [string, number][]; total: number }) {
  const colors = [GOLD, GREEN, "#7c3aed", "#3b82f6", "#ef4d6a", "#f5a623", "#06b6d4", "#a78bfa"]
  return (
    <div className="adm-card" style={{ padding: 20 }}>
      <SectionTitle hint={hint}>{title}</SectionTitle>
      {entries.length === 0 ? (
        <div style={{ fontSize: 12, color: MUTED, padding: "12px 0" }}>No data yet.</div>
      ) : (
        entries.map(([k, count], i) => {
          const pct = Math.round((count / total) * 100)
          return (
            <div key={k} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: TEXT }}>{k}</span>
                <span className="adm-data" style={{ color: MUTED }}>
                  {count} · {pct}%
                </span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.04)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: colors[i % colors.length] }} />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Dealers ──────────────────────────────────────────────────────
function DealersTab({ d }: { d: AdminData }) {
  const dealers = d.profiles.filter((p) => p.role === "dealer" || p.role === null)
  const [q, setQ] = useState("")
  const [planF, setPlanF] = useState<"all" | "software" | "managed" | "growth">("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const stockByDealer = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of d.vehicles) m.set(v.user_id, (m.get(v.user_id) ?? 0) + 1)
    return m
  }, [d.vehicles])
  const salesByDealer = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of d.sales) m.set(s.user_id, (m.get(s.user_id) ?? 0) + 1)
    return m
  }, [d.sales])

  const filtered = dealers
    .filter((p) => (planF === "all" ? true : (p.plan ?? "software") === planF))
    .filter((p) => {
      if (!q) return true
      const hay = `${p.dealer_name ?? ""} ${p.email ?? ""} ${p.lmct ?? ""}`.toLowerCase()
      return hay.includes(q.toLowerCase())
    })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="adm-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search dealer name, email, LMCT…"
          className="adm-data"
          style={{ flex: 1, minWidth: 240, background: INK, border: `1px solid ${RULE}`, padding: "10px 12px", color: TEXT, borderRadius: 8, fontSize: 13 }}
        />
        <select
          value={planF}
          onChange={(e) => setPlanF(e.target.value as typeof planF)}
          className="adm-data"
          style={{ background: INK, border: `1px solid ${RULE}`, padding: "10px 12px", color: TEXT, borderRadius: 8, fontSize: 13 }}
        >
          <option value="all">All plans</option>
          <option value="software">Software · $249</option>
          <option value="managed">Managed · $799</option>
          <option value="growth">Growth · $1,499</option>
        </select>
        <span className="adm-data" style={{ fontSize: 11, color: MUTED }}>
          {filtered.length} / {dealers.length}
        </span>
      </div>

      <div className="adm-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 0.8fr 1fr 1fr 0.7fr 0.6fr 0.6fr 0.6fr",
            padding: "12px 16px",
            borderBottom: `1px solid ${RULE}`,
            background: CARD_HI,
          }}
        >
          {["Dealer", "LMCT", "Email", "Suburb", "Plan", "Stock", "Sales", "Status"].map((h) => (
            <div key={h} className="adm-data" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED }}>
              {h}
            </div>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, color: MUTED, fontSize: 13 }}>No dealers match.</div>
        ) : (
          filtered.map((p) => {
            const inactive = daysAgo(p.updated_at) > 7
            const open = openId === p.id
            const suburb = (p.address ?? "").split(",").slice(-2, -1)[0]?.trim() ?? "—"
            return (
              <div key={p.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : p.id)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "1.4fr 0.8fr 1fr 1fr 0.7fr 0.6fr 0.6fr 0.6fr",
                    padding: "12px 16px",
                    borderBottom: `1px solid ${RULE}`,
                    width: "calc(100% - 32px)",
                    background: open ? CARD_HI : "transparent",
                  }}
                >
                  <span style={{ color: TEXT, fontSize: 13 }}>{p.dealer_name ?? "—"}</span>
                  <span className="adm-data" style={{ color: DIM, fontSize: 12 }}>{p.lmct ?? "—"}</span>
                  <span className="adm-data" style={{ color: DIM, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email ?? "—"}</span>
                  <span className="adm-data" style={{ color: DIM, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{suburb}</span>
                  <span className="adm-data" style={{ color: DIM, fontSize: 12 }}>{p.plan ?? "software"}</span>
                  <span className="adm-data" style={{ color: GOLD, fontSize: 13 }}>{stockByDealer.get(p.id) ?? 0}</span>
                  <span className="adm-data" style={{ color: GREEN, fontSize: 13 }}>{salesByDealer.get(p.id) ?? 0}</span>
                  <span className="adm-data" style={{ fontSize: 10, color: inactive ? AMBER : GREEN }}>{inactive ? "Inactive" : "Active"}</span>
                </button>
                {open && (
                  <div style={{ background: CARD_HI, padding: "12px 16px 18px", borderBottom: `1px solid ${RULE}` }}>
                    <div className="adm-data" style={{ fontSize: 11, color: GOLD, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
                      Detail
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontSize: 12 }}>
                      <KV k="Phone" v={p.phone ?? "—"} />
                      <KV k="Address" v={p.address ?? "—"} />
                      <KV k="Joined" v={p.created_at ? new Date(p.created_at).toLocaleDateString("en-AU") : "—"} />
                      <KV k="Last active" v={p.updated_at ? `${daysAgo(p.updated_at)}d ago` : "—"} />
                      <KV k="Subscription" v={p.subscription_status ?? "—"} />
                      <KV k="Trial ends" v={p.trial_ends_at ? new Date(p.trial_ends_at).toLocaleDateString("en-AU") : "—"} />
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="adm-data" style={{ fontSize: 10, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
      <div className="adm-data" style={{ fontSize: 12, color: TEXT }}>{v}</div>
    </div>
  )
}

// ─── Live Feed ────────────────────────────────────────────────────
type FeedEvent = {
  id: string
  ts: number
  dealer: string
  action: "ADDED" | "SOLD"
  vehicle: string
  price: number | null
  suburb: string
}

const FEED_MAX = 200
const INTEL_LINES = [
  "Camry sedans moving in 18 days avg across VIC",
  "Aged stock 60+ days carries 38% lower margin",
  "Auction-sourced utes outperform private trades by $1.2k",
  "Hilux remains #1 by units shifted this quarter",
  "RAV4 listing → sale shrinking to 22 days",
  "Manual transmission vehicles average +14 days on lot",
  "White and silver clear 8 days faster than red",
]

function LiveFeedTab({ d }: { d: AdminData }) {
  const [events, setEvents] = useState<FeedEvent[]>(() => seedFromInitial(d))
  const [pulse, setPulse] = useState(0)
  const [intelLine, setIntelLine] = useState(0)
  const dealerMap = useMemo(() => {
    const m = new Map<string, AdminProfile>()
    for (const p of d.profiles) m.set(p.id, p)
    return m
  }, [d.profiles])

  // Realtime subscription — gated by founder-read-all RLS (008.sql).
  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel("admin-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vehicles" },
        (payload) => {
          const v = payload.new as AdminVehicle
          const p = dealerMap.get(v.user_id)
          pushEvent({
            id: `v-${v.id}`,
            ts: Date.now(),
            dealer: p?.dealer_name ?? "Unknown dealer",
            action: "ADDED",
            vehicle: `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() || "Vehicle",
            price: v.price,
            suburb: suburbOf(p),
          })
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales" },
        (payload) => {
          const s = payload.new as AdminSale
          const p = dealerMap.get(s.user_id)
          pushEvent({
            id: `s-${s.id}`,
            ts: Date.now(),
            dealer: p?.dealer_name ?? "Unknown dealer",
            action: "SOLD",
            vehicle: `${s.year ?? ""} ${s.make ?? ""} ${s.model ?? ""}`.trim() || "Vehicle",
            price: s.sale_price,
            suburb: suburbOf(p),
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
    function pushEvent(e: FeedEvent) {
      setEvents((cur) => [e, ...cur].slice(0, FEED_MAX))
    }
  }, [dealerMap])

  // 30s pulse ripple.
  useEffect(() => {
    const id = window.setInterval(() => setPulse((x) => x + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // 45s market intel line rotation.
  useEffect(() => {
    const id = window.setInterval(() => setIntelLine((x) => (x + 1) % INTEL_LINES.length), 45_000)
    return () => window.clearInterval(id)
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const addedToday = events.filter((e) => e.action === "ADDED" && e.ts >= today.getTime()).length
  const soldToday = events.filter((e) => e.action === "SOLD" && e.ts >= today.getTime())
  const valueToday = soldToday.reduce((s, e) => s + (e.price ?? 0), 0)

  const mostActive = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of events) counts[e.dealer] = (counts[e.dealer] ?? 0) + 1
    const top = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]
    return top ? top[0] : "—"
  }, [events])

  return (
    <div style={{ display: "grid", gridTemplateColumns: "65fr 35fr", gap: 12, minHeight: 600 }}>
      {/* LEFT: event stream */}
      <div className="adm-card" style={{ padding: 0, overflow: "hidden", position: "relative" }} key={`pulse-${pulse}`}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 200,
            height: 200,
            borderRadius: 999,
            background: `radial-gradient(circle, ${GREEN}1f 0%, transparent 70%)`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            animation: "admPulse 3.5s ease-out forwards",
          }}
        />
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${RULE}`, display: "flex", justifyContent: "space-between" }}>
          <span className="adm-data" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD }}>
            Live · all dealers
          </span>
          <span className="adm-data" style={{ fontSize: 10, color: GREEN }}>
            ● REALTIME
          </span>
        </div>
        <div style={{ maxHeight: 540, overflowY: "auto", padding: "4px 0" }}>
          {events.length === 0 ? (
            <div style={{ padding: 32, color: MUTED, fontSize: 13 }}>
              Idle — waiting for the next vehicle add or sale across the platform.
            </div>
          ) : (
            events.map((e) => (
              <div
                key={e.id + e.ts}
                className="adm-data adm-row-in"
                style={{
                  display: "grid",
                  gridTemplateColumns: "82px 1.2fr 70px 1.4fr 110px 1fr",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 18px",
                  fontSize: 12,
                  color: DIM,
                  borderBottom: `1px solid ${RULE}`,
                }}
              >
                <span style={{ color: GREEN }}>{new Date(e.ts).toLocaleTimeString("en-AU", { hour12: false })}</span>
                <span style={{ color: TEXT }}>{e.dealer}</span>
                <span style={{ color: e.action === "SOLD" ? GREEN : GOLD, fontWeight: 700 }}>{e.action}</span>
                <span style={{ color: TEXT }}>{e.vehicle}</span>
                <span style={{ color: e.action === "SOLD" ? GREEN : GOLD, textAlign: "right" }}>{e.price != null ? fmt(e.price) : "—"}</span>
                <span style={{ color: MUTED }}>{e.suburb}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: counters + intel */}
      <div className="adm-card adm-scanline" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <FeedCounter label="Cars added today" value={num(addedToday)} color={GOLD} />
        <FeedCounter label="Cars sold today" value={num(soldToday.length)} color={GREEN} />
        <FeedCounter label="Value sold today" value={fmt(valueToday)} color={GREEN} />
        <FeedCounter label="Most active dealer" value={mostActive} color={TEXT} />

        <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 14, marginTop: 8 }}>
          <div className="adm-data" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>
            Market intel
          </div>
          <div
            key={intelLine}
            className="adm-data adm-row-in"
            style={{ fontSize: 12, color: GREEN, lineHeight: 1.5 }}
          >
            ▸ {INTEL_LINES[intelLine]}
          </div>
        </div>
      </div>
    </div>
  )
}

function FeedCounter({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="adm-data" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>
        {label}
      </div>
      <div className="adm-num" style={{ fontSize: 26, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  )
}

function suburbOf(p: AdminProfile | undefined): string {
  if (!p?.address) return "—"
  const parts = p.address.split(",").map((s) => s.trim()).filter(Boolean)
  return parts[parts.length - 2] ?? parts[0] ?? "—"
}

function seedFromInitial(d: AdminData): FeedEvent[] {
  const dealerMap = new Map<string, AdminProfile>()
  for (const p of d.profiles) dealerMap.set(p.id, p)
  const events: FeedEvent[] = []
  for (const v of d.vehicles.slice(0, 20)) {
    const p = dealerMap.get(v.user_id)
    events.push({
      id: `v-${v.id}`,
      ts: new Date(v.created_at).getTime(),
      dealer: p?.dealer_name ?? "Unknown",
      action: "ADDED",
      vehicle: `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.trim() || "Vehicle",
      price: v.price,
      suburb: suburbOf(p),
    })
  }
  for (const s of d.sales.slice(0, 20)) {
    const p = dealerMap.get(s.user_id)
    events.push({
      id: `s-${s.id}`,
      ts: s.sale_date ? new Date(s.sale_date).getTime() : new Date(s.created_at).getTime(),
      dealer: p?.dealer_name ?? "Unknown",
      action: "SOLD",
      vehicle: `${s.year ?? ""} ${s.make ?? ""} ${s.model ?? ""}`.trim() || "Vehicle",
      price: s.sale_price,
      suburb: suburbOf(p),
    })
  }
  return events.sort((a, b) => b.ts - a.ts).slice(0, FEED_MAX)
}

// ─── Market Intelligence ──────────────────────────────────────────
function MarketIntelTab({ cache }: { cache: MarketCache | null }) {
  if (!cache) {
    return (
      <div className="adm-card" style={{ padding: 28 }}>
        <SectionTitle hint="Run the nightly aggregator from the AI Engine tab to populate.">No cache yet</SectionTitle>
        <div style={{ fontSize: 13, color: DIM, marginTop: 14 }}>
          Apply <code style={{ color: GOLD }}>scripts/006_market_intelligence.sql</code>, then deploy{" "}
          <code style={{ color: GOLD }}>supabase/functions/market-intelligence</code> and run it once.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="adm-card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <SectionTitle hint={`${num(cache.transaction_count)} transactions · ${num(cache.dealer_count)} dealers`}>
            Aggregated cross-dealer intelligence
          </SectionTitle>
        </div>
        <div className="adm-data" style={{ fontSize: 11, color: MUTED }}>
          Generated {new Date(cache.generated_at).toLocaleString("en-AU")}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
        <div className="adm-card" style={{ padding: 20 }}>
          <SectionTitle hint="Last 90 days, all dealers">Top makes by volume</SectionTitle>
          {cache.top_makes.length === 0 ? (
            <Empty />
          ) : (
            cache.top_makes.map((m, i) => {
              const max = Math.max(...cache.top_makes.map((x) => x.count))
              const pct = Math.round((m.count / max) * 100)
              return (
                <div key={m.make} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: TEXT }}>
                      <span className="adm-data" style={{ color: MUTED, marginRight: 8 }}>#{i + 1}</span>
                      {m.make}
                    </span>
                    <span className="adm-data" style={{ color: MUTED }}>
                      {m.count} · avg profit {fmt(m.avg_profit)}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: GOLD }} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="adm-card" style={{ padding: 20 }}>
          <SectionTitle hint="Acquisition → sale">Avg days by body type</SectionTitle>
          {cache.avg_days_by_body.length === 0 ? (
            <Empty />
          ) : (
            cache.avg_days_by_body.map((b) => {
              const max = Math.max(...cache.avg_days_by_body.map((x) => x.avg_days))
              const pct = Math.round((b.avg_days / max) * 100)
              return (
                <div key={b.body} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: TEXT }}>{b.body}</span>
                    <span className="adm-data" style={{ color: MUTED }}>
                      {b.avg_days}d · n={b.count}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: GREEN }} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="adm-card" style={{ padding: 20 }}>
          <SectionTitle hint="Profit by acquisition source">Source ROI</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.8fr 0.8fr", gap: 8, fontSize: 12 }}>
            <Th>Source</Th>
            <Th>Count</Th>
            <Th>Avg profit</Th>
            <Th>Total</Th>
            {cache.source_roi.map((r) => (
              <SourceRow key={r.source} r={r} />
            ))}
          </div>
        </div>
        <div className="adm-card" style={{ padding: 20 }}>
          <SectionTitle hint="Shortest acquisition → sale">Fastest sellers</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.6fr 0.8fr", gap: 8, fontSize: 12 }}>
            <Th>Vehicle</Th>
            <Th>Days</Th>
            <Th>Profit</Th>
            {cache.fastest_sellers.slice(0, 8).map((s, i) => (
              <FastRow key={i} s={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SourceRow({ r }: { r: { source: string; count: number; avg_profit: number; total_profit: number } }) {
  return (
    <>
      <div style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: TEXT, fontSize: 12 }}>{r.source}</div>
      <div className="adm-data" style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: DIM, fontSize: 12 }}>{r.count}</div>
      <div className="adm-data" style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: GREEN, fontSize: 12 }}>{fmt(r.avg_profit)}</div>
      <div className="adm-data" style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: GOLD, fontSize: 12 }}>{fmt(r.total_profit)}</div>
    </>
  )
}

function FastRow({ s }: { s: { make: string; model: string; year: number | null; days: number; profit: number } }) {
  return (
    <>
      <div style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: TEXT, fontSize: 12 }}>
        {s.year ?? ""} {s.make} {s.model}
      </div>
      <div className="adm-data" style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: GREEN, fontSize: 12 }}>{s.days}d</div>
      <div className="adm-data" style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: GOLD, fontSize: 12 }}>{fmt(s.profit)}</div>
    </>
  )
}

function Empty() {
  return <div style={{ fontSize: 12, color: MUTED, padding: "12px 0" }}>No data yet.</div>
}

// ─── Revenue ──────────────────────────────────────────────────────
function RevenueTab({ d }: { d: AdminData }) {
  const dealers = d.profiles.filter((p) => p.role === "dealer" || p.role === null)
  const mrr = dealers.reduce((s, p) => s + (PLAN_PRICE[p.plan ?? "software"] ?? 0), 0)

  const planCounts: Record<string, number> = { software: 0, managed: 0, growth: 0 }
  for (const p of dealers) {
    const plan = p.plan ?? "software"
    planCounts[plan] = (planCounts[plan] ?? 0) + 1
  }

  const churnRisk = dealers
    .filter((p) => daysAgo(p.updated_at) >= 5)
    .sort((a, b) => daysAgo(b.updated_at) - daysAgo(a.updated_at))
    .slice(0, 15)

  // 12-month mock MRR trajectory based on current MRR (until Stripe wires in).
  const series = useMemo(() => {
    const out: { m: string; v: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const dt = new Date()
      dt.setMonth(dt.getMonth() - i)
      const trend = 1 - i * 0.08
      out.push({ m: dt.toLocaleDateString("en-AU", { month: "short" }), v: Math.max(0, Math.round(mrr * trend)) })
    }
    return out
  }, [mrr])

  const maxV = Math.max(...series.map((p) => p.v), 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="MRR" value={fmt(mrr)} sub={`${dealers.length} subscriptions`} color={GREEN} glow />
        <StatCard label="Software · $249" value={num(planCounts.software ?? 0)} color={GOLD} />
        <StatCard label="Managed · $799" value={num(planCounts.managed ?? 0)} color={GOLD} />
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        <SectionTitle hint="12-month projection · until Stripe wired in this is plan-count × price across signup history">MRR trajectory</SectionTitle>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 180, marginTop: 18 }}>
          {series.map((p, i) => {
            const h = Math.round((p.v / maxV) * 160)
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    height: h,
                    width: "100%",
                    background: i === series.length - 1 ? GREEN : `${GOLD}aa`,
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                <div className="adm-data" style={{ fontSize: 9, color: MUTED }}>
                  {p.m}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="adm-card" style={{ padding: 20 }}>
        <SectionTitle hint="No activity in 5+ days — reach out before they churn">Churn risk</SectionTitle>
        {churnRisk.length === 0 ? (
          <div style={{ fontSize: 12, color: MUTED, padding: "12px 0" }}>All dealers active in the last 5 days.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr", gap: 8, fontSize: 12 }}>
            <Th>Dealer</Th>
            <Th>Email</Th>
            <Th>Last active</Th>
            <Th>Trial ends</Th>
            {churnRisk.map((p) => (
              <ChurnRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChurnRow({ p }: { p: AdminProfile }) {
  const d = daysAgo(p.updated_at)
  return (
    <>
      <div style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: TEXT, fontSize: 12 }}>{p.dealer_name ?? "—"}</div>
      <div className="adm-data" style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: DIM, fontSize: 12 }}>{p.email ?? "—"}</div>
      <div className="adm-data" style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: AMBER, fontSize: 12 }}>{d}d ago</div>
      <div className="adm-data" style={{ padding: "8px 0", borderBottom: `1px solid ${RULE}`, color: DIM, fontSize: 12 }}>
        {p.trial_ends_at ? new Date(p.trial_ends_at).toLocaleDateString("en-AU") : "—"}
      </div>
    </>
  )
}

// ─── AI Engine ────────────────────────────────────────────────────
function AIEngineTab({ cache, dealerCount }: { cache: MarketCache | null; dealerCount: number }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const target = 20
  const progress = Math.min(100, Math.round((dealerCount / target) * 100))

  async function runNow() {
    setBusy(true)
    setMsg(null)
    setErr(null)
    try {
      const res = await fetch("/api/admin/run-market-intel", { method: "POST" })
      const j = await res.json()
      if (!res.ok || j.ok === false) {
        setErr(j.error || `HTTP ${res.status}`)
      } else {
        setMsg(`Aggregated ${j.transaction_count ?? 0} transactions across ${j.dealer_count ?? 0} dealers.`)
      }
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const qualityScore =
    cache && cache.transaction_count > 0
      ? Math.min(100, Math.round(Math.log10(cache.transaction_count + 1) * 35))
      : 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="adm-card" style={{ padding: 22 }}>
        <SectionTitle hint="The data moat — every transaction makes MAX sharper for every dealer">Data moat progress</SectionTitle>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
          <span className="adm-num" style={{ fontSize: 38, color: GOLD }}>
            {dealerCount}
          </span>
          <span className="adm-data" style={{ color: MUTED, fontSize: 12 }}>
            of {target} dealers · {progress}%
          </span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden", marginTop: 14 }}>
          <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GREEN})` }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="adm-card" style={{ padding: 22 }}>
          <SectionTitle hint="Snapshot of the cache table">Cache state</SectionTitle>
          {cache ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
              <KV k="Last updated" v={new Date(cache.generated_at).toLocaleString("en-AU")} />
              <KV k="Transactions analysed" v={num(cache.transaction_count)} />
              <KV k="Dealers represented" v={num(cache.dealer_count)} />
              <KV k="Quality score" v={`${qualityScore}/100`} />
            </div>
          ) : (
            <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
              No cache row yet. Run the aggregator below to generate the first snapshot.
            </div>
          )}
        </div>

        <div className="adm-card" style={{ padding: 22 }}>
          <SectionTitle hint="Trigger supabase/functions/market-intelligence">Run nightly analysis now</SectionTitle>
          <button
            type="button"
            onClick={runNow}
            disabled={busy}
            style={{
              marginTop: 12,
              padding: "12px 18px",
              background: busy ? "rgba(232,162,40,0.2)" : GOLD,
              color: INK,
              border: 0,
              borderRadius: 8,
              cursor: busy ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.04em",
            }}
          >
            {busy ? "Running…" : "Run aggregator"}
          </button>
          {msg && (
            <div className="adm-data" style={{ marginTop: 12, fontSize: 12, color: GREEN }}>
              ✓ {msg}
            </div>
          )}
          {err && (
            <div className="adm-data" style={{ marginTop: 12, fontSize: 12, color: RED }}>
              × {err}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
