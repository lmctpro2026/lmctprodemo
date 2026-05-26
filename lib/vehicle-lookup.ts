// Plate-to-vehicle-data abstraction.
//
// CURRENT STATE: stub. Returns synthetic but plausible data based on the rego
// format, so the UI (scanner, "Quick add by rego") can be built and tested
// without a paid API key.
//
// TO GO LIVE: replace the body of `lookupVehicleByRego` with a fetch to a
// vendor (AutoGrab is the recommended starting point — best Aussie coverage,
// ~$1–3 per lookup). Keep the return shape stable so the UI doesn't change.
//
// USAGE:
//   const data = await lookupVehicleByRego("ABC123")
//   if (data) { /* prefill VehicleDialog */ }

export interface VehicleLookupResult {
  rego: string
  make: string
  model: string
  variant: string
  year: number
  body: string
  transmission: string
  fuel: string
  colour: string
  vin: string
  odometer: number | null   // null if vendor doesn't provide
  // Pricing intelligence (vendor-dependent)
  redbookRetail: number | null
  redbookTradeIn: number | null
  // Safety / status checks
  hasFinancialEncumbrance: boolean | null
  isWriteOff: boolean | null
  isStolen: boolean | null
  // Provenance
  source: "stub" | "autograb" | "carcheck" | "regcheckau" | "vicroads"
  fetchedAt: string  // ISO timestamp
}

// Stable list of makes/bodies/fuels so the stub returns something realistic.
const MAKES = ["Toyota", "Mazda", "Hyundai", "Ford", "Holden", "Kia", "Honda", "Nissan", "Mitsubishi", "Subaru"]
const MODELS: Record<string, string[]> = {
  Toyota:     ["Camry", "Corolla", "RAV4", "HiLux", "Kluger", "Yaris"],
  Mazda:      ["3", "CX-5", "CX-3", "6", "BT-50"],
  Hyundai:    ["i30", "Tucson", "Kona", "Santa Fe", "Accent"],
  Ford:       ["Ranger", "Focus", "Everest", "Mustang", "Escape"],
  Holden:     ["Commodore", "Astra", "Captiva", "Trax", "Colorado"],
  Kia:        ["Cerato", "Sportage", "Sorento", "Rio", "Picanto"],
  Honda:      ["Civic", "Accord", "CR-V", "HR-V", "Jazz"],
  Nissan:     ["X-Trail", "Navara", "Qashqai", "Patrol", "Pulsar"],
  Mitsubishi: ["Triton", "Outlander", "ASX", "Pajero", "Lancer"],
  Subaru:     ["Forester", "Outback", "Impreza", "XV", "Liberty"],
}
const BODIES = ["Sedan", "Hatchback", "SUV", "Wagon", "Ute"]
const FUELS = ["Petrol", "Diesel", "Hybrid"]
const TRANS = ["Automatic", "Manual"]
const COLOURS = ["White", "Black", "Silver", "Blue", "Grey", "Red"]

// Deterministic pseudo-random from rego string so the same plate always
// returns the same fake vehicle — better DX than a coin-flip on every call.
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

export async function lookupVehicleByRego(
  rawRego: string,
): Promise<VehicleLookupResult | null> {
  const rego = rawRego.trim().toUpperCase().replace(/\s+/g, "")
  if (rego.length < 3 || rego.length > 8) return null

  // ── STUB IMPLEMENTATION ──────────────────────────────────────────────
  // Swap this entire block for a real vendor call. Keep the return shape.
  //
  // Example (AutoGrab):
  //   const r = await fetch(`https://api.autograb.com.au/v1/vehicles/lookup`, {
  //     method: "POST",
  //     headers: {
  //       "Authorization": `Bearer ${process.env.AUTOGRAB_API_KEY!}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ rego, state: "VIC" }),
  //   })
  //   if (!r.ok) return null
  //   const data = await r.json()
  //   return { rego, make: data.make, model: data.model, ... source: "autograb", ... }

  const seed = hash(rego)
  const make = pick(MAKES, seed)
  const modelList = MODELS[make]
  const model = pick(modelList, seed >> 3)
  const year = 2015 + (seed % 10)             // 2015–2024
  const odometer = 20000 + ((seed >> 5) % 180000)  // 20k–200k
  const purchaseEst = 8000 + ((seed >> 7) % 35000) // 8k–43k

  return {
    rego,
    make,
    model,
    variant: "",
    year,
    body: pick(BODIES, seed >> 11),
    transmission: pick(TRANS, seed >> 13),
    fuel: pick(FUELS, seed >> 15),
    colour: pick(COLOURS, seed >> 17),
    vin: "",                                   // vendor would provide
    odometer,
    redbookRetail: Math.round(purchaseEst * 1.18),
    redbookTradeIn: Math.round(purchaseEst * 0.95),
    hasFinancialEncumbrance: null,
    isWriteOff: null,
    isStolen: null,
    source: "stub",
    fetchedAt: new Date().toISOString(),
  }
}
