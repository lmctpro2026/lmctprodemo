"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CustomerDialog } from "./customer-dialog"
import type { Customer } from "@/lib/types"
import { Users, Search, Edit, Trash2, Phone, Mail, Flame } from "lucide-react"

interface CustomersListProps {
  initialCustomers: Customer[]
  userId: string
}

async function fetchCustomers(userId: string): Promise<Customer[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return (data as Customer[]) || []
}

export function CustomersList({ initialCustomers, userId }: CustomersListProps) {
  const { data: customers, mutate } = useSWR(
    ["customers", userId],
    () => fetchCustomers(userId),
    { fallbackData: initialCustomers }
  )

  const [search, setSearch] = useState("")
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  ) || []

  async function handleDelete(customerId: string) {
    if (!confirm("Are you sure you want to delete this customer?")) return

    const supabase = createClient()
    const { error } = await supabase.from("customers").delete().eq("id", customerId)
    if (error) {
      toast.error(`Delete failed: ${error.message}`)
      return
    }
    toast.success("Customer deleted")
    mutate()
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {search ? "No customers match your search" : "No customers yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{customer.name}</h3>
                    {customer.hot && (
                      <Badge variant="destructive" className="mt-1 gap-1">
                        <Flame className="h-3 w-3" /> Hot lead
                      </Badge>
                    )}
                    {customer.interests && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {customer.interests}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingCustomer(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(customer.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${customer.phone}`} className="hover:text-foreground">
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${customer.email}`} className="hover:text-foreground truncate">
                        {customer.email}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingCustomer && (
        <CustomerDialog
          customer={editingCustomer}
          open={!!editingCustomer}
          onOpenChange={(open) => !open && setEditingCustomer(null)}
          onSave={() => {
            setEditingCustomer(null)
            mutate()
          }}
        />
      )}
    </div>
  )
}
