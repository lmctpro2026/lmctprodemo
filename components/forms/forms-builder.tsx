"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateVehicleTitle, formatCurrency, formatDate } from "@/lib/utils"
import type { Vehicle, Customer, Profile } from "@/lib/types"
import { Printer, Car, Users } from "lucide-react"

interface FormsBuilderProps {
  vehicles: Vehicle[]
  customers: Customer[]
  profile: Profile | null
}

export function FormsBuilder({ vehicles, customers, profile }: FormsBuilderProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const today = new Date().toLocaleDateString("en-AU")

  return (
    <Tabs defaultValue="transfer" className="space-y-6">
      <TabsList>
        <TabsTrigger value="transfer">Transfer Form</TabsTrigger>
        <TabsTrigger value="contract">Sale Contract</TabsTrigger>
        <TabsTrigger value="invoice">Tax Invoice</TabsTrigger>
      </TabsList>

      {/* Selection Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              Select Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedVehicle?.id || ""}
              onValueChange={(id) => setSelectedVehicle(vehicles.find(v => v.id === id) || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {generateVehicleTitle(v)} - {v.rego || "No rego"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCustomer?.id || ""}
              onValueChange={(id) => setSelectedCustomer(customers.find(c => c.id === id) || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Form */}
      <TabsContent value="transfer">
        <Card>
          <CardHeader>
            <CardTitle>VicRoads Transfer of Registration</CardTitle>
            <CardDescription>
              Form for transferring vehicle registration to new owner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-white text-black print:shadow-none">
              <div className="text-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold">APPLICATION TO TRANSFER REGISTRATION</h2>
                <p className="text-sm text-gray-600">VicRoads Form</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2 border-b pb-1">SELLER DETAILS (DEALER)</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Name:</span> {profile?.dealer_name || "_______________"}</p>
                    <p><span className="text-gray-600">LMCT:</span> {profile?.lmct || "_______________"}</p>
                    <p><span className="text-gray-600">ABN:</span> {profile?.abn || "_______________"}</p>
                    <p><span className="text-gray-600">Address:</span> {profile?.address || "_______________"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 border-b pb-1">BUYER DETAILS</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Name:</span> {selectedCustomer?.name || "_______________"}</p>
                    <p><span className="text-gray-600">Address:</span> {selectedCustomer?.address || "_______________"}</p>
                    <p><span className="text-gray-600">License No:</span> {selectedCustomer?.license || "_______________"}</p>
                    <p><span className="text-gray-600">DOB:</span> {selectedCustomer?.date_of_birth ? formatDate(selectedCustomer.date_of_birth) : "_______________"}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2 border-b pb-1">VEHICLE DETAILS</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <p><span className="text-gray-600">Registration:</span> {selectedVehicle?.rego || "_______________"}</p>
                  <p><span className="text-gray-600">VIN:</span> {selectedVehicle?.vin || "_______________"}</p>
                  <p><span className="text-gray-600">Year:</span> {selectedVehicle?.year || "_______________"}</p>
                  <p><span className="text-gray-600">Make:</span> {selectedVehicle?.make || "_______________"}</p>
                  <p><span className="text-gray-600">Model:</span> {selectedVehicle?.model || "_______________"}</p>
                  <p><span className="text-gray-600">Body:</span> {selectedVehicle?.body || "_______________"}</p>
                  <p><span className="text-gray-600">Colour:</span> {selectedVehicle?.colour || "_______________"}</p>
                  <p><span className="text-gray-600">Odometer:</span> {selectedVehicle?.odometer ? `${selectedVehicle.odometer.toLocaleString()} km` : "_______________"}</p>
                  <p><span className="text-gray-600">Date:</span> {today}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600 mb-8">Seller Signature:</p>
                  <div className="border-b border-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-500">Date: _______________</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-8">Buyer Signature:</p>
                  <div className="border-b border-gray-400 mb-1"></div>
                  <p className="text-xs text-gray-500">Date: _______________</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Contract */}
      <TabsContent value="contract">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Sale Contract</CardTitle>
            <CardDescription>
              Contract of sale between dealer and buyer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-white text-black print:shadow-none">
              <div className="text-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold">MOTOR VEHICLE SALE CONTRACT</h2>
                <p className="text-sm text-gray-600">Date: {today}</p>
              </div>

              <div className="space-y-4 text-sm">
                <p>
                  This contract is made between <strong>{profile?.dealer_name || "[DEALER NAME]"}</strong> (Seller)
                  and <strong>{selectedCustomer?.name || "[BUYER NAME]"}</strong> (Buyer).
                </p>

                <div className="border p-4 rounded">
                  <h4 className="font-semibold mb-2">Vehicle Details:</h4>
                  <p>Year/Make/Model: {selectedVehicle ? generateVehicleTitle(selectedVehicle) : "[VEHICLE]"}</p>
                  <p>Registration: {selectedVehicle?.rego || "[REGO]"}</p>
                  <p>VIN: {selectedVehicle?.vin || "[VIN]"}</p>
                  <p>Odometer: {selectedVehicle?.odometer ? `${selectedVehicle.odometer.toLocaleString()} km` : "[ODOMETER]"}</p>
                </div>

                <div className="border p-4 rounded">
                  <h4 className="font-semibold mb-2">Sale Price:</h4>
                  <p className="text-lg">{formatCurrency(selectedVehicle?.price || 0)}</p>
                  <p className="text-xs text-gray-500">(Inclusive of GST where applicable)</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Terms and Conditions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>The vehicle is sold as inspected by the Buyer.</li>
                    <li>Transfer of ownership occurs upon full payment.</li>
                    <li>The Seller warrants they have the right to sell this vehicle.</li>
                    <li>The Buyer acknowledges receipt of all relevant documentation.</li>
                    <li>This contract is governed by the laws of Victoria, Australia.</li>
                  </ol>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-8 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600 mb-8">Seller Signature:</p>
                    <div className="border-b border-gray-400 mb-1"></div>
                    <p className="text-xs">{profile?.dealer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-8">Buyer Signature:</p>
                    <div className="border-b border-gray-400 mb-1"></div>
                    <p className="text-xs">{selectedCustomer?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Contract
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Invoice */}
      <TabsContent value="invoice">
        <Card>
          <CardHeader>
            <CardTitle>Tax Invoice</CardTitle>
            <CardDescription>
              Generate a tax invoice for vehicle sale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-white text-black print:shadow-none">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{profile?.dealer_name || "DEALER NAME"}</h2>
                  <p className="text-sm text-gray-600">{profile?.lmct}</p>
                  <p className="text-sm text-gray-600">ABN: {profile?.abn || "XX XXX XXX XXX"}</p>
                  <p className="text-sm text-gray-600">{profile?.address}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold">TAX INVOICE</h3>
                  <p className="text-sm text-gray-600">Date: {today}</p>
                  <p className="text-sm text-gray-600">Invoice #: INV-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              <div className="border-t border-b py-4 mb-4">
                <h4 className="font-semibold mb-1">Bill To:</h4>
                <p>{selectedCustomer?.name || "[Customer Name]"}</p>
                <p className="text-sm text-gray-600">{selectedCustomer?.address || "[Address]"}</p>
              </div>

              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">
                      {selectedVehicle ? generateVehicleTitle(selectedVehicle) : "[Vehicle]"}
                      <br />
                      <span className="text-sm text-gray-600">
                        Rego: {selectedVehicle?.rego || "[REGO]"} | VIN: {selectedVehicle?.vin || "[VIN]"}
                      </span>
                    </td>
                    <td className="text-right py-2">{formatCurrency(selectedVehicle?.price || 0)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td className="py-2 font-semibold">Total (Inc GST)</td>
                    <td className="text-right py-2 font-bold text-lg">{formatCurrency(selectedVehicle?.price || 0)}</td>
                  </tr>
                  <tr>
                    <td className="text-sm text-gray-600">GST Included</td>
                    <td className="text-right text-sm text-gray-600">
                      {formatCurrency((selectedVehicle?.price || 0) / 11)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="text-sm text-gray-600">
                <p>Payment Terms: Due on delivery</p>
                <p>Thank you for your business!</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
