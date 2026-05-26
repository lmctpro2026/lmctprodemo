"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

// One-time bridge from the old standalone-HTML LMCT PRO app to Supabase.
// New dealers signing up after the Next.js migration won't have localStorage
// data and will see "No existing data found". Once everyone's migrated this
// component can be removed.

type MigrationKey = "vehicles" | "customers" | "sales" | "tasks"
type MigrationStage = "pending" | "running" | "done" | "error"

interface MigrationStatus {
  vehicles: { total: number; migrated: number; status: MigrationStage }
  customers: { total: number; migrated: number; status: MigrationStage }
  sales:    { total: number; migrated: number; status: MigrationStage }
  tasks:    { total: number; migrated: number; status: MigrationStage }
}

interface LegacyVehicle {
  stockNumber?: string; stock_number?: string
  vin?: string; rego?: string; make?: string; model?: string
  year?: string | number
  colour?: string; color?: string
  bodyType?: string; body_type?: string
  transmission?: string
  fuelType?: string; fuel_type?: string
  odometer?: string | number
  purchasePrice?: string | number; purchase_price?: string | number
  salePrice?: string | number; sale_price?: string | number; askingPrice?: string | number
  status?: string
  purchaseDate?: string; purchase_date?: string
  notes?: string
}

interface LegacyCustomer {
  name?: string; email?: string; phone?: string; address?: string
  licenseNumber?: string; license_number?: string; license?: string
  dateOfBirth?: string; date_of_birth?: string
  notes?: string
  interests?: string
  hot?: boolean
}

interface LegacySale {
  vehicleDescription?: string; vehicle_description?: string
  make?: string; model?: string; year?: string | number; rego?: string
  customerName?: string; customer_name?: string; buyer_name?: string
  customerEmail?: string; customer_email?: string
  customerPhone?: string; customer_phone?: string
  salePrice?: string | number; sale_price?: string | number
  saleDate?: string; sale_date?: string
  paymentMethod?: string; payment_method?: string
  status?: string
  notes?: string
  profit?: string | number
}

interface LegacyTask {
  title?: string; description?: string; status?: string; priority?: string
  dueDate?: string; due_date?: string
}

function parseVehicleDescription(desc: string): { year: number; make: string; model: string } {
  // "2020 Toyota Camry SL" → { year: 2020, make: "Toyota", model: "Camry SL" }
  const match = desc.match(/^\s*(19\d{2}|20\d{2})\s+(\S+)\s+(.*)$/)
  if (match) {
    return { year: parseInt(match[1]), make: match[2], model: match[3].trim() }
  }
  return { year: new Date().getFullYear(), make: "Unknown", model: desc.trim() || "Unknown" }
}

