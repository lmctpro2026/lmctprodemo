// Targeted probe — tries each old + new column name on each mismatched table
// to discover what's actually in the live schema. Plus row counts.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) { console.error("Missing env"); process.exit(1) }

const headers = { apikey: key, Authorization: `Bearer ${key}` }

async function tryCol(table, col) {
  const r = await fetch(`${url}/rest/v1/${table}?select=${col}&limit=0`, { headers })
  return r.ok
}

async function rowCount(table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=id`, {
    headers: { ...headers, Prefer: "count=exact" },
  })
  const range = r.headers.get("content-range") // "0-0/N" or "*/N"
  const m = range?.match(/\/(\d+|\*)$/)
  return m ? m[1] : "?"
}

const probes = {
  profiles: [
    "id", "dealer_name", "dealership_name", "lmct", "lmct_number",
    "abn", "acn", "address", "phone", "email", "website", "manager_pin",
    "warn_margin", "min_margin", "target_margin",
    "ai_name", "ai_personality", "ai_training",
  ],
  vehicles: [
    "id", "user_id",
    "make", "model", "year", "variant", "colour",
    "body", "body_type",
    "fuel", "fuel_type",
    "transmission", "odometer",
    "rego", "rego_expiry", "vin",
    "price", "asking_price",
    "purchase_price",
    "recon_cost", "other_cost", "expenses",
    "source", "purchase_source",
    "acquisition_date", "purchase_date", "date_acquired",
    "status", "score", "notes",
    "stock_number", "engine", "doors", "seats", "floor_price",
    "features", "images",
  ],
  customers: [
    "id", "user_id",
    "name", "phone", "email", "address",
    "license", "license_number",
    "date_of_birth",
    "interests", "notes",
    "hot", "type", "status",
  ],
  sales: [
    "id", "user_id", "vehicle_id", "customer_id",
    "make", "model", "year", "rego",
    "sale_price", "total_cost",
    "profit", "gross_profit",
    "margin", "margin_percent",
    "buyer_name", "buyer_first", "buyer_last",
    "buyer_email", "buyer_phone", "buyer_address", "buyer_license",
    "customer_name", "vehicle_description",
    "sale_date", "settlement_date", "status", "notes",
    "payment_method", "deposit_amount",
    "warranty_type", "warranty_months",
  ],
}

for (const [table, cols] of Object.entries(probes)) {
  const present = []
  const missing = []
  for (const c of cols) {
    if (await tryCol(table, c)) present.push(c)
    else missing.push(c)
  }
  const count = await rowCount(table)
  console.log(`\n${table} (rows: ${count})`)
  console.log(`  PRESENT: ${present.join(", ")}`)
  console.log(`  ABSENT:  ${missing.join(", ")}`)
}
