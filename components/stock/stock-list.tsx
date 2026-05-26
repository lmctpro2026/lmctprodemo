"use client"

import { useState } from "react"
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
import { formatCurrency, generateVehicleTitle } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Vehicle } from "@/lib/types"
import { Car, Search, Edit, Trash2, ImageOff, FileText, ShieldAlert } from "lucide-react"

interface StockListProps {
  initialVehicles: Vehicle[]
  userId: string
}

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
  const [quality, setQuality] = useState<{ noPhotos: boolean; noDesc: boolean; noPpsr: boolean }>({
    noPhotos: false,
    noDesc: false,
    noPpsr: false,
  })

  const qualityCounts = {
    noPhotos: vehicles?.filter((v) => !v.images || v.images.length === 0).length || 0,
    noDesc:   vehicles?.filter((v) => !v.notes || v.notes.trim() === "").length || 0,
    noPpsr:   vehicles?.filter((v) => !v.ppsr_checked).length || 0,
  }

  const filteredVehicles = vehicles?.filter((v) => {
    const matchesSearch =
      generateVehicleTitle(v).toLowerCase().includes(search.toLowerCase()) ||
      v.stock_number?.toLowerCase().includes(search.toLowerCase()) ||
      v.rego?.toLowerCase().includes(search.toLowerCase()) ||
      v.vin?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || v.status === statusFilter

    if (quality.noPhotos && v.images && v.images.length > 0) return false
    if (quality.noDesc && v.notes && v.notes.trim() !== "") return false
    if (quality.noPpsr && v.ppsr_checked) return false

    return matchesSearch && matchesStatus
  }) || []

  async function handleDelete(vehicleId: string) {
    if (!confirm("Are you sure you want to delete this vehicle?")) return

    const supabase = createClient()
    const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId)
    if (error) {
      toast.error(`Delete failed: ${error.message}`)
      return
    }
    toast.success("Vehicle deleted")
    mutate()
  }

  const statusCounts = {
    all:       vehicles?.length || 0,
    Available: vehicles?.filter(v => v.status === "Available").length || 0,
    Reserved:  vehicles?.filter(v => v.status === "Reserved").length  || 0,
    Sold:      vehicles?.filter(v => v.status === "Sold").length      || 0,
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by make, model, stock #, rego, or VIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="Available">Available ({statusCounts.Available})</SelectItem>
            <SelectItem value="Reserved">Reserved ({statusCounts.Reserved})</SelectItem>
            <SelectItem value="Sold">Sold ({statusCounts.Sold})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quality filters */}
      <div className="flex flex-wrap gap-2">
        <QualityChip
          icon={ImageOff}
          label={`No Photos (${qualityCounts.noPhotos})`}
          active={quality.noPhotos}
          onClick={() => setQuality((q) => ({ ...q, noPhotos: !q.noPhotos }))}
        />
        <QualityChip
          icon={FileText}
          label={`No Description (${qualityCounts.noDesc})`}
          active={quality.noDesc}
          onClick={() => setQuality((q) => ({ ...q, noDesc: !q.noDesc }))}
        />
        <QualityChip
          icon={ShieldAlert}
          label={`No PPSR (${qualityCounts.noPpsr})`}
          active={quality.noPpsr}
          onClick={() => setQuality((q) => ({ ...q, noPpsr: !q.noPpsr }))}
        />
      </div>

      {/* Vehicle List */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No vehicles match your filters"
                : "No vehicles in stock yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredVehicles.map((vehicle) => {
            const daysInStock = computeDaysInStock(vehicle.acquisition_date)
            const ageBadge = daysInStockBadge(daysInStock, vehicle.status)
            return (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                {vehicle.images && vehicle.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vehicle.images[0]}
                    alt={generateVehicleTitle(vehicle)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Car className="h-12 w-12 text-muted-foreground opacity-50" />
                )}
                {ageBadge && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "absolute top-2 left-2 backdrop-blur bg-black/60 text-white border-white/20",
                      ageBadge.tone === "warn" && "border-amber-400/60 text-amber-200",
                      ageBadge.tone === "danger" && "border-destructive/70 text-destructive-foreground bg-destructive/80"
                    )}
                  >
                    {ageBadge.label}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold">{generateVehicleTitle(vehicle)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.stock_number && `#${vehicle.stock_number}`}
                      {vehicle.stock_number && vehicle.rego && " | "}
                      {vehicle.rego}
                    </p>
                  </div>
                  <Badge variant={
                    vehicle.status === "Available" ? "default" :
                    vehicle.status === "Reserved"  ? "secondary" :
                    vehicle.status === "Sold"      ? "outline" : "outline"
                  }>
                    {vehicle.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-muted-foreground">Odometer:</span>
                    <p>{vehicle.odometer ? `${vehicle.odometer.toLocaleString()} km` : "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transmission:</span>
                    <p>{vehicle.transmission || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Asking Price</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(vehicle.price || 0)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingVehicle(vehicle)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(vehicle.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
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

function QualityChip({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Car
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary/15 border-primary text-primary"
          : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
      aria-pressed={active}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

function computeDaysInStock(acquisitionDate: string | null): number | null {
  if (!acquisitionDate) return null
  const acq = new Date(acquisitionDate).getTime()
  if (Number.isNaN(acq)) return null
  return Math.floor((Date.now() - acq) / (1000 * 60 * 60 * 24))
}

function daysInStockBadge(
  days: number | null,
  status: string
): { label: string; tone: "ok" | "warn" | "danger" } | null {
  // Only badge live inventory — sold/reserved cars don't need an age call-out.
  if (status !== "Available" || days === null || days < 0) return null
  const label = `${days}d`
  if (days > 90) return { label, tone: "danger" }
  if (days > 60) return { label, tone: "warn" }
  return { label, tone: "ok" }
}
