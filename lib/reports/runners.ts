// Server-side runners for live reports.
//
// Each runner queries Supabase under the dealer's authenticated server client
// (RLS isolates by user_id), then returns rows + computed summary stats. The
// runner is pure data — the rendering happens in components/reports/*.

import type { SupabaseClient } from "@supabase/supabase-js"

export interface DateRange {
  from: string
  to: string
}

export interface ReportResult {
  columns: { key: string; label: string; align?: "left" | "right"; format?: "money" | "number" | "days" | "date" | "text" }[]
  rows: Record<string, unknown>[]
  summary: { label: string; value: string }[]
  empty?: string
}

function fmtAUD(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)
}

function daysSince(date: string | null | undefined): number {
  if (!date) return 0
  const t = new Date(String(date)).getTime()
  if (Number.isNaN(t)) return 0
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24))
}

export function defaultDateRange(): DateRange {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    from: from.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
  }
}

// ─── stock-list ────────────────────────────────────────────────────────────
export async function runStockList(
  supabase: SupabaseClient,
  userId: string,
  opts: { status?: string }
): Promise<ReportResult> {
  let q = supabase
    .from("vehicles")
    .select("stock_number, year, make, model, variant, rego, body, odometer, status, price, acquisition_date")
    .eq("user_id", userId)
  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status)
  const { data } = await q.order("acquisition_date", { ascending: false })
  const rows = (data || []).map((v) => ({
    stock_number: v.stock_number || "—",
    vehicle: `${v.year} ${v.make} ${v.model}${v.variant ? " " + v.variant : ""}`,
    rego: v.rego || "—",
    body: v.body || "—",
    odometer: v.odometer || 0,
    days: daysSince(v.acquisition_date),
    status: v.status,
    price: Number(v.price) || 0,
  }))
  const totalAsk = rows.reduce((s, r) => s + Number(r.price), 0)
  return {
    columns: [
      { key: "stock_number", label: "Stock #" },
      { key: "vehicle", label: "Vehicle" },
      { key: "rego", label: "Rego" },
      { key: "body", label: "Body" },
      { key: "odometer", label: "Odometer", align: "right", format: "number" },
      { key: "days", label: "Days", align: "right", format: "days" },
      { key: "status", label: "Status" },
      { key: "price", label: "Price", align: "right", format: "money" },
    ],
    rows,
    summary: [
      { label: "Vehicles", value: String(rows.length) },
      { label: "Total at ask", value: fmtAUD(totalAsk) },
    ],
    empty: "No vehicles match.",
  }
}

// ─── aged-stock ────────────────────────────────────────────────────────────
export async function runAgedStock(
  supabase: SupabaseClient,
  userId: string
): Promise<ReportResult> {
  const { data } = await supabase
    .from("vehicles")
    .select("stock_number, year, make, model, rego, price, purchase_price, acquisition_date, status")
    .eq("user_id", userId)
    .eq("status", "Available")
  const rows = (data || [])
    .map((v) => {
      const days = daysSince(v.acquisition_date)
      let action = "monitor"
      if (days > 120) action = "wholesale or auction"
      else if (days > 90) action = "reduce price 8-12%"
      else if (days > 60) action = "reduce price 5-8%"
      return {
        stock_number: v.stock_number || "—",
        vehicle: `${v.year} ${v.make} ${v.model}`,
        rego: v.rego || "—",
        days,
        purchase_price: Number(v.purchase_price) || 0,
        price: Number(v.price) || 0,
        action,
      }
    })
    .filter((r) => r.days >= 60)
    .sort((a, b) => b.days - a.days)
  const totalTied = rows.reduce((s, r) => s + r.price, 0)
  return {
    columns: [
      { key: "stock_number", label: "Stock #" },
      { key: "vehicle", label: "Vehicle" },
      { key: "rego", label: "Rego" },
      { key: "days", label: "Days", align: "right", format: "days" },
      { key: "purchase_price", label: "Purchase", align: "right", format: "money" },
      { key: "price", label: "Ask", align: "right", format: "money" },
      { key: "action", label: "Suggested action" },
    ],
    rows,
    summary: [
      { label: "Aged vehicles (>60d)", value: String(rows.length) },
      { label: "Cash tied up at ask", value: fmtAUD(totalTied) },
    ],
    empty: "No aged stock. Nice work.",
  }
}

