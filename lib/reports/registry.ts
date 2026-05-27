// Central catalog of reports.
//
// A "live" report has a runner in lib/reports/runners.ts and renders real data.
// A "planned" report shows in the index so dealers know it's coming but won't
// open a page yet. Promote to "live" by writing a runner and flipping status.

export type ReportStatus = "live" | "planned"
export type ReportCategory =
  | "Operational"
  | "Compliance"
  | "Financial"
  | "Quality"
  | "Sales analysis"
  | "Accounting"

export type ReportFilter = "dateRange" | "status" | "year"

export interface ReportDef {
  slug: string
  title: string
  description: string
  category: ReportCategory
  status: ReportStatus
  filters?: ReportFilter[]
}

export const reports: ReportDef[] = [
  // ─── Operational ────────────────────────────────────────────────────────
  {
    slug: "stock-list",
    title: "Stock List",
    description:
      "Every vehicle in stock with rego, body, odometer, days held, asking price. The dealer's working list.",
    category: "Operational",
    status: "live",
    filters: ["status"],
  },
  {
    slug: "aged-stock",
    title: "Aged Stock",
    description:
      "Available vehicles older than 60 days with suggested actions. Surfaces the cars tying up your cash.",
    category: "Operational",
    status: "live",
  },
  {
    slug: "incomplete-stock",
    title: "Incomplete Stock Information",
    description:
      "Vehicles missing VIN, rego, acquisition date, or description. Fix before listing publicly.",
    category: "Operational",
    status: "live",
  },
  {
    slug: "stocktake",
    title: "Stocktake",
    description: "Counted stock as of date with last-counted timestamps. Annual compliance.",
    category: "Operational",
    status: "planned",
  },
  {
    slug: "location-report",
    title: "Location Report",
    description: "Stock by physical location / yard. Multi-yard dealers only.",
    category: "Operational",
    status: "planned",
  },

  // ─── Quality ────────────────────────────────────────────────────────────
  {
    slug: "no-images",
    title: "No Images Report",
    description:
      "Available vehicles with zero photos. Every car without photos is a car not selling online.",
    category: "Quality",
    status: "live",
  },
  {
    slug: "stock-images",
    title: "Stock Images Report",
    description: "Image count per vehicle. Catch the half-photographed cars.",
    category: "Quality",
    status: "planned",
  },

  // ─── Sales analysis ────────────────────────────────────────────────────
  {
    slug: "sold-stock",
    title: "Sold Stock",
    description:
      "All sales in the selected period with sale price, profit, margin. Totals at top.",
    category: "Sales analysis",
    status: "live",
    filters: ["dateRange"],
  },
  {
    slug: "sales-by-model",
    title: "Sales by Make / Model",
    description:
      "Units, revenue, average profit and average days-to-sell grouped by make+model. Find your bread-and-butter cars.",
    category: "Sales analysis",
    status: "live",
    filters: ["dateRange"],
  },
  {
    slug: "lead-source-summary",
    title: "Sales by Lead Source",
    description:
      "Sales broken down by where the customer came from (Facebook, Carsales, walk-in, referral). Spend smarter.",
    category: "Sales analysis",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "sold-stock-matrix-cost",
    title: "Sold Stock Matrix — by Cost",
    description: "Sales bucketed into price bands (under $10k, $10-20k, etc.) for margin analysis.",
    category: "Sales analysis",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "sold-stock-matrix-days",
    title: "Sold Stock Matrix — Days in Stock",
    description: "Sales bucketed by how long each car sat (0-30d, 31-60d, 61-90d, 90d+).",
    category: "Sales analysis",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "enquiries-by-model",
    title: "Enquiries and Sales by Model",
    description: "Enquiries received vs sales closed per model. Conversion analysis.",
    category: "Sales analysis",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "salesperson-commission",
    title: "Salesperson Commission",
    description: "Sales attributed by salesperson with commission calc. Multi-staff dealers.",
    category: "Sales analysis",
    status: "planned",
    filters: ["dateRange"],
  },

  // ─── Compliance ─────────────────────────────────────────────────────────
  {
    slug: "dealings-register",
    title: "Dealings Register",
    description:
      "Every sale with buyer name, address, licence, vehicle and sale price — formatted for the VIC LMCT dealings register requirement.",
    category: "Compliance",
    status: "live",
    filters: ["dateRange"],
  },
  {
    slug: "log-of-changes",
    title: "Log of Changes",
    description: "Audit trail of who changed what and when. Compliance and dispute resolution.",
    category: "Compliance",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "takata-recall",
    title: "Takata Airbag Recall",
    description: "Vehicles cross-checked against the Takata recall list.",
    category: "Compliance",
    status: "planned",
  },

  // ─── Financial ──────────────────────────────────────────────────────────
  {
    slug: "gst-summary",
    title: "GST Summary",
    description:
      "Total sales, GST collected (1/11th of taxable sales), and net of GST for the selected period. BAS-ready.",
    category: "Financial",
    status: "live",
    filters: ["dateRange"],
  },
  {
    slug: "warranty-profit",
    title: "Warranty Profit",
    description: "Warranty income vs claims paid. Profit-margin on add-ons.",
    category: "Financial",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "lct",
    title: "Luxury Car Tax (LCT)",
    description: "Sales above the LCT threshold with LCT calculation.",
    category: "Financial",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "government-fees",
    title: "Government Fees",
    description: "Rego, stamp duty, transfer fees paid on each deal.",
    category: "Financial",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "expense",
    title: "Expense Report",
    description: "Recon, transport, advertising — cost per vehicle and totals.",
    category: "Financial",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "acquisition",
    title: "Acquisition Report",
    description: "What you bought, from whom, when, for how much.",
    category: "Financial",
    status: "planned",
    filters: ["dateRange"],
  },

  // ─── Accounting (typically lives in Xero/MYOB; here for completeness) ───
  {
    slug: "accounting-reconciliation",
    title: "Accounting Reconciliation",
    description: "Reconcile DMS sales against your accounting software. Plug-and-play with Xero coming later.",
    category: "Accounting",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "creditors",
    title: "Creditors",
    description: "Money you owe — suppliers, recon, transport.",
    category: "Accounting",
    status: "planned",
  },
  {
    slug: "debtors",
    title: "Debtors",
    description: "Money owed to you — deposits, finance settlements pending.",
    category: "Accounting",
    status: "planned",
  },
  {
    slug: "floorplan-creditors",
    title: "Floorplan Creditors",
    description: "Floorplan facility usage and interest.",
    category: "Accounting",
    status: "planned",
  },
  {
    slug: "invoice-report",
    title: "Invoice Report",
    description: "All invoices issued in the period.",
    category: "Accounting",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "payments",
    title: "Payments",
    description: "Money out — supplier, gov, refunds.",
    category: "Accounting",
    status: "planned",
    filters: ["dateRange"],
  },
  {
    slug: "receipts",
    title: "Receipts",
    description: "Money in — deposits, settlements, cash sales.",
    category: "Accounting",
    status: "planned",
    filters: ["dateRange"],
  },
]

export function getReport(slug: string): ReportDef | null {
  return reports.find((r) => r.slug === slug) ?? null
}

export function reportsByCategory(): Record<ReportCategory, ReportDef[]> {
  const out = {} as Record<ReportCategory, ReportDef[]>
  for (const r of reports) {
    if (!out[r.category]) out[r.category] = []
    out[r.category].push(r)
  }
  return out
}

export const categoryOrder: ReportCategory[] = [
  "Operational",
  "Quality",
  "Sales analysis",
  "Compliance",
  "Financial",
  "Accounting",
]
