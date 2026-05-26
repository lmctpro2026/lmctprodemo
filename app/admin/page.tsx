// /admin — Phase 1 of the data engine.
//
// Read-only platform-wide stats. Hits the four core tables directly via
// the founder's server-side client; the layout has already verified role.
// All numbers are AGGREGATES — no individual dealer rows surfaced here.
//
// Phase 2 will add materialized views. Phase 3 adds Supabase Realtime
// streaming so this page becomes the "movie-style" live ops dashboard.

import { createClient } from "@/lib/supabase/server"

function fmt(n: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency", currency: "AUD", maximumFractionDigits: 0,
  }).format(n)
}

async function getStats() {
  const supabase = await createClient()

  // Note: these queries bypass dealer RLS because the layout already
  // verified the caller is a founder. We're reading aggregates only.
  // When data volume grows, replace with materialized views (Phase 2).
  const [profilesRes, vehiclesRes, salesRes] = await Promise.all([
    supabase.from("profiles").select("id, created_at, role"),
    supabase.from("vehicles").select("status, body, make, price, purchase_price"),
    supabase.from("sales").select("sale_price, profit, margin, make, sale_date"),
  ])

  const dealers  = (profilesRes.data || []).filter(p => (p as { role: string }).role === "dealer")
  const vehicles = vehiclesRes.data || []
  const sales    = salesRes.data    || []

  const totalRevenue = sales.reduce((s: number, x: { sale_price?: number }) => s + (x.sale_price || 0), 0)
  const totalProfit  = sales.reduce((s: number, x: { profit?: number     }) => s + (x.profit     || 0), 0)
  const stockValue   = vehicles
    .filter((v: { status?: string }) => v.status === "Available")
    .reduce((s: number, v: { price?: number }) => s + (v.price || 0), 0)

  const makeCounts: Record<string, number> = {}
  for (const s of sales as { make?: string }[]) {
    const m = s.make || "Unknown"
    makeCounts[m] = (makeCounts[m] || 0) + 1
  }
  const topMakes = Object.entries(makeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const bodyCounts: Record<string, number> = {}
  for (const v of vehicles as { body?: string }[]) {
    const b = v.body || "Unknown"
    bodyCounts[b] = (bodyCounts[b] || 0) + 1
  }
  const bodyMix = Object.entries(bodyCounts).sort((a, b) => b[1] - a[1])

  return {
    dealerCount:  dealers.length,
    vehicleCount: vehicles.length,
    saleCount:    sales.length,
    totalRevenue,
    totalProfit,
    stockValue,
    topMakes,
    bodyMix,
  }
}

export default async function AdminPage() {
  const s = await getStats()

  const STAGE_BANNER = s.dealerCount < 50

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: 22 }}>

      {STAGE_BANNER && (
        <div style={{
          background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: 14, padding: "16px 22px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.2px",
            textTransform: "uppercase", color: "#A78BFA", marginBottom: 6 }}>
            Phase 1 — Foundation
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.9)" }}>
            {s.dealerCount} of 50 dealers onboarded — the real data engine unlocks at 50.
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
            v2 (10+ dealers): materialized views, nightly refresh. v3 (50+): real-time activity feed, anonymized cross-dealer benchmarks surfaced into the dealer UI, "movie-style" live ops dashboard.
          </div>
        </div>
      )}

      {/* ── Headline numbers ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "Active Dealers",   value: String(s.dealerCount),  sub: "platform-wide",        color: "#F1F0FF" },
          { label: "Vehicles Tracked", value: String(s.vehicleCount), sub: "across all dealers",   color: "#F1F0FF" },
          { label: "Sales Recorded",   value: String(s.saleCount),    sub: "all-time",             color: "#10B981" },
          { label: "Total Revenue",    value: fmt(s.totalRevenue),    sub: "platform GMV proxy",   color: "#E8A020" },
        ].map(card => (
          <div key={card.label} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14, padding: "20px 24px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px",
              textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: card.color, lineHeight: 1, marginBottom: 6 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* ── Top selling makes ───────────────────────────────── */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Top selling makes</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18 }}>
            All-time, platform-wide
          </div>
          {s.topMakes.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "20px 0" }}>
              No sales yet — first sale recorded will populate this.
            </div>
          ) : s.topMakes.map(([make, count], i) => {
            const total = s.saleCount || 1
            const pct = Math.round((count / total) * 100)
            const colors = ["#7C3AED","#E8A020","#10B981","#3B82F6","#EF4444","#F59E0B","#A78BFA","#06B6D4"]
            return (
              <div key={make} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{make}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{count} · {pct}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: colors[i % colors.length], borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Body mix ───────────────────────────────────────── */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, padding: "20px 24px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Stock body-type mix</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18 }}>
            What dealers are buying
          </div>
          {s.bodyMix.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "20px 0" }}>
              No stock yet — first vehicle added will populate this.
            </div>
          ) : s.bodyMix.map(([body, count], i) => {
            const total = s.vehicleCount || 1
            const pct = Math.round((count / total) * 100)
            const colors = ["#7C3AED","#10B981","#E8A020","#3B82F6","#EF4444","#F59E0B"]
            return (
              <div key={body} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{body}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{count} · {pct}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: colors[i % colors.length], borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: "20px 24px",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Other metrics</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 18 }}>
          Quick platform pulse
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total profit
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#10B981", marginTop: 4 }}>
              {fmt(s.totalProfit)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Stock value (Available)
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#F1F0FF", marginTop: 4 }}>
              {fmt(s.stockValue)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Avg sale price
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#F1F0FF", marginTop: 4 }}>
              {s.saleCount > 0 ? fmt(s.totalRevenue / s.saleCount) : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
