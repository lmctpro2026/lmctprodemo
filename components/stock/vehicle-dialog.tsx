"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Vehicle, VehicleStatus } from "@/lib/types"
import { Loader2 } from "lucide-react"
import { VehicleImageUploader } from "./vehicle-image-uploader"
import { useMemo } from "react"

interface VehicleDialogProps {
  vehicle?: Vehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

const bodyTypes = ["Sedan", "Hatchback", "SUV", "Wagon", "Ute", "Coupe", "Convertible", "Van"]
const transmissions = ["Automatic", "Manual", "CVT"]
const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG"]
const statuses: VehicleStatus[] = ["Available", "Reserved", "Sold", "Pending"]

export function VehicleDialog({ vehicle, open, onOpenChange, onSave }: VehicleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>(vehicle?.images || [])
  const [ppsrChecked, setPpsrChecked] = useState<boolean>(vehicle?.ppsr_checked ?? false)
  // Stable key for new vehicles — used as the second folder segment in
  // storage paths so previews uploaded before save land in one place.
  const uploadKey = useMemo(
    () => vehicle?.id || `new-${Date.now().toString(36)}`,
    [vehicle?.id]
  )
  const [formData, setFormData] = useState({
    stock_number: vehicle?.stock_number || "",
    vin: vehicle?.vin || "",
    rego: vehicle?.rego || "",
    year: vehicle?.year?.toString() || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    variant: vehicle?.variant || "",
    body: vehicle?.body || "",
    transmission: vehicle?.transmission || "",
    fuel: vehicle?.fuel || "",
    colour: vehicle?.colour || "",
    odometer: vehicle?.odometer?.toString() || "",
    purchase_price: vehicle?.purchase_price?.toString() || "",
    acquisition_date: vehicle?.acquisition_date || "",
    source: vehicle?.source || "",
    price: vehicle?.price?.toString() || "",
    recon_cost: vehicle?.recon_cost?.toString() || "",
    other_cost: vehicle?.other_cost?.toString() || "",
    status: (vehicle?.status as VehicleStatus) || "Available",
    notes: vehicle?.notes || "",
    features: (vehicle?.features || []).join(", "),
  })

  function handleChange<K extends keyof typeof formData>(field: K, value: string) {
    setFormData(prev => ({ ...prev, [field]: value as never }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); toast.error("Not signed in"); return }

    const vehicleData = {
      user_id: user.id,
      stock_number: formData.stock_number,
      vin: formData.vin,
      rego: formData.rego,
      year: formData.year ? parseInt(formData.year) : new Date().getFullYear(),
      make: formData.make,
      model: formData.model,
      variant: formData.variant,
      body: formData.body || "Sedan",
      transmission: formData.transmission || "Auto",
      fuel: formData.fuel || "Petrol",
      colour: formData.colour,
      odometer: formData.odometer ? parseInt(formData.odometer) : 0,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
      acquisition_date: formData.acquisition_date || new Date().toISOString().split("T")[0],
      source: formData.source || "Auction",
      price: formData.price ? parseFloat(formData.price) : 0,
      recon_cost: formData.recon_cost ? parseFloat(formData.recon_cost) : 0,
      other_cost: formData.other_cost ? parseFloat(formData.other_cost) : 0,
      status: formData.status,
      notes: formData.notes,
      features: formData.features
        ? formData.features.split(",").map(s => s.trim()).filter(Boolean)
        : [],
      images,
      ppsr_checked: ppsrChecked,
    }

    const { error } = vehicle?.id
      ? await supabase.from("vehicles").update(vehicleData).eq("id", vehicle.id)
      : await supabase.from("vehicles").insert(vehicleData)

    setLoading(false)
    if (error) {
      toast.error(`Failed to save vehicle: ${error.message}`)
      return
    }
    toast.success(vehicle ? "Vehicle updated" : "Vehicle added")
    onSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          <DialogDescription>
            {vehicle ? "Update the vehicle details below" : "Enter the vehicle details below"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_number">Stock Number</Label>
                  <Input id="stock_number" value={formData.stock_number}
                    onChange={(e) => handleChange("stock_number", e.target.value)}
                    placeholder="e.g., STK001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rego">Registration</Label>
                  <Input id="rego" value={formData.rego}
                    onChange={(e) => handleChange("rego", e.target.value)}
                    placeholder="e.g., ABC123" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input id="vin" value={formData.vin}
                  onChange={(e) => handleChange("vin", e.target.value)}
                  placeholder="Vehicle Identification Number" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" value={formData.year}
                    onChange={(e) => handleChange("year", e.target.value)}
                    placeholder="e.g., 2020" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input id="make" value={formData.make}
                    onChange={(e) => handleChange("make", e.target.value)}
                    placeholder="e.g., Toyota" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={formData.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    placeholder="e.g., Camry" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant">Variant</Label>
                  <Input id="variant" value={formData.variant}
                    onChange={(e) => handleChange("variant", e.target.value)}
                    placeholder="e.g., SL, GXL AWD" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="body">Body Type</Label>
                  <Select value={formData.body} onValueChange={(v) => handleChange("body", v)}>
                    <SelectTrigger><SelectValue placeholder="Select body type" /></SelectTrigger>
                    <SelectContent>
                      {bodyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmission</Label>
                  <Select value={formData.transmission} onValueChange={(v) => handleChange("transmission", v)}>
                    <SelectTrigger><SelectValue placeholder="Select transmission" /></SelectTrigger>
                    <SelectContent>
                      {transmissions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuel">Fuel</Label>
                  <Select value={formData.fuel} onValueChange={(v) => handleChange("fuel", v)}>
                    <SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                    <SelectContent>
                      {fuelTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colour">Colour</Label>
                  <Input id="colour" value={formData.colour}
                    onChange={(e) => handleChange("colour", e.target.value)}
                    placeholder="e.g., White" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="odometer">Odometer (km)</Label>
                  <Input id="odometer" type="number" value={formData.odometer}
                    onChange={(e) => handleChange("odometer", e.target.value)}
                    placeholder="e.g., 50000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange("status", v as VehicleStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features <span className="text-xs text-muted-foreground">(comma-separated)</span></Label>
                <Input id="features" value={formData.features}
                  onChange={(e) => handleChange("features", e.target.value)}
                  placeholder="e.g., Leather, Sunroof, Reversing camera, Bluetooth" />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                  <Input id="purchase_price" type="number" value={formData.purchase_price}
                    onChange={(e) => handleChange("purchase_price", e.target.value)}
                    placeholder="e.g., 15000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acquisition_date">Acquired Date</Label>
                  <Input id="acquisition_date" type="date" value={formData.acquisition_date}
                    onChange={(e) => handleChange("acquisition_date", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input id="source" value={formData.source}
                  onChange={(e) => handleChange("source", e.target.value)}
                  placeholder="e.g., Auction, Trade-in, Private" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Asking Price ($)</Label>
                  <Input id="price" type="number" value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="e.g., 20000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recon_cost">Recon Cost ($)</Label>
                  <Input id="recon_cost" type="number" value={formData.recon_cost}
                    onChange={(e) => handleChange("recon_cost", e.target.value)}
                    placeholder="repairs, RWC" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other_cost">Other ($)</Label>
                  <Input id="other_cost" type="number" value={formData.other_cost}
                    onChange={(e) => handleChange("other_cost", e.target.value)}
                    placeholder="transport, ads" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4 mt-4">
              <VehicleImageUploader
                images={images}
                vehicleKey={uploadKey}
                onChange={setImages}
              />
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  id="ppsr_checked"
                  type="checkbox"
                  checked={ppsrChecked}
                  onChange={(e) => setPpsrChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="ppsr_checked" className="cursor-pointer text-sm font-normal">
                  PPSR check completed for this vehicle
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Any additional notes about this vehicle..."
                  className="min-h-[200px]" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {vehicle ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