// ─── incomplete-stock ──────────────────────────────────────────────────────
export async function runIncompleteStock(
  supabase: SupabaseClient,
  userId: string
): Promise<ReportResult> {
  const { data } = await supabase
    .from("vehicles")
    .select("stock_number, year, make, model, rego, vin, notes, acquisition_date, images, status")
    .eq("user_id", userId)
  const rows = (data || [])
    .map((v) => {
      const missing: string[] = []
      if (!v.vin) missing.push("VIN")
      if (!v.rego) missing.push("Rego")
      if (!v.acquisition_date) missing.push("Acquired")
      if (!v.notes || String(v.notes).trim() === "") missing.push("Description")
      if (!v.images || (v.images as unknown[]).length === 0) missing.push("Photos")
      return {
        stock_number: v.stock_number || "—",
        vehicle: `${v.year} ${v.make} ${v.model}`,
        status: v.status,
        missing: missing.join(", "),
        missing_count: missing.length,
      }
    })
    .filter((r) => r.missing_count > 0)
    .sort((a, b) => b.missing_count - a.missing_count)
  return {
    columns: [
      { key: "stock_number", label: "Stock #" },
      { key: "vehicle", label: "Vehicle" },
      { key: "status", label: "Status" },
      { key: "missing", label: "Missing fields" },
    ],
    rows,
    summary: [{ label: "Vehicles needing data", value: String(rows.length) }],
    empty: "Every vehicle has complete data. Rare.",
  }
}

// ─── no-images ─────────────────────────────────────────────────────────────
export async function runNoImages(
  supabase: SupabaseClient,
  userId: string
): Promise<ReportResult> {
  const { data } = await supabase
    .from("vehicles")
    .select("stock_number, year, make, model, rego, price, acquisition_date, images, status")
    .eq("user_id", userId)
    .eq("status", "Available")
  const rows = (data || [])
    .filter((v) => !v.images || (v.images as unknown[]).length === 0)
    .map((v) => ({
      stock_number: v.stock_number || "—",
      vehicle: `${v.year} ${v.make} ${v.model}`,
      rego: v.rego || "—",
      days: daysSince(v.acquisition_date),
      price: Number(v.price) || 0,
    }))
    .sort((a, b) => b.days - a.days)
  const tied = rows.reduce((s, r) => s + r.price, 0)
  return {
    columns: [
      { key: "stock_number", label: "Stock #" },
      { key: "vehicle", label: "Vehicle" },
      { key: "rego", label: "Rego" },
      { key: "days", label: "Days", align: "right", format: "days" },
      { key: "price", label: "Ask", align: "right", format: "money" },
    ],
    rows,
    summary: [
      { label: "Vehicles without photos", value: String(rows.length) },
      { label: "Listed value affected", value: fmtAUD(tied) },
    ],
    empty: "All available stock has photos.",
  }
}

