// Edge Function — market intelligence aggregator.
// Pulls 90 days of completed sales (joined to vehicles for body + source +
// acquisition_date), computes cross-dealer aggregates, writes one row to
// market_intelligence_cache.
//
// Trigger: nightly cron (via Supabase Scheduled Triggers) and manual from
// /admin → AI Engine tab via service-role POST.
//
// Auth: service role only. RLS on market_intelligence_cache forbids dealer
// writes; service role bypasses RLS. Dealers must never see this output.
//
// Deploy: supabase functions deploy market-intelligence
//   Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// @ts-nocheck — Deno runtime, lints differ from Node tsconfig.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const WINDOW_DAYS = 90

type Sale = {
  user_id: string
  make: string | null
  model: string | null
  year: number | null
  sale_price: number | null
  profit: number | null
  sale_date: string | null
  status: string | null
  vehicle: { body: string | null; source: string | null; acquisition_date: string | null } | null
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

function daysBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "content-type": "application/json" } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString()

  const { data: sales, error: salesErr } = await supabase
    .from("sales")
    .select("user_id, make, model, year, sale_price, profit, sale_date, status, vehicle:vehicles ( body, source, acquisition_date )")
    .gte("sale_date", cutoff)
    .eq("status", "Completed")
    .returns<Sale[]>()

  if (salesErr) {
    return new Response(JSON.stringify({ ok: false, error: salesErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }

  const dealerCountQuery = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "dealer")

  const dealerCount = dealerCountQuery.count ?? 0

  if (!sales || sales.length === 0) {
    const { error: insertErr } = await supabase.from("market_intelligence_cache").insert({
      dealer_count: dealerCount,
      transaction_count: 0,
      notes: "no completed sales in window",
    })
    if (insertErr) {
      return new Response(JSON.stringify({ ok: false, error: insertErr.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      })
    }
    return new Response(
      JSON.stringify({ ok: true, transaction_count: 0, dealer_count: dealerCount }),
      { headers: { "content-type": "application/json" } },
    )
  }

  // ── Aggregations ─────────────────────────────────────────────────
  const makeCount: Record<string, number> = {}
  const makeProfit: Record<string, number[]> = {}
  const bodyDays: Record<string, number[]> = {}
  const sourceProfit: Record<string, { count: number; total: number }> = {}
  const allMargins: number[] = []
  type FastSeller = { make: string; model: string; year: number | null; days: number; profit: number }
  const fastestSellers: FastSeller[] = []

  for (const s of sales) {
    if (s.make) {
      makeCount[s.make] = (makeCount[s.make] ?? 0) + 1
      makeProfit[s.make] = makeProfit[s.make] ?? []
      if (typeof s.profit === "number") makeProfit[s.make].push(s.profit)
    }

    const body = s.vehicle?.body
    const acq = s.vehicle?.acquisition_date
    if (body && acq && s.sale_date) {
      const days = daysBetween(acq, s.sale_date)
      bodyDays[body] = bodyDays[body] ?? []
      bodyDays[body].push(days)
      if (s.make && s.model && typeof s.profit === "number") {
        fastestSellers.push({ make: s.make, model: s.model, year: s.year, days, profit: s.profit })
      }
    }

    const src = s.vehicle?.source
    if (src && typeof s.profit === "number") {
      sourceProfit[src] = sourceProfit[src] ?? { count: 0, total: 0 }
      sourceProfit[src].count += 1
      sourceProfit[src].total += s.profit
    }

    if (typeof s.profit === "number") allMargins.push(s.profit)
  }

  const top_makes = Object.entries(makeCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([make, count]) => ({
      make,
      count,
      avg_profit: Math.round(avg(makeProfit[make] ?? [0])),
    }))

  const avg_days_by_body = Object.entries(bodyDays)
    .map(([body, days]) => ({ body, avg_days: Math.round(avg(days)), count: days.length }))
    .sort((a, b) => a.avg_days - b.avg_days)

  const source_roi = Object.entries(sourceProfit)
    .map(([source, agg]) => ({
      source,
      count: agg.count,
      avg_profit: Math.round(agg.total / agg.count),
      total_profit: Math.round(agg.total),
    }))
    .sort((a, b) => b.avg_profit - a.avg_profit)

  const fastest_sellers = fastestSellers.sort((a, b) => a.days - b.days).slice(0, 10)

  // State aggregation is single-bucket until profiles.address is parsed for suburb/state.
  const avg_margin_by_state =
    allMargins.length > 0
      ? [{ state: "VIC", avg_margin: Math.round(avg(allMargins)), count: allMargins.length }]
      : []

  const { error: insertErr } = await supabase.from("market_intelligence_cache").insert({
    dealer_count: dealerCount,
    transaction_count: sales.length,
    top_makes,
    avg_days_by_body,
    avg_margin_by_state,
    source_roi,
    fastest_sellers,
    price_reduction_patterns: [],
    notes: null,
  })

  if (insertErr) {
    return new Response(JSON.stringify({ ok: false, error: insertErr.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }

  return new Response(
    JSON.stringify({
      ok: true,
      transaction_count: sales.length,
      dealer_count: dealerCount,
      top_makes_preview: top_makes.slice(0, 3),
    }),
    { headers: { "content-type": "application/json" } },
  )
})
