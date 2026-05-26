"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { Customer } from "@/lib/types"
import { Loader2 } from "lucide-react"

const leadSources = ["Facebook", "Carsales", "Gumtree", "Walk-in", "Referral", "Repeat customer", "Website", "Other"]

interface CustomerDialogProps {
  customer?: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function CustomerDialog({ customer, open, onOpenChange, onSave }: CustomerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    license: customer?.license || "",
    date_of_birth: customer?.date_of_birth || "",
    interests: customer?.interests || "",
    notes: customer?.notes || "",
    hot: customer?.hot || false,
    lead_source: customer?.lead_source || "",
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

    const customerData = {
      user_id: user.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      license: formData.license,
      date_of_birth: formData.date_of_birth || null,
      interests: formData.interests,
      notes: formData.notes,
      hot: formData.hot,
      lead_source: formData.lead_source,
    }

    const { error } = customer?.id
      ? await supabase.from("customers").update(customerData).eq("id", customer.id)
      : await supabase.from("customers").insert(customerData)

    setLoading(false)
    if (error) {
      toast.error(`Failed to save customer: ${error.message}`)
      return
    }
    toast.success(customer ? "Customer updated" : "Customer added")
    onSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {customer ? "Update customer details" : "Enter customer information"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="0400 000 000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
              placeholder="Full address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={formData.license}
                onChange={(e) => setFormData(p => ({ ...p, license: e.target.value }))}
                placeholder="Driver license"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(p => ({ ...p, date_of_birth: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interests">Interests</Label>
              <Input
                id="interests"
                value={formData.interests}
                onChange={(e) => setFormData(p => ({ ...p, interests: e.target.value }))}
                placeholder="e.g. SUVs under $30k, low km"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead_source">Lead Source</Label>
              <Select
                value={formData.lead_source}
                onValueChange={(v) => setFormData(p => ({ ...p, lead_source: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              id="hot"
              type="checkbox"
              checked={formData.hot}
              onChange={(e) => setFormData(p => ({ ...p, hot: e.target.checked }))}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="hot" className="cursor-pointer text-sm font-normal">
              Hot lead — ready to buy soon
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {customer ? "Update" : "Add"} Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
