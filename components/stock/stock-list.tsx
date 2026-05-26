"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VehicleDialog } from "./vehicle-dialog"
import { StockTable } from "./stock-table"
import { cn, formatCurrency, generateVehicleTitle } from "@/lib/utils"
import type { Vehicle } from "@/lib/types"
import {
  AlignLeft,
  Car,
  Edit,
  ImageOff,
  LayoutGrid,
  List,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react"

interface StockListProps {
  initialVehicles: Vehicle[]
  userId: string
}

type ViewMode = "table" | "grid"

async function fetchVehicles(userId: string): Promise<Vehicle[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return (data as Vehicle[]) || []
}

export function StockList({ initialVehicles, userId }: StockListProps) {
  const { data: vehicles, mutate } = useSWR(
    ["vehicles", userId],
    () => fetchVehicles(userId),
    { fallbackData: initialVehicles }
  )

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [view, setView] = useState<ViewMode>("table")
  const [quality, setQuality] = useState<{ noPhotos: boolean; noDesc: boolean; noPpsr: boolean }>({
    noPhotos: false,
    noDesc: false,
    noPpsr: false,
  })

  // Persist view choice across reloads.
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem("stock-view") as ViewMode | null
    if (saved === "table" || saved === "grid") setView(saved)
  }, [])
  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("stock-view", view)
  }, [view])

  const list = vehicles ?? []

  const counts = useMemo(() => {
    return {
      all: list.length,
      Available: list.filter((v) => v.status === "Available").length,
      Reserved:  list.filter((v) => v.status === "Reserved").length,
      Sold:      list.filter((v) => v.status === "Sold").length,
      noPhotos:  list.filter((v) => !v.images || v.images.length === 0).length,
      noDesc:    list.filter((v) => !v.notes || v.notes.trim() === "").length,
      noPpsr:    list.filter((v) => !v.ppsr_checked).length,
    }
  }, [list])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter((v) => {
      if (q) {
        const hay =
          generateVehicleTitle(v).toLowerCase() +
          " " +
          (v.stock_number || "").toLowerCase() +
          " " +
          (v.rego || "").toLowerCase() +
          " " +
          (v.vin || "").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (statusFilter !== "all" && v.status !== statusFilter) return false
      if (quality.noPhotos && v.images && v.images.length > 0) return false
      if (quality.noDesc && v.notes && v.notes.trim() !== "") return false
      if (quality.noPpsr && v.ppsr_checked) return false
      return true
    })
  }, [list, search, statusFilter, quality])

  async function handleDelete(vehicleId: string) {
    if (!confirm("Delete this vehicle? This cannot be undone.")) return
    const supabase = createClient()
    const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId)
    if (error) {
      toast.error(`Delete failed: ${error.message}`)
      return
    }
    toast.success("Vehicle deleted")
    mutate()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stock #, rego, VIN, make, model…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status ({counts.all})</SelectItem>
              <SelectItem value="Available">Available ({counts.Available})</SelectItem>
              <SelectItem value="Reserved">Reserved ({counts.Reserved})</SelectItem>
              <SelectItem value="Sold">Sold ({counts.Sold})</SelectItem>
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-md border border-border bg-card overflow-hidden h-9 self-end sm:self-auto">
            <ViewToggle
              active={view === "table"}
              onClick={() => setView("table")}
              icon={List}
              label="Table"
            />
            <ViewToggle
              active={view === "grid"}
              onClick={() => setView("grid")}
              icon={LayoutGrid}
              label="Grid"
            />
          </div>
        </div>

        {/* Quality chips + result count */}
        <div className="flex flex-wrap items-center gap-2">
          <QualityChip
            icon={ImageOff}
            label="No photos"
            count={counts.noPhotos}
            active={quality.noPhotos}
            onClick={() => setQuality((q) => ({ ...q, noPhotos: !q.noPhotos }))}
          />
          <QualityChip
            icon={AlignLeft}
            label="No description"
            count={counts.noDesc}
            active={quality.noDesc}
            onClick={() => setQuality((q) => ({ ...q, noDesc: !q.noDesc }))}
          />
          <QualityChip
            icon={ShieldAlert}
            label="PPSR pending"
            count={counts.noPpsr}
            active={quality.noPpsr}
            onClick={() => setQuality((q) => ({ ...q, noPpsr: !q.noPpsr }))}
          />
          <div className="ml-auto text-xs text-muted-foreground tabular-nums">
            {filtered.length === list.length
              ? `${list.length} vehicle${list.length === 1 ? "" : "s"}`
              : `${filtered.length} of ${list.length} shown`}
          </div>
        </div>
      </div>

      {/* Body */}
      {view === "table" ? (
        <StockTable
          vehicles={filtered}
          onEdit={setEditingVehicle}
          onDeleted={mutate}
        />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No vehicles match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vehicle) => {
            const days = daysIn(vehicle.acquisition_date)
            const ageBadge = ageBadgeFor(days, vehicle.status)
            return (
              <Card key={vehicle.id} className="overflow-hidden hover:border-border/80 transition-colors">
                <div className="aspect-[16/10] bg-muted flex items-center justify-center relative">
                  {vehicle.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={vehicle.images[0]}
                      alt={generateVehicleTitle(vehicle)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Car className="h-10 w-10 text-muted-foreground/40" />
                  )}
                  {ageBadge && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "absolute top-2 left-2 backdrop-blur bg-black/60 text-white border-white/20 tabular-nums",
                        ageBadge.tone === "warn" && "border-amber-400/60 text-amber-200",
                        ageBadge.tone === "danger" && "border-destructive/70 text-destructive-foreground bg-destructive/80"
                      )}
                    >
                      {ageBadge.label}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{generateVehicleTitle(vehicle)}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {[vehicle.stock_number && `#${vehicle.stock_number}`, vehicle.rego]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          vehicle.status === "Available" && "bg-emerald-400",
                          vehicle.status === "Reserved" && "bg-amber-400",
                          vehicle.status === "Sold" && "bg-zinc-500",
                          vehicle.status === "Pending" && "bg-sky-400"
                        )}
                      />
                      <span className="text-foreground/80">{vehicle.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mt-2 mb-3">
                    <span>{vehicle.odometer ? `${vehicle.odometer.toLocaleString()} km` : "—"}</span>
                    <span className="text-right">{vehicle.transmission || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-lg font-semibold text-foreground tabular-nums">
                      {formatCurrency(vehicle.price || 0)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingVehicle(vehicle)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(vehicle.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {editingVehicle && (
        <VehicleDialog
          vehicle={editingVehicle}
          open={!!editingVehicle}
          onOpenChange={(open) => !open && setEditingVehicle(null)}
          onSave={() => {
            setEditingVehicle(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof List
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`${label} view`}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 text-xs font-medium transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function QualityChip({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: typeof Car
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary/15 border-primary text-primary"
          : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
      <span className="text-[10px] opacity-60 tabular-nums">{count}</span>
    </button>
  )
}

function daysIn(acquisitionDate: string | null): number | null {
  if (!acquisitionDate) return null
  const t = new Date(acquisitionDate).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24))
}

function ageBadgeFor(days: number | null, status: string) {
  if (status !== "Available" || days === null || days < 0) return null
  const label = `${days}d`
  if (days > 90) return { label, tone: "danger" as const }
  if (days > 60) return { label, tone: "warn" as const }
  return { label, tone: "ok" as const }
}
