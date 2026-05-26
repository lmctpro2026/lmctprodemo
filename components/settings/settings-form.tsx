"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Profile } from "@/lib/types"
import { Loader2, Save, Building, Shield, Mail } from "lucide-react"

interface SettingsFormProps {
  profile: Profile | null
  userEmail: string
}

export function SettingsForm({ profile, userEmail }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    dealer_name: profile?.dealer_name || "",
    lmct: profile?.lmct || "",
    abn: profile?.abn || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    manager_pin: "",  // intentionally empty — never preload the hash
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

    // Update dealer-profile fields (everything except the PIN — that goes
    // through /api/pin so it can be hashed server-side).
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        dealer_name: formData.dealer_name,
        lmct: formData.lmct,
        abn: formData.abn,
        phone: formData.phone,
        address: formData.address,
      })
      .eq("id", user.id)

    if (profileError) {
      setLoading(false)
      toast.error(`Profile save failed: ${profileError.message}`)
      return
    }

    // If user entered a new PIN, hash it server-side
    if (formData.manager_pin) {
      const r = await fetch("/api/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", pin: formData.manager_pin }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        setLoading(false)
        toast.error(`PIN save failed: ${j.error || "Unknown error"}`)
        return
      }
      // Clear the PIN field after successful save
      setFormData(p => ({ ...p, manager_pin: "" }))
    }

    setLoading(false)
    toast.success("Settings saved")
    router.refresh()
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile">Dealership Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Dealership Information
            </CardTitle>
            <CardDescription>
              Your dealership details for forms and documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dealer_name">Dealership Name</Label>
                  <Input
                    id="dealer_name"
                    value={formData.dealer_name}
                    onChange={(e) => setFormData(p => ({ ...p, dealer_name: e.target.value }))}
                    placeholder="Your Dealership Pty Ltd"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lmct">LMCT Number</Label>
                  <Input
                    id="lmct"
                    value={formData.lmct}
                    onChange={(e) => setFormData(p => ({ ...p, lmct: e.target.value }))}
                    placeholder="LMCT 12345"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="abn">ABN</Label>
                  <Input
                    id="abn"
                    value={formData.abn}
                    onChange={(e) => setFormData(p => ({ ...p, abn: e.target.value }))}
                    placeholder="XX XXX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(03) XXXX XXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                  placeholder="123 Main Street, Melbourne VIC 3000"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manager PIN and access controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manager_pin">Manager PIN</Label>
                <Input
                  id="manager_pin"
                  type="password"
                  value={formData.manager_pin}
                  onChange={(e) => setFormData(p => ({ ...p, manager_pin: e.target.value }))}
                  placeholder="Enter 4–12 character PIN to set or change"
                  maxLength={12}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Used to protect sensitive operations like editing prices. Hashed via SHA-256 + per-user salt before storage. Leave blank to keep your current PIN.
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save PIN
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={userEmail} disabled />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Danger Zone</h4>
              <p className="text-sm text-muted-foreground mb-4">
                These actions are permanent and cannot be undone
              </p>
              <Button variant="destructive" disabled>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
