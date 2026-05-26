"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatCurrency, generateVehicleTitle } from "@/lib/utils"
import type { Vehicle } from "@/lib/types"
import { FileText, Copy, Check, Sparkles, Car } from "lucide-react"

interface ListingBuilderProps {
  vehicles: Vehicle[]
}

const listingTemplates = {
  professional: "Professional - Formal, detailed description",
  casual: "Casual - Friendly, conversational tone",
  minimal: "Minimal - Just the facts",
}

export function ListingBuilder({ vehicles }: ListingBuilderProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [template, setTemplate] = useState<string>("professional")
  const [generatedListing, setGeneratedListing] = useState("")
  const [copied, setCopied] = useState(false)

  function generateListing() {
    if (!selectedVehicle) return
    const v = selectedVehicle
    const title = generateVehicleTitle(v)
    let listing = ""

    if (template === "professional") {
      listing = `${title}

${v.price ? formatCurrency(v.price) : "Price on Application"}

We are pleased to offer this exceptional ${v.year} ${v.make} ${v.model}${v.variant ? ` ${v.variant}` : ""} for sale.

VEHICLE SPECIFICATIONS:
${v.year ? `- Year: ${v.year}` : ""}
${v.make ? `- Make: ${v.make}` : ""}
${v.model ? `- Model: ${v.model}` : ""}
${v.variant ? `- Variant: ${v.variant}` : ""}
${v.body ? `- Body Type: ${v.body}` : ""}
${v.transmission ? `- Transmission: ${v.transmission}` : ""}
${v.fuel ? `- Fuel Type: ${v.fuel}` : ""}
${v.colour ? `- Colour: ${v.colour}` : ""}
${v.odometer ? `- Odometer: ${v.odometer.toLocaleString()} km` : ""}
${v.rego ? `- Registration: ${v.rego}` : ""}

${v.features && v.features.length > 0 ? `FEATURES:\n${v.features.map(f => `- ${f}`).join("\n")}` : ""}

${v.notes ? `ADDITIONAL INFORMATION:\n${v.notes}` : ""}

Contact us today to arrange an inspection or test drive.

Stock #: ${v.stock_number || "N/A"}
LMCT Licensed Dealer`
    } else if (template === "casual") {
      listing = `${title} - ${v.price ? formatCurrency(v.price) : "Call for price"}

Hey there! Check out this beauty - a ${v.year} ${v.make} ${v.model}${v.variant ? ` ${v.variant}` : ""}.

Quick facts:
${v.odometer ? `✓ ${v.odometer.toLocaleString()} km on the clock` : ""}
${v.transmission ? `✓ ${v.transmission} transmission` : ""}
${v.fuel ? `✓ Runs on ${v.fuel.toLowerCase()}` : ""}
${v.colour ? `✓ Stunning ${v.colour.toLowerCase()} colour` : ""}

${v.notes ? v.notes : "This car is in great condition and ready for its new owner!"}

Give us a call or drop by for a test drive!

${v.stock_number ? `Ref: ${v.stock_number}` : ""}`
    } else {
      listing = `${title}
${v.price ? formatCurrency(v.price) : "POA"}

${v.year || ""} | ${v.odometer ? `${v.odometer.toLocaleString()} km` : ""} | ${v.transmission || ""} | ${v.fuel || ""}
Colour: ${v.colour || "N/A"}
Rego: ${v.rego || "N/A"}

${v.stock_number ? `Stock #${v.stock_number}` : ""}`
    }

    setGeneratedListing(listing.replace(/\n{3,}/g, "\n\n").trim())
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(generatedListing)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Configure Listing
          </CardTitle>
          <CardDescription>
            Select a vehicle and style to generate a listing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Vehicle</Label>
            <Select
              value={selectedVehicle?.id || ""}
              onValueChange={(id) => {
                setSelectedVehicle(vehicles.find(v => v.id === id) || null)
                setGeneratedListing("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available vehicles
                  </SelectItem>
                ) : (
                  vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {generateVehicleTitle(v)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Listing Style</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(listingTemplates).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVehicle && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-medium mb-2">Vehicle Preview</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p>{formatCurrency(selectedVehicle.price || 0)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Odometer:</span>
                  <p>{selectedVehicle.odometer ? `${selectedVehicle.odometer.toLocaleString()} km` : "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Trans:</span>
                  <p>{selectedVehicle.transmission || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fuel:</span>
                  <p>{selectedVehicle.fuel || "N/A"}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={generateListing}
            disabled={!selectedVehicle}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Listing
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Listing
          </CardTitle>
          <CardDescription>
            Copy and paste to your listing platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedListing ? (
            <>
              <Textarea
                value={generatedListing}
                onChange={(e) => setGeneratedListing(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <Button onClick={copyToClipboard} variant="outline" className="w-full">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a vehicle and generate a listing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
