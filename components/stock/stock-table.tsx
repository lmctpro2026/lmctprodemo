"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { cn, formatCurrency, generateVehicleTitle } from "@/lib/utils"
import type { Vehicle } from "@/lib/types"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  AlignLeft,
  Car,
  ImageOff,
  MoreHorizontal,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SortKey =
  | "stock"
  | "vehicle"
  | "odometer"
  | "days"
  | "status"
  | "price"

interface Props {
  vehicles: Vehicle[]
  onEdit: (v: Vehicle) => void
  onDeleted: () => void
}

const statusDot: Record<string, string> = {
  Available: "bg-emerald-400",
  Reserved:  "bg-amber-400",
  Sold:      "bg-zinc-500",
  Pending:   "bg-sky-400",
}

export function StockTable({ vehicles, onEdit, onDeleted }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "days",
    dir: "desc",
  })

  const rows = useMemo(() => {
    const enriched = vehicles.map((v) => ({
      ...v,
      _days: daysIn(v.acquisition_date),
    }))
    enriched.sort((a, b) => {
      let cmp = 0
      switch (sort.key) {
        case "stock":
          cmp = (a.stock_number || "").localeCompare(b.stock_number || "", undefined, { numeric: true })
          break
        case "vehicle":
          cmp = generateVehicleTitle(a).localeCompare(generateVehicleTitle(b))
          break
        case "odometer":
          cmp = (a.odometer || 0) - (b.odometer || 0)
          break
        case "days":
          cmp = (a._days ?? -1) - (b._days ?? -1)
          break
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "")
          break
        case "price":
          cmp = (Number(a.price) || 0) - (Number(b.price) || 0)
          break
      }
      return sort.dir === "asc" ? cmp : -cmp
    })
    return enriched
  }, [vehicles, sort])

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "days" || key === "price" ? "desc" : "asc" }
    )
  }

  async function handleDelete(vehicleId: string) {
    if (!confirm("Delete this vehicle? This cannot be undone.")) return
    const supabase = createClient()
    const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId)
    if (error) {
      toast.error(`Delete failed: ${error.message}`)
      return
    }
    toast.success("Vehicle deleted")
    onDeleted()
  }

  if (rows.length === 0) {
    return (
      <div className="border border-border rounded-lg bg-card/40">
        <div className="py-16 text-center">
          <Car className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No vehicles match your filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg bg-card/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/70 border-b border-border">
            <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="w-14 px-3 py-2.5 text-left font-medium"></th>
              <SortHeader label="Stock" k="stock" sort={sort} onClick={toggleSort} className="w-24" />
              <SortHeader label="Vehicle" k="vehicle" sort={sort} onClick={toggleSort} />
              <th className="hidden md:table-cell px-3 py-2.5 text-left font-medium w-24">Body</th>
              <SortHeader label="Odometer" k="odometer" sort={sort} onClick={toggleSort} align="right" className="hidden lg:table-cell w-28" />
              <SortHeader label="Days" k="days" sort={sort} onClick={toggleSort} align="right" className="w-16" />
              <SortHeader label="Status" k="status" sort={sort} onClick={toggleSort} className="w-28" />
              <th className="hidden xl:table-cell px-3 py-2.5 text-left font-medium w-24">Flags</th>
              <SortHeader label="Price" k="price" sort={sort} onClick={toggleSort} align="right" className="w-28" />
              <th className="w-10 px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((v) => {
              const flags = qualityFlags(v)
              const dotClass = statusDot[v.status] || "bg-zinc-500"
              const dayColor = dayColorClass(v._days, v.status)
              return (
                <tr
                  key={v.id}
                  onClick={() => onEdit(v)}
                  className="group cursor-pointer hover:bg-secondary/40 transition-colors"
                >
                  {/* Thumbnail */}
                  <td className="px-3 py-2">
                    <div className="w-9 h-9 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {v.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Car className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </td>

                  {/* Stock # */}
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground tabular-nums">
                    {v.stock_number || "—"}
                  </td>

                  {/* Vehicle */}
                  <td className="px-3 py-2 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {generateVehicleTitle(v)}
                      {v.variant ? <span className="text-muted-foreground font-normal"> · {v.variant}</span> : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground/80 truncate">
                      {[v.rego, v.colour, v.transmission].filter(Boolean).join(" · ") || v.vin || "—"}
                    </div>
                  </td>

                  {/* Body */}
                  <td className="hidden md:table-cell px-3 py-2 text-muted-foreground">
                    {v.body || "—"}
                  </td>

                  {/* Odometer */}
                  <td className="hidden lg:table-cell px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {v.odometer ? `${(v.odometer / 1000).toFixed(0)}k km` : "—"}
                  </td>

                  {/* Days */}
                  <td className={cn("px-3 py-2 text-right tabular-nums font-medium", dayColor)}>
                    {v._days !== null ? `${v._days}d` : "—"}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
                    <div className="inline-flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
                      <span className="text-foreground/90">{v.status}</span>
                    </div>
                  </td>

                  {/* Quality flags */}
                  <td className="hidden xl:table-cell px-3 py-2">
                    {flags.length === 0 ? (
                      <span className="text-emerald-400/70 text-[11px]">✓ clean</span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-400/80">
                        {flags.map((f) => (
                          <span
                            key={f.key}
                            title={f.label}
                            className="inline-flex items-center justify-center"
                          >
                            <f.Icon className="h-3.5 w-3.5" />
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground">
                    {v.price ? formatCurrency(v.price) : "—"}
                  </td>

                  {/* Row menu */}
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label="Row actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(v)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(v.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  k,
  sort,
  onClick,
  align = "left",
  className,
}: {
  label: string
  k: SortKey
  sort: { key: SortKey; dir: "asc" | "desc" }
  onClick: (k: SortKey) => void
  align?: "left" | "right"
  className?: string
}) {
  const active = sort.key === k
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <th className={cn("px-3 py-2.5 font-medium", className)}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground transition-colors",
          active ? "text-foreground" : "text-muted-foreground",
          align === "right" && "ml-auto"
        )}
      >
        {align === "right" && <Icon className="h-3 w-3 opacity-60" />}
        <span>{label}</span>
        {align === "left" && <Icon className="h-3 w-3 opacity-60" />}
      </button>
    </th>
  )
}

function daysIn(acquisitionDate: string | null): number | null {
  if (!acquisitionDate) return null
  const t = new Date(acquisitionDate).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24))
}

function dayColorClass(days: number | null, status: string): string {
  if (status !== "Available" || days === null || days < 0) return "text-muted-foreground"
  if (days > 90) return "text-destructive"
  if (days > 60) return "text-amber-400"
  if (days > 30) return "text-foreground/80"
  return "text-emerald-400/90"
}

function qualityFlags(v: Vehicle) {
  const out: { key: string; label: string; Icon: typeof ImageOff }[] = []
  if (!v.images || v.images.length === 0) out.push({ key: "img", label: "No photos", Icon: ImageOff })
  if (!v.notes || v.notes.trim() === "") out.push({ key: "desc", label: "No description", Icon: AlignLeft })
  if (!v.ppsr_checked) out.push({ key: "ppsr", label: "PPSR not checked", Icon: ShieldAlert })
  return out
}