export function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [status, setStatus] = useState<MigrationStatus>({
    vehicles:  { total: 0, migrated: 0, status: "pending" },
    customers: { total: 0, migrated: 0, status: "pending" },
    sales:     { total: 0, migrated: 0, status: "pending" },
    tasks:     { total: 0, migrated: 0, status: "pending" },
  })

  function readLocalStorage() {
    const vehicles  = JSON.parse(localStorage.getItem("lmct_vehicles")  || "[]") as LegacyVehicle[]
    const customers = JSON.parse(localStorage.getItem("lmct_customers") || "[]") as LegacyCustomer[]
    const sales     = JSON.parse(localStorage.getItem("lmct_sales")     || "[]") as LegacySale[]
    const tasks     = JSON.parse(localStorage.getItem("lmct_tasks")     || "[]") as LegacyTask[]
    return {
      vehicles, customers, sales, tasks,
      hasData: vehicles.length > 0 || customers.length > 0 || sales.length > 0 || tasks.length > 0,
    }
  }

  function bumpMigrated(key: MigrationKey) {
    setStatus(prev => ({ ...prev, [key]: { ...prev[key], migrated: prev[key].migrated + 1 } }))
  }

  function setStage(key: MigrationKey, stage: MigrationStage, total?: number) {
    setStatus(prev => ({
      ...prev,
      [key]: { ...prev[key], status: stage, ...(total !== undefined ? { total } : {}) },
    }))
  }

  async function migrateData() {
    setIsMigrating(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("You must be signed in to migrate data")
      setIsMigrating(false)
      return
    }

    const localData = readLocalStorage()
    const todayIso = new Date().toISOString().split("T")[0]
    let totalErrors = 0

    // --- Vehicles ---
    if (localData.vehicles.length > 0) {
      setStage("vehicles", "running", localData.vehicles.length)
      for (const v of localData.vehicles) {
        const { error } = await supabase.from("vehicles").insert({
          user_id: user.id,
          stock_number: v.stockNumber || v.stock_number || "",
          vin: v.vin || "",
          rego: v.rego || "",
          make: v.make || "Unknown",
          model: v.model || "Unknown",
          year: parseInt(String(v.year)) || new Date().getFullYear(),
          variant: "",
          colour: v.colour || v.color || "",
          body: v.bodyType || v.body_type || "Sedan",
          transmission: v.transmission || "Auto",
          fuel: v.fuelType || v.fuel_type || "Petrol",
          odometer: parseInt(String(v.odometer)) || 0,
          purchase_price: parseFloat(String(v.purchasePrice || v.purchase_price)) || 0,
          recon_cost: 0,
          other_cost: 0,
          source: "Migration",
          acquisition_date: v.purchaseDate || v.purchase_date || todayIso,
          price: parseFloat(String(v.salePrice || v.sale_price || v.askingPrice)) || 0,
          status: "Available",
          score: 50,
          notes: v.notes || "",
          features: [],
        })
        if (error) totalErrors++
        else bumpMigrated("vehicles")
      }
      setStage("vehicles", "done")
    }

    // --- Customers ---
    if (localData.customers.length > 0) {
      setStage("customers", "running", localData.customers.length)
      for (const c of localData.customers) {
        const { error } = await supabase.from("customers").insert({
          user_id: user.id,
          name: c.name || "Unknown",
          email: c.email || "",
          phone: c.phone || "",
          address: c.address || "",
          license: c.licenseNumber || c.license_number || c.license || "",
          date_of_birth: c.dateOfBirth || c.date_of_birth || null,
          interests: c.interests || "",
          notes: c.notes || "",
          hot: c.hot ?? false,
        })
        if (error) totalErrors++
        else bumpMigrated("customers")
      }
      setStage("customers", "done")
    }

    // --- Sales ---
    if (localData.sales.length > 0) {
      setStage("sales", "running", localData.sales.length)
      for (const s of localData.sales) {
        const parsed = s.make && s.model
          ? { year: parseInt(String(s.year)) || new Date().getFullYear(), make: s.make, model: s.model }
          : parseVehicleDescription(s.vehicleDescription || s.vehicle_description || "")
        const salePrice = parseFloat(String(s.salePrice || s.sale_price)) || 0
        const profit = parseFloat(String(s.profit)) || 0

        const { error } = await supabase.from("sales").insert({
          user_id: user.id,
          vehicle_id: null,    // legacy data has no FK link
          customer_id: null,
          make: parsed.make,
          model: parsed.model,
          year: parsed.year,
          rego: s.rego || "",
          sale_price: salePrice,
          total_cost: salePrice - profit,
          profit: profit,
          margin: salePrice > 0 ? parseFloat(((profit / salePrice) * 100).toFixed(2)) : 0,
          buyer_name: s.customerName || s.customer_name || s.buyer_name || "Unknown",
          buyer_email: s.customerEmail || s.customer_email || "",
          buyer_phone: s.customerPhone || s.customer_phone || "",
          buyer_address: "",
          buyer_license: "",
          sale_date: s.saleDate || s.sale_date || todayIso,
          settlement_date: null,
          status: "Completed",
          payment_method: s.paymentMethod || s.payment_method || "",
          deposit_amount: 0,
          warranty_type: "",
          warranty_months: 0,
          notes: s.notes || "",
        })
        if (error) totalErrors++
        else bumpMigrated("sales")
      }
      setStage("sales", "done")
    }

    // --- Tasks ---
    if (localData.tasks.length > 0) {
      setStage("tasks", "running", localData.tasks.length)
      for (const t of localData.tasks) {
        const { error } = await supabase.from("tasks").insert({
          user_id: user.id,
          title: t.title || "Untitled",
          description: t.description || "",
          status: (t.status as "todo" | "in_progress" | "done") || "todo",
          priority: (t.priority as "low" | "medium" | "high") || "medium",
          due_date: t.dueDate || t.due_date || null,
          vehicle_id: null,
        })
        if (error) totalErrors++
        else bumpMigrated("tasks")
      }
      setStage("tasks", "done")
    }

    setIsMigrating(false)
    setMigrationComplete(true)

    if (totalErrors > 0) {
      toast.error(`Migration completed with ${totalErrors} failed records — check console`)
    } else {
      toast.success("Migration complete")
    }
  }

  const localData = typeof window !== "undefined"
    ? readLocalStorage()
    : { hasData: false, vehicles: [] as LegacyVehicle[], customers: [] as LegacyCustomer[], sales: [] as LegacySale[], tasks: [] as LegacyTask[] }

  const StatusIcon = ({ stage }: { stage: MigrationStage }) => {
    switch (stage) {
      case "running": return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case "done":    return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":   return <AlertCircle className="h-4 w-4 text-destructive" />
      default:        return <div className="h-4 w-4 rounded-full border-2 border-muted" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Data Migration
        </CardTitle>
        <CardDescription>
          One-time import of records from the previous LMCT PRO app (browser localStorage) into your Supabase account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!localData.hasData && !migrationComplete ? (
          <p className="text-muted-foreground text-sm">
            No existing data found in localStorage. If you used the older HTML version of LMCT PRO in this browser, that data would appear here. Otherwise nothing to do — start fresh.
          </p>
        ) : migrationComplete ? (
          <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Migration complete</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {status.vehicles.migrated} vehicles · {status.customers.migrated} customers · {status.sales.migrated} sales · {status.tasks.migrated} tasks
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {([
                ["Vehicles",  status.vehicles,  localData.vehicles.length],
                ["Customers", status.customers, localData.customers.length],
                ["Sales",     status.sales,     localData.sales.length],
                ["Tasks",     status.tasks,     localData.tasks.length],
              ] as const).map(([label, s, total]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <StatusIcon stage={s.status} />
                    <span>{label}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {s.migrated}/{total} records
                  </span>
                </div>
              ))}
            </div>

            <Button onClick={migrateData} disabled={isMigrating} className="w-full">
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Migration
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
