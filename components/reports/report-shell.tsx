"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Printer, Download } from "lucide-react"
import type { ReportResult } from "@/lib/reports/runners"
import type { ReportDef } from "@/lib/reports/registry"

interface Props {
  report: ReportDef
  result: ReportResult
  filters: { from?: string; to?: string; status?: string }
  dealerName: string
}

export function ReportShell({ report, result, filters, dealerName }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [from, setFrom] = useState(filters.from || "")
  const [to, setTo]     = useState(filters.to   || "")
  const [status, setStatus] = useState(filters.status || "all")

  const hasDateRange = report.filters?.includes("dateRange")
  const hasStatus    = report.filters?.includes("status")

  function applyFilters() {
    const p = new URLSearchParams(params.toString())
    if (hasDateRange) {
      if (from) p.set("from", from); else p.delete("from")
      if (to)   p.set("to", to);     else p.delete("to")
    }
    if (hasStatus) {
      if (status && status !== "all") p.set("status", status); else p.delete("status")
    }
    router.push(`?${p.toString()}`)
  }

  function exportCSV() {
    const headers = result.columns.map((c) => csvEscape(c.label)).join(",")
    const lines = result.rows.map((row) =>
      result.columns
        .map((c) => csvEscape(formatRaw(row[c.key], c.format)))
        .join(",")
    )
    const blob = new Blob([`${headers}\n${lines.join("\n")}\n`], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${report.slug}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generatedAt = new Date().toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  const periodLabel = hasDateRange && filters.from && filters.to
    ? `${formatDateLong(filters.from)} – ${formatDateLong(filters.to)}`
    : null

  return (
    <div className="space-y-5">
      {/* Header (hidden in print) */}
      <div className="flex items-start justify-between gap-4 flex-wrap report-chrome">
        <div>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1.5"
          >
            <ArrowLeft className="h-3 w-3" /> All reports
          </Link>
          <h1 className="text-xl font-semibold">{report.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            CSV
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {(hasDateRange || hasStatus) && (
        <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-border bg-card/40 report-chrome">
          {hasDateRange && (
            <>
              <div className="space-y-1">
                <Label htmlFor="from" className="text-[10px] uppercase tracking-wider text-muted-foreground">From</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-8 w-40"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to" className="text-[10px] uppercase tracking-wider text-muted-foreground">To</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-8 w-40"
                />
              </div>
            </>
          )}
          {hasStatus && (
            <div className="space-y-1">
              <Label htmlFor="status" className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 w-40" id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button size="sm" onClick={applyFilters} className="h-8">Apply</Button>
        </div>
      )}

      {/* Print-only document header */}
      <div className="hidden print:block print-header">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">{dealerName}</div>
        <h1 className="text-2xl font-bold mt-1">{report.title}</h1>
        {periodLabel && <div className="text-sm text-zinc-600 mt-1">{periodLabel}</div>}
        <div className="text-xs text-zinc-500 mt-1">Generated {generatedAt}</div>
      </div>

      {/* Summary tiles */}
      {result.summary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {result.summary.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-card/40 px-4 py-3 print:bg-transparent print:border-zinc-300"
            >
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground print:text-zinc-600">{s.label}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums print:text-black">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg bg-card/40 overflow-hidden print:border-zinc-300">
        {result.rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {result.empty || "No data."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/95 border-b border-border print:bg-zinc-100 print:border-zinc-300">
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground print:text-zinc-700">
                  {result.columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn("px-3 py-2.5 font-medium", c.align === "right" ? "text-right" : "text-left")}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 print:divide-zinc-200">
                {result.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-secondary/30 print:hover:bg-transparent">
                    {result.columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-3 py-2",
                          c.align === "right" ? "text-right tabular-nums" : "",
                          c.format === "money" && "font-medium",
                          c.format === "days" && colorForDays(Number(row[c.key]))
                        )}
                      >
                        {formatCell(row[c.key], c.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-[11px] text-muted-foreground report-chrome">
        Generated {generatedAt} · {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
      </div>
    </div>
  )
}

function formatCell(v: unknown, format?: string): string {
  if (v === null || v === undefined || v === "") return "—"
  switch (format) {
    case "money":
      return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
      }).format(Number(v) || 0)
    case "number":
      return new Intl.NumberFormat("en-AU").format(Number(v) || 0)
    case "days":
      return `${v}d`
    case "date":
      return formatDateShort(String(v))
    default:
      return String(v)
  }
}

function formatRaw(v: unknown, format?: string): string {
  if (v === null || v === undefined) return ""
  if (format === "money") return String(Number(v) || 0)
  return String(v)
}

function formatDateShort(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
}

function formatDateLong(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
}

function csvEscape(s: string): string {
  if (s == null) return ""
  const v = String(s)
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
  return v
}

function colorForDays(days: number): string {
  if (!days) return ""
  if (days > 90) return "text-destructive print:text-red-700"
  if (days > 60) return "text-amber-400 print:text-amber-700"
  if (days > 30) return "text-foreground/80"
  return "text-emerald-400/90 print:text-emerald-700"
}
