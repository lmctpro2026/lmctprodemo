"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { Vehicle, Customer } from "@/lib/types"
import { Plus, Loader2 } from "lucide-react"
import { generateVehicleTitle } from "@/lib/utils"

interface AddSaleButtonProps {
  vehicles: Vehicle[]
  customers: Customer[]
}

export function AddSaleButton({ vehicles, customers }: AddSaleButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    vehicle_id: "",
    customer_id: "",
    sale_price: "",
    sale_date: new Date().toISOString().split("T")[0],
    settlement_date: "",
    payment_method: "",
    deposit_amount: "",
    warranty_type: "",
    warranty_months: "",
    notes: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      toast.error("Not signed in")
      return
    }

    const vehicle = vehicles.find(v => v.id === formData.vehicle_id)
    const customer = customers.find(c => c.id === formData.customer_id)
    if (!vehicle || !customer) {
      setLoading(false)
      toast.error("Vehicle or customer not found")
      return
    }

    const salePrice = parseFloat(formData.sale_price) || 0
    const totalCost = (vehicle.purchase_price || 0) + (vehicle.recon_cost || 0) + (vehicle.other_cost || 0)
    const profit = salePrice - totalCost
    const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0

    const saleData = {
      user_id: user.id,
      vehicle_id: vehicle.id,
      customer_id: customer.id,
      // Vehicle snapshot — survives vehicle deletion
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      rego: vehicle.rego || "",
      // Financials — computed from vehicle costs
      sale_price: salePrice,
      total_cost: totalCost,
      profit,
      margin: parseFloat(margin.toFixed(2)),
      // Buyer — copied from customer at point of sale
      buyer_name: customer.name,
      buyer_email: customer.email || "",
      buyer_phone: customer.phone || "",
      buyer_address: customer.address || "",
      buyer_license: customer.license || "",
      // Dates
      sale_date: formData.sale_date,
      settlement_date: formData.settlement_date || null,
      status: "Completed" as const,
      // Payment + warranty (added in scripts/003)
      payment_method: formData.payment_method,
      deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : 0,
      warranty_type: formData.warranty_type,
      warranty_months: formData.warranty_months ? parseInt(formData.warranty_months) : 0,
      notes: formData.notes,
    }

    const { data: insertedSale, error: saleError } = await supabase
      .from("sales")
      .insert(saleData)
      .select("id")
      .single()
    if (saleError) {
      setLoading(false)
      toast.error(`Sale insert failed: ${saleError.message}`)
      return
    }

    const { error: vehicleError } = await supabase
      .from("vehicles")
      .update({ status: "Sold" })
      .eq("id", vehicle.id)
    if (vehicleError) {
      setLoading(false)
      toast.error(`Sale saved, but vehicle status update failed: ${vehicleError.message}`)
      return
    }

    setLoading(false)
    setOpen(false)
    toast.success(`Sale recorded — profit ${profit >= 0 ? "+" : "−"}$${Math.abs(profit).toFixed(0)} (${margin.toFixed(1)}% margin)`)
    router.refresh()

    // Fire-and-forget the receipt email. Failures show a toast but don't
    // block the sale flow — the dealer can resend manually if needed.
    if (insertedSale?.id && customer.email) {
      void sendReceipt(insertedSale.id)
    }
  }

  async function sendReceipt(saleId: string) {
    try {
      const res = await fetch("/api/sales/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sale_id: saleId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(`Receipt not sent: ${data?.error || res.statusText}`)
        return
      }
      toast.success("Receipt emailed to buyer")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Receipt send failed: ${msg}`)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Record Sale
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
            <DialogDescription>Profit/margin/buyer details are computed and copied from the selected vehicle and customer.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(v) => setFormData(p => ({ ...p, vehicle_id: v }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {generateVehicleTitle(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(v) => setFormData(p => ({ ...p, customer_id: v }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale_price">Sale Price ($)</Label>
                <Input
                  id="sale_price"
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => setFormData(p => ({ ...p, sale_price: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_date">Sale Date</Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData(p => ({ ...p, sale_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(v) => setFormData(p => ({ ...p, payment_method: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="eft">EFT / Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Deposit ($)</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData(p => ({ ...p, deposit_amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warranty_type">Warranty</Label>
                <Select
                  value={formData.warranty_type}
                  onValueChange={(v) => setFormData(p => ({ ...p, warranty_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="dealer">Dealer warranty</SelectItem>
                    <SelectItem value="statutory">Statutory (VIC: ≥ 3mo / 5000km on cars under 10yr & 160k)</SelectItem>
                    <SelectItem value="extended">Extended (third party)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_months">Warranty Months</Label>
                <Input
                  id="warranty_months"
                  type="number"
                  value={formData.warranty_months}
                  onChange={(e) => setFormData(p => ({ ...p, warranty_months: e.target.value }))}
                  placeholder="e.g., 3"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settlement_date">Settlement Date (optional)</Label>
              <Input
                id="settlement_date"
                type="date"
                value={formData.settlement_date}
                onChange={(e) => setFormData(p => ({ ...p, settlement_date: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Record Sale
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