// ─── sold-stock ────────────────────────────────────────────────────────────
export async function runSoldStock(
  supabase: SupabaseClient,
  userId: string,
  range: DateRange
): Promise<ReportResult> {
  const { data } = await supabase
    .from("sales")
    .select("sale_date, year, make, model, rego, buyer_name, sale_price, total_cost, profit, margin, payment_method")
    .eq("user_id", userId)
    .eq("status", "Completed")
    .gte("sale_date", range.from)
    .lte("sale_date", range.to)
    .order("sale_date", { ascending: false })
  const rows = (data || []).map((s) => ({
    sale_date: s.sale_date,
    vehicle: `${s.year} ${s.make} ${s.model}`,
    rego: s.rego || "—",
    buyer_name: s.buyer_name,
    sale_price: Number(s.sale_price) || 0,
    total_cost: Number(s.total_cost) || 0,
    profit: Number(s.profit) || 0,
    margin: Number(s.margin) || 0,
  }))
  const units = rows.length
  const revenue = rows.reduce((s, r) => s + r.sale_price, 0)
  const profit = rows.reduce((s, r) => s + r.profit, 0)
  const avgMargin = units ? rows.reduce((s, r) => s + r.margin, 0) / units : 0
  return {
    columns: [
      { key: "sale_date", label: "Date", format: "date" },
      { key: "vehicle", label: "Vehicle" },
      { key: "rego", label: "Rego" },
      { key: "buyer_name", label: "Buyer" },
      { key: "sale_price", label: "Sale", align: "right", format: "money" },
      { key: "total_cost", label: "Cost", align: "right", format: "money" },
      { key: "profit", label: "Profit", align: "right", format: "money" },
      { key: "margin", label: "Margin %", align: "right", format: "number" },
    ],
    rows,
    summary: [
      { label: "Units sold", value: String(units) },
      { label: "Revenue", value: fmtAUD(revenue) },
      { label: "Gross profit", value: fmtAUD(profit) },
      { label: "Avg margin", value: `${avgMargin.toFixed(1)}%` },
    ],
    empty: "No sales in this period.",
  }
}

// ─── sales-by-model ────────────────────────────────────────────────────────
export async function runSalesByModel(
  supabase: SupabaseClient,
  userId: string,
  range: DateRange
): Promise<ReportResult> {
  const { data } = await supabase
    .from("sales")
    .select("make, model, sale_price, profit, margin, sale_date, vehicle_id")
    .eq("user_id", userId)
    .eq("status", "Completed")
    .gte("sale_date", range.from)
    .lte("sale_date", range.to)
  type Agg = { units: number; revenue: number; profit: number; marginSum: number }
  const agg = new Map<string, Agg>()
  for (const s of data || []) {
    const key = `${s.make} ${s.model}`
    const cur = agg.get(key) || { units: 0, revenue: 0, profit: 0, marginSum: 0 }
    cur.units += 1
    cur.revenue += Number(s.sale_price) || 0
    cur.profit += Number(s.profit) || 0
    cur.marginSum += Number(s.margin) || 0
    agg.set(key, cur)
  }
  const rows = Array.from(agg.entries())
    .map(([model, a]) => ({
      model,
      units: a.units,
      revenue: a.revenue,
      avg_profit: a.units ? Math.round(a.profit / a.units) : 0,
      avg_margin: a.units ? a.marginSum / a.units : 0,
    }))
    .sort((a, b) => b.units - a.units)
  return {
    columns: [
      { key: "model", label: "Make / Model" },
      { key: "units", label: "Units", align: "right", format: "number" },
      { key: "revenue", label: "Revenue", align: "right", format: "money" },
      { key: "avg_profit", label: "Avg profit", align: "right", format: "money" },
      { key: "avg_margin", label: "Avg margin %", align: "right", format: "number" },
    ],
    rows,
    summary: [
      { label: "Distinct models sold", value: String(rows.length) },
      { label: "Total units", value: String(rows.reduce((s, r) => s + r.units, 0)) },
    ],
    empty: "No sales in this period.",
  }
}

