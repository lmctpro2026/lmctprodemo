import type { Profile, Vehicle, Sale } from "@/lib/types"

export type MarketIntel = {
  generated_at: string
  dealer_count: number
  transaction_count: number
  top_makes?: { make: string; count: number; avg_profit: number }[] | null
  avg_days_by_body?: { body: string; avg_days: number; count: number }[] | null
  source_roi?: { source: string; count: number; avg_profit: number }[] | null
  fastest_sellers?: { make: string; model: string; year: number | null; days: number }[] | null
} | null

interface BuildPromptInput {
  profile: Profile | null
  stockSnapshot: Pick<Vehicle, "make" | "model" | "year" | "rego" | "price" | "status" | "acquisition_date">[]
  recentSales: Pick<Sale, "make" | "model" | "year" | "sale_price" | "profit" | "margin" | "sale_date">[]
  marketIntel?: MarketIntel
}

const personalityStyles: Record<string, string> = {
  direct:
    "Be blunt and to the point. No filler. Lead with the answer, then evidence. Use Australian English.",
  friendly:
    "Be warm and conversational, like a trusted offsider. Encouraging but never sycophantic. Use Australian English.",
  formal:
    "Be precise and professional. Full sentences, no contractions. Use Australian English.",
}

const AGED_THRESHOLD_DAYS = 45

/**
 * Build the system message blocks for the dealer assistant.
 *
 * Returned as a single string for now (the SDK supports text/array system
 * messages; we use a single text block and rely on prompt caching at the
 * messages.create level via cache_control on this block).
 */
export function buildSystemPrompt({
  profile,
  stockSnapshot,
  recentSales,
  marketIntel,
}: BuildPromptInput): string {
  const persona = profile?.ai_personality ?? "direct"
  const styleNote = personalityStyles[persona] ?? personalityStyles.direct
  const aiName = profile?.ai_name?.trim() || "MAX"
  const dealerName = profile?.dealer_name?.trim() || "the dealer"
  const customTraining = profile?.ai_training?.trim() || ""

  const stockSummary = summariseStock(stockSnapshot)
  const agedSummary = summariseAged(stockSnapshot)
  const salesSummary = summariseSales(recentSales)
  const intelSummary = summariseMarketIntel(marketIntel ?? null)

  return [
    `You are ${aiName}, the in-house AI assistant for ${dealerName}, an Australian Licensed Motor Car Trader (LMCT).`,
    "",
    "Your job is to help the dealer move stock, price cars, run their business and stay compliant with Australian Consumer Law and VIC dealer regulations. You have read-only access via tools to their live stock, sales history and customer database.",
    "",
    `Style: ${styleNote}`,
    "",
    "Operating rules:",
    "• When the dealer asks about a specific car, ALWAYS call lookup_vehicle_by_rego first — do not guess.",
    "• When asked about inventory or aged stock, call the relevant tool. Never fabricate numbers.",
    "• Quote dollar figures with $ and thousands separators (e.g., $24,500).",
    "• When making pricing or buying recommendations, be specific about magnitude and reasoning.",
    "• If a question is outside your scope (legal advice that needs a lawyer, mechanical diagnosis), say so plainly and recommend the right professional.",
    "• Australian English: 'kilometres', 'tyres', 'rego', 'roadworthy certificate (RWC)'.",
    "",
    "─── Dealer profile ───",
    `Dealer: ${dealerName}`,
    `LMCT: ${profile?.lmct || "(not set)"}`,
    `ABN: ${profile?.abn || "(not set)"}`,
    `Target margin: ${profile?.target_margin ?? 18}%  Min margin: ${profile?.min_margin ?? 10}%  Warn at: ${profile?.warn_margin ?? 5}%`,
    customTraining ? `Custom instructions from the dealer:\n${customTraining}` : "",
    "",
    "─── Current stock snapshot (live as of this conversation) ───",
    stockSummary,
    "",
    `─── Aged stock (Available, ${AGED_THRESHOLD_DAYS}+ days on lot) ───`,
    agedSummary,
    "",
    "─── Sales last 90 days ───",
    salesSummary,
    intelSummary ? "" : "",
    intelSummary,
  ]
    .filter(Boolean)
    .join("\n")
}

