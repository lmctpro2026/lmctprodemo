// One-off probe — verifies which tables/columns exist in the live Supabase
// project pointed to by .env.local. Discarded after use.
//
// Usage:  node --env-file=.env.local scripts/probe-schema.mjs

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const expected = {
  profiles:       ["id", "dealer_name", "lmct", "abn", "ai_name", "manager_pin"],
  vehicles:       ["id", "user_id", "make", "model", "year", "body", "fuel", "price",
                   "purchase_price", "recon_cost", "other_cost", "source",
                   "acquisition_date", "status", "rego", "images"],
  customers:      ["id", "user_id", "name", "phone", "email", "hot", "interests"],
  sales:          ["id", "user_id", "vehicle_id", "customer_id", "make", "model",
                   "year", "rego", "sale_price", "total_cost", "profit", "margin",
                   "buyer_name", "buyer_email", "sale_date", "settlement_date"],
  tasks:          ["id", "user_id", "title", "status", "priority", "due_date"],
  chat_history:   ["id", "user_id", "role", "content"],
  email_settings: ["id", "user_id", "api_key", "sender_email", "sender_name"],
}

console.log(`Probing ${url}\n`)

for (const [table, cols] of Object.entries(expected)) {
  // Try to select just the expected columns, limit 1 — if any column missing,
  // PostgREST returns a 400 telling us exactly which column doesn't exist.
  const sel = cols.join(",")
  const { error } = await supabase.from(table).select(sel).limit(1)
  if (error) {
    console.log(`✗ ${table}: ${error.code || ""} ${error.message}`)
  } else {
    console.log(`✓ ${table}: all ${cols.length} expected columns present`)
  }
}