// ─── dealings-register ─────────────────────────────────────────────────────
export async function runDealingsRegister(
  supabase: SupabaseClient,
  userId: string,
  range: DateRange
): Promise<ReportResult> {
  const { data } = await supabase
    .from("sales")
    .select("sale_date, year, make, model, rego, buyer_name, buyer_address, buyer_license, sale_price")
    .eq("user_id", userId)
    .eq("status", "Completed")
    .gte("sale_date", range.from)
    .lte("sale_date", range.to)
    .order("sale_date", { ascending: true })
  const rows = (data || []).map((s) => ({
    sale_date: s.sale_date,
    vehicle: `${s.year} ${s.make} ${s.model}`,
    rego: s.rego || "—",
    buyer_name: s.buyer_name,
    buyer_license: s.buyer_license || "—",
    buyer_address: s.buyer_address || "—",
    sale_price: Number(s.sale_price) || 0,
  }))
  const revenue = rows.reduce((s, r) => s + r.sale_price, 0)
  return {
    columns: [
      { key: "sale_date", label: "Date", format: "date" },
      { key: "vehicle", label: "Vehicle" },
      { key: "rego", label: "Rego" },
      { key: "buyer_name", label: "Buyer" },
      { key: "buyer_license", label: "Licence" },
      { key: "buyer_address", label: "Address" },
      { key: "sale_price", label: "Sale price", align: "right", format: "money" },
    ],
    rows,
    summary: [
      { label: "Dealings", value: String(rows.length) },
      { label: "Total sale value", value: fmtAUD(revenue) },
    ],
    empty: "No dealings in this period.",
  }
}

// ─── gst-summary ───────────────────────────────────────────────────────────
export async function runGstSummary(
  supabase: SupabaseClient,
  userId: string,
  range: DateRange
): Promise<ReportResult> {
  const { data } = await supabase
    .from("sales")
    .select("sale_date, year, make, model, sale_price")
    .eq("user_id", userId)
    .eq("status", "Completed")
    .gte("sale_date", range.from)
    .lte("sale_date", range.to)
    .order("sale_date", { ascending: true })
  const rows = (data || []).map((s) => {
    const sale = Number(s.sale_price) || 0
    const gst = sale / 11 // GST-inclusive: GST = 1/11 of total
    const net = sale - gst
    return {
      sale_date: s.sale_date,
      vehicle: `${s.year} ${s.make} ${s.model}`,
      sale_price: sale,
      gst,
      net,
    }
  })
  const total = rows.reduce((s, r) => s + r.sale_price, 0)
  const gstTotal = rows.reduce((s, r) => s + r.gst, 0)
  const netTotal = total - gstTotal
  return {
    columns: [
      { key: "sale_date", label: "Date", format: "date" },
      { key: "vehicle", label: "Vehicle" },
      { key: "sale_price", label: "Sale (incl GST)", align: "right", format: "money" },
      { key: "gst", label: "GST (1/11)", align: "right", format: "money" },
      { key: "net", label: "Net of GST", align: "right", format: "money" },
    ],
    rows,
    summary: [
      { label: "Total sales (incl GST)", value: fmtAUD(total) },
      { label: "GST collected", value: fmtAUD(gstTotal) },
      { label: "Net of GST", value: fmtAUD(netTotal) },
    ],
    empty: "No taxable sales in this period.",
  }
}

// ─── Dispatch ──────────────────────────────────────────────────────────────
export async function runReport(
  slug: string,
  supabase: SupabaseClient,
  userId: string,
  filters: { from?: string; to?: string; status?: string }
): Promise<ReportResult | null> {
  const range: DateRange = {
    from: filters.from || defaultDateRange().from,
    to: filters.to || defaultDateRange().to,
  }
  switch (slug) {
    case "stock-list":         return runStockList(supabase, userId, { status: filters.status })
    case "aged-stock":         return runAgedStock(supabase, userId)
    case "incomplete-stock":   return runIncompleteStock(supabase, userId)
    case "no-images":          return runNoImages(supabase, userId)
    case "sold-stock":         return runSoldStock(supabase, userId, range)
    case "sales-by-model":     return runSalesByModel(supabase, userId, range)
    case "dealings-register":  return runDealingsRegister(supabase, userId, range)
    case "gst-summary":        return runGstSummary(supabase, userId, range)
    default:                   return null
  }
}