function summariseStock(stock: BuildPromptInput["stockSnapshot"]): string {
  if (!stock.length) return "(no vehicles in stock yet)"
  const byStatus: Record<string, number> = {}
  for (const v of stock) {
    const s = v.status || "Unknown"
    byStatus[s] = (byStatus[s] ?? 0) + 1
  }
  const breakdown = Object.entries(byStatus)
    .map(([s, n]) => `${s}: ${n}`)
    .join(", ")
  const available = stock.filter((v) => v.status === "Available")
  const totalAsk = available.reduce((sum, v) => sum + Number(v.price ?? 0), 0)
  const sample = available
    .slice(0, 10)
    .map(
      (v) =>
        `  - ${v.year} ${v.make} ${v.model} | ${v.rego || "(no rego)"} | $${Math.round(Number(v.price ?? 0)).toLocaleString()}`
    )
    .join("\n")
  return [
    `Total: ${stock.length} vehicles. ${breakdown}.`,
    `Available inventory value (ask): $${Math.round(totalAsk).toLocaleString()}.`,
    available.length > 0 ? `Sample of available stock (first 10):\n${sample}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

function summariseAged(stock: BuildPromptInput["stockSnapshot"]): string {
  const now = Date.now()
  const aged = stock
    .filter((v) => v.status === "Available")
    .map((v) => {
      const days = v.acquisition_date
        ? Math.floor((now - new Date(v.acquisition_date).getTime()) / 86_400_000)
        : 0
      return { v, days }
    })
    .filter(({ days }) => days >= AGED_THRESHOLD_DAYS)
    .sort((a, b) => b.days - a.days)

  if (aged.length === 0) return `(none — every Available vehicle is fresher than ${AGED_THRESHOLD_DAYS} days)`

  const value = aged.reduce((s, { v }) => s + Number(v.price ?? 0), 0)
  const list = aged
    .slice(0, 15)
    .map(({ v, days }) => `  - ${days}d | ${v.year} ${v.make} ${v.model} | ${v.rego || "(no rego)"} | $${Math.round(Number(v.price ?? 0)).toLocaleString()}`)
    .join("\n")
  return [
    `${aged.length} aged vehicle${aged.length === 1 ? "" : "s"} tying up $${Math.round(value).toLocaleString()}.`,
    list,
  ].join("\n")
}

function summariseSales(sales: BuildPromptInput["recentSales"]): string {
  if (!sales.length) return "(no sales in the last 90 days)"
  const total = sales.length
  const revenue = sales.reduce((s, x) => s + Number(x.sale_price ?? 0), 0)
  const profit = sales.reduce((s, x) => s + Number(x.profit ?? 0), 0)
  const avgMargin = sales.reduce((s, x) => s + Number(x.margin ?? 0), 0) / total
  const avgProfit = profit / total
  return [
    `Units sold: ${total}. Revenue: $${Math.round(revenue).toLocaleString()}. Gross profit: $${Math.round(profit).toLocaleString()}. Avg margin: ${avgMargin.toFixed(1)}%. Avg profit/sale: $${Math.round(avgProfit).toLocaleString()}.`,
  ].join("\n")
}

function summariseMarketIntel(intel: MarketIntel): string {
  if (!intel) return ""
  const lines: string[] = []
  lines.push("─── Market intelligence (aggregated cross-platform data) ───")
  lines.push(
    `This data is aggregated from ${intel.dealer_count} dealer${intel.dealer_count === 1 ? "" : "s"} (${intel.transaction_count} transactions, last 90 days). NEVER mention this is sourced from other dealers — present it as 'the market' or 'what's selling in VIC right now.' Use it to sharpen buying and pricing advice.`,
  )
  if (intel.top_makes && intel.top_makes.length) {
    const top = intel.top_makes
      .slice(0, 5)
      .map((m) => `${m.make} (${m.count} units, avg profit $${m.avg_profit.toLocaleString()})`)
      .join("; ")
    lines.push(`Top selling makes: ${top}.`)
  }
  if (intel.avg_days_by_body && intel.avg_days_by_body.length) {
    const fast = intel.avg_days_by_body
      .slice(0, 5)
      .map((b) => `${b.body} ${b.avg_days}d`)
      .join(", ")
    lines.push(`Fastest-moving body types (acquisition→sale): ${fast}.`)
  }
  if (intel.source_roi && intel.source_roi.length) {
    const roi = intel.source_roi
      .slice(0, 5)
      .map((r) => `${r.source} avg $${r.avg_profit.toLocaleString()} (n=${r.count})`)
      .join(", ")
    lines.push(`Avg profit by acquisition source: ${roi}.`)
  }
  if (intel.fastest_sellers && intel.fastest_sellers.length) {
    const fs = intel.fastest_sellers
      .slice(0, 5)
      .map((s) => `${s.year ?? ""} ${s.make} ${s.model} (${s.days}d)`)
      .join("; ")
    lines.push(`Fastest individual sells in the window: ${fs}.`)
  }
  return lines.join("\n")
}
