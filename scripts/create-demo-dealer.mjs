/**
 * Provision a demo dealer account end-to-end + seed realistic stock and sales.
 *
 *   node --env-file=.env.local scripts/create-demo-dealer.mjs
 *
 * Mirrors create-founder.mjs but creates a role='dealer' user whose yard is
 * pre-loaded so the founder's /admin dashboards show real numbers and the
 * dealer's own /dashboard shows a working business — not a tutorial.
 *
 * Safe to re-run. On re-run:
 *   - Password is reset and email is re-confirmed.
 *   - All vehicles + sales for THIS user are deleted and re-seeded fresh.
 *   - Other dealers' data is never touched.
 */

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.")
  console.error("Run with: node --env-file=.env.local scripts/create-demo-dealer.mjs")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL    = "dealer.demo@lmctpro.com.au"
const PASSWORD = "DemoDealer@2026"

const PROFILE = {
  dealer_name: "Westside Motors",
  lmct:        "LMCT 12894",
  abn:         "47 624 819 305",
  phone:       "(03) 9687 4421",
  address:     "412 Barkly Street, Footscray VIC 3011",
  ai_name:     "MAX",
  ai_personality: "direct",
  ai_training: [
    "Westside Motors — Footscray family yard, 25-40 cars on lot at any time.",
    "Focus: Japanese SUVs, mid-size sedans, dual-cab utes. Avoid European unless under 50k km and full service history.",
    "Target margin 16% per car, never below 9%. Walk away from anything that needs more than $2k in recon.",
    "Most stock from Pickles Altona and Manheim Laverton on Tuesday auctions. Private trades welcome — usually 8-12% better margin.",
    "Open inspection Saturday 9-3. Quotes go out Friday afternoon. PPSR and roadworthy always before listing.",
  ].join(" "),
}

const log  = (...a) => console.log("  ", ...a)
const fail = (msg) => { console.error("✗", msg); process.exit(1) }

console.log(`\nProvisioning demo dealer for ${EMAIL}…\n`)

/* ─── 1. Schema check ──────────────────────────────────────────────── */
const { error: schemaErr } = await supabase.from("profiles").select("role").limit(1)
if (schemaErr) {
  if (String(schemaErr.message || "").toLowerCase().includes("role")) {
    fail("scripts/004_add_admin_roles.sql hasn't been applied yet. Apply it first.")
  }
  fail(`Schema check failed: ${schemaErr.message}`)
}
log("✓ profiles.role column present")

/* ─── 2. Create or update auth user ────────────────────────────────── */
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 })
if (listErr) fail(`listUsers failed: ${listErr.message}`)
const existing = list.users.find((u) => u.email === EMAIL)

let userId
if (existing) {
  log(`◦ User exists (id ${existing.id}). Resetting password + confirming email…`)
  const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  })
  if (updErr) fail(`updateUserById failed: ${updErr.message}`)
  userId = existing.id
} else {
  log("◦ Creating dealer user via Supabase Admin API…")
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  })
  if (createErr) fail(`createUser failed: ${createErr.message}`)
  userId = created.user.id
  log(`✓ Created user (id ${userId})`)
  await new Promise((r) => setTimeout(r, 1200))
}

/* ─── 3. Ensure profile row + set fields + role='dealer' ───────────── */
const { data: profileCheck } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", userId)
  .maybeSingle()

if (!profileCheck) {
  log("◦ profiles row not found, inserting manually…")
  const { error: insErr } = await supabase.from("profiles").insert({
    id: userId,
    email: EMAIL,
    ...PROFILE,
    role: "dealer",
  })
  if (insErr) fail(`profile insert failed: ${insErr.message}`)
} else {
  log("◦ Updating profile fields + role='dealer'…")
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ ...PROFILE, role: "dealer" })
    .eq("id", userId)
  if (updErr) fail(`profile update failed: ${updErr.message}`)
}

/* ─── 4. Wipe prior seed data for THIS user only ───────────────────── */
log("◦ Wiping prior seed data for this dealer (idempotent)…")
const { error: salesDelErr } = await supabase.from("sales").delete().eq("user_id", userId)
if (salesDelErr) fail(`wipe sales failed: ${salesDelErr.message}`)
const { error: vehiclesDelErr } = await supabase.from("vehicles").delete().eq("user_id", userId)
if (vehiclesDelErr) fail(`wipe vehicles failed: ${vehiclesDelErr.message}`)

/* ─── 5. Seed vehicles ─────────────────────────────────────────────── */
const today = new Date()
function daysAgo(n) {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}

// 25 vehicles: 18 Available, 5 Sold, 2 Reserved. Mixed body / make / age.
const VEHICLES = [
  // Available — fresh (<30 days)
  { make: "Toyota",   model: "RAV4 Cruiser",    year: 2022, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "White",   km: 38400,  rego: "1AB2CD", source: "Auction", buy: 35500, ask: 41750, age: 6,  status: "Available" },
  { make: "Mazda",    model: "CX-5 Touring",    year: 2021, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "Silver",  km: 51200,  rego: "1XY9ZK", source: "Auction", buy: 27800, ask: 32990, age: 11, status: "Available" },
  { make: "Toyota",   model: "HiLux SR5",       year: 2020, body: "Ute",       fuel: "Diesel",  trans: "Automatic", colour: "Grey",    km: 64500,  rego: "1HLX22", source: "Trade",   buy: 41000, ask: 47990, age: 14, status: "Available" },
  { make: "Ford",     model: "Ranger XLT",      year: 2021, body: "Ute",       fuel: "Diesel",  trans: "Automatic", colour: "Blue",    km: 58800,  rego: "FRD831", source: "Auction", buy: 44200, ask: 52500, age: 8,  status: "Available" },
  { make: "Hyundai",  model: "Tucson Elite",    year: 2021, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "Red",     km: 47200,  rego: "TUC108", source: "Private", buy: 24500, ask: 29990, age: 17, status: "Available" },
  // Available — 30-60 days (warm warning, not yet aged-60)
  { make: "Toyota",   model: "Camry Ascent",    year: 2019, body: "Sedan",     fuel: "Petrol",  trans: "Automatic", colour: "Silver",  km: 78600,  rego: "CAM442", source: "Auction", buy: 19500, ask: 23990, age: 35, status: "Available" },
  { make: "Mazda",    model: "3 Maxx",          year: 2020, body: "Hatchback", fuel: "Petrol",  trans: "Automatic", colour: "Black",   km: 56400,  rego: "MZD710", source: "Auction", buy: 18200, ask: 22500, age: 41, status: "Available" },
  { make: "Honda",    model: "CR-V VTi",        year: 2019, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "White",   km: 89200,  rego: "HND552", source: "Trade",   buy: 21000, ask: 25990, age: 48, status: "Available" },
  { make: "Kia",      model: "Cerato S",        year: 2020, body: "Sedan",     fuel: "Petrol",  trans: "Automatic", colour: "Grey",    km: 62400,  rego: "KIA918", source: "Auction", buy: 16500, ask: 20990, age: 52, status: "Available" },
  { make: "Toyota",   model: "Corolla Ascent",  year: 2018, body: "Hatchback", fuel: "Petrol",  trans: "Automatic", colour: "Silver",  km: 92800,  rego: "COR221", source: "Private", buy: 14200, ask: 18500, age: 56, status: "Available" },
  // Available — aged 60+ (the founder admin should flag these)
  { make: "Mitsubishi", model: "Outlander LS",  year: 2018, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "White",   km: 102400, rego: "OUT883", source: "Auction", buy: 17000, ask: 21500, age: 67, status: "Available" },
  { make: "Holden",   model: "Commodore VF",    year: 2017, body: "Sedan",     fuel: "Petrol",  trans: "Automatic", colour: "Black",   km: 118600, rego: "HOL331", source: "Trade",   buy: 14500, ask: 19990, age: 81, status: "Available" },
  { make: "Volkswagen", model: "Tiguan 132TSI", year: 2017, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "Grey",    km: 96800,  rego: "VWT705", source: "Auction", buy: 16800, ask: 21990, age: 92, status: "Available" },
  { make: "Subaru",   model: "Forester 2.5i",   year: 2018, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "Bronze",  km: 88400,  rego: "SUB119", source: "Private", buy: 18500, ask: 23500, age: 105, status: "Available" },
  { make: "Nissan",   model: "Navara ST",       year: 2016, body: "Ute",       fuel: "Diesel",  trans: "Manual",    colour: "White",   km: 142000, rego: "NAV480", source: "Trade",   buy: 18500, ask: 24500, age: 124, status: "Available" },
  // More fresh-ish Available to bulk the available list
  { make: "Toyota",   model: "Kluger GX",       year: 2021, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "White",   km: 49600,  rego: "KLG621", source: "Auction", buy: 38000, ask: 44990, age: 22, status: "Available" },
  { make: "Ford",     model: "Escape ZG",       year: 2020, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "Blue",    km: 61200,  rego: "ESC774", source: "Auction", buy: 22500, ask: 27990, age: 28, status: "Available" },
  { make: "Mazda",    model: "BT-50 XT",        year: 2019, body: "Ute",       fuel: "Diesel",  trans: "Automatic", colour: "Silver",  km: 87300,  rego: "BT5066", source: "Auction", buy: 28500, ask: 34500, age: 19, status: "Available" },
  // Reserved
  { make: "Toyota",   model: "LandCruiser GXL", year: 2020, body: "SUV",       fuel: "Diesel",  trans: "Automatic", colour: "White",   km: 64800,  rego: "LC2280", source: "Trade",   buy: 78000, ask: 92500, age: 12, status: "Reserved" },
  { make: "Mercedes-Benz", model: "C300",       year: 2018, body: "Sedan",     fuel: "Petrol",  trans: "Automatic", colour: "Black",   km: 73200,  rego: "MB5512", source: "Private", buy: 28500, ask: 36900, age: 25, status: "Reserved" },
  // Sold (need to also have matching sales records)
  { make: "Hyundai",  model: "i30 Active",      year: 2020, body: "Hatchback", fuel: "Petrol",  trans: "Automatic", colour: "Red",     km: 52800,  rego: "I30412", source: "Auction", buy: 17500, ask: 21500, age: 75, status: "Sold" },
  { make: "Toyota",   model: "Yaris SX",        year: 2019, body: "Hatchback", fuel: "Petrol",  trans: "Automatic", colour: "Silver",  km: 68400,  rego: "YAR903", source: "Private", buy: 13500, ask: 16990, age: 88, status: "Sold" },
  { make: "Ford",     model: "Ranger XL",       year: 2018, body: "Ute",       fuel: "Diesel",  trans: "Manual",    colour: "Grey",    km: 102500, rego: "RNG228", source: "Trade",   buy: 31000, ask: 37500, age: 102, status: "Sold" },
  { make: "Mazda",    model: "CX-3 Maxx",       year: 2019, body: "SUV",       fuel: "Petrol",  trans: "Automatic", colour: "White",   km: 71600,  rego: "CX3471", source: "Auction", buy: 18500, ask: 22990, age: 110, status: "Sold" },
  { make: "Toyota",   model: "Corolla Hybrid",  year: 2020, body: "Hatchback", fuel: "Hybrid",  trans: "Automatic", colour: "Blue",    km: 44200,  rego: "COR998", source: "Auction", buy: 22500, ask: 27500, age: 65, status: "Sold" },
]

log(`◦ Inserting ${VEHICLES.length} vehicles…`)
const vehicleRows = VEHICLES.map((v) => ({
  user_id: userId,
  make: v.make,
  model: v.model,
  year: v.year,
  variant: "",
  body: v.body,
  fuel: v.fuel,
  transmission: v.trans,
  colour: v.colour,
  odometer: v.km,
  rego: v.rego,
  vin: "",
  status: v.status,
  source: v.source,
  purchase_price: v.buy,
  price: v.ask,
  recon_cost: 0,
  other_cost: 0,
  acquisition_date: daysAgo(v.age),
  notes: "Seeded by create-demo-dealer.mjs",
  features: [],
}))

const { data: insertedVehicles, error: vehInsErr } = await supabase
  .from("vehicles")
  .insert(vehicleRows)
  .select("id, rego, make, model, year, body, status, price, purchase_price, acquisition_date")

if (vehInsErr) fail(`vehicle insert failed: ${vehInsErr.message}`)
log(`✓ ${insertedVehicles.length} vehicles inserted`)

/* ─── 6. Seed sales — one per Sold vehicle, plus a few extra older ones */
const soldVehicles = insertedVehicles.filter((v) => v.status === "Sold")
log(`◦ Inserting ${soldVehicles.length} sales tied to Sold vehicles + 7 standalone snapshots…`)

const BUYERS = [
  { name: "Emma Sutherland", email: "emma.s@example.com", phone: "0412 884 211", suburb: "Williamstown" },
  { name: "Marcus Chen",     email: "m.chen@example.com", phone: "0438 552 109", suburb: "Yarraville" },
  { name: "Priya Naidu",     email: "p.naidu@example.com",phone: "0421 776 488", suburb: "Sunshine" },
  { name: "Daniel O'Brien",  email: "d.obrien@example.com",phone: "0490 311 207", suburb: "Altona" },
  { name: "Aisha Rahman",    email: "a.rahman@example.com",phone: "0455 901 632", suburb: "Maidstone" },
  { name: "Liam Petrakis",   email: "l.petrakis@example.com",phone: "0419 442 855", suburb: "Footscray" },
]

function pickBuyer(i) { return BUYERS[i % BUYERS.length] }

// Sales tied to Sold vehicles — sale_date roughly when status flipped.
const salesFromSold = soldVehicles.map((v, i) => {
  const buyer = pickBuyer(i)
  // Sale happened ~7 days after acquisition for fresh sells, less for aged.
  const ageOnAcquisition = (new Date() - new Date(v.acquisition_date)) / 86400000
  const soldAfter = ageOnAcquisition > 60 ? ageOnAcquisition - 8 : Math.max(3, ageOnAcquisition - 4)
  const saleDate = daysAgo(Math.round(soldAfter > ageOnAcquisition ? ageOnAcquisition : ageOnAcquisition - soldAfter))
  const totalCost = Number(v.purchase_price) + 200 // small recon stub
  const salePrice = Math.round(Number(v.price) * (0.95 + (i * 0.013))) // 95-100%
  const profit = salePrice - totalCost
  const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0
  return {
    user_id: userId,
    vehicle_id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    rego: v.rego,
    sale_price: salePrice,
    total_cost: totalCost,
    profit,
    margin: Math.round(margin * 10) / 10,
    buyer_name: buyer.name,
    buyer_email: buyer.email,
    buyer_phone: buyer.phone,
    buyer_address: `${buyer.suburb}, VIC`,
    sale_date: saleDate,
    settlement_date: saleDate,
    status: "Completed",
    payment_method: "Bank transfer",
    warranty_type: "Statutory",
    warranty_months: 3,
    notes: "Seeded by create-demo-dealer.mjs",
  }
})

// Standalone sales — snapshots without a linked vehicle (vehicles get
// deleted over time but sales preserve the make/model snapshot).
const SNAPSHOTS = [
  { make: "Toyota",  model: "RAV4",       year: 2019, rego: "OLD118", sale_price: 31500, total_cost: 27200, daysOld: 12 },
  { make: "Ford",    model: "Mustang GT", year: 2018, rego: "MST551", sale_price: 48500, total_cost: 42100, daysOld: 24 },
  { make: "Mazda",   model: "CX-9",       year: 2019, rego: "CX9601", sale_price: 38900, total_cost: 33600, daysOld: 31 },
  { make: "Subaru",  model: "Outback",    year: 2018, rego: "OUT220", sale_price: 26500, total_cost: 22700, daysOld: 44 },
  { make: "Toyota",  model: "Prado",      year: 2017, rego: "PRA445", sale_price: 51500, total_cost: 45200, daysOld: 58 },
  { make: "Hyundai", model: "Santa Fe",   year: 2019, rego: "STF888", sale_price: 32500, total_cost: 28100, daysOld: 67 },
  { make: "Mitsubishi", model: "Triton",  year: 2018, rego: "TRI119", sale_price: 28900, total_cost: 24500, daysOld: 84 },
]

const standaloneSales = SNAPSHOTS.map((s, i) => {
  const profit = s.sale_price - s.total_cost
  const margin = (profit / s.total_cost) * 100
  const buyer = pickBuyer(i + 3)
  return {
    user_id: userId,
    vehicle_id: null,
    make: s.make,
    model: s.model,
    year: s.year,
    rego: s.rego,
    sale_price: s.sale_price,
    total_cost: s.total_cost,
    profit,
    margin: Math.round(margin * 10) / 10,
    buyer_name: buyer.name,
    buyer_email: buyer.email,
    buyer_phone: buyer.phone,
    buyer_address: `${buyer.suburb}, VIC`,
    sale_date: daysAgo(s.daysOld),
    settlement_date: daysAgo(s.daysOld),
    status: "Completed",
    payment_method: i % 3 === 0 ? "Cash" : "Bank transfer",
    warranty_type: "Statutory",
    warranty_months: 3,
    notes: "Seeded by create-demo-dealer.mjs",
  }
})

const allSales = [...salesFromSold, ...standaloneSales]
const { error: salesInsErr, count: salesCount } = await supabase
  .from("sales")
  .insert(allSales, { count: "exact" })

if (salesInsErr) fail(`sales insert failed: ${salesInsErr.message}`)
log(`✓ ${salesCount ?? allSales.length} sales inserted`)

/* ─── 7. Verify + print credentials ────────────────────────────────── */
const { data: stats } = await supabase
  .from("profiles")
  .select("id, dealer_name, email, role")
  .eq("id", userId)
  .single()

const { count: vehCount } = await supabase
  .from("vehicles").select("id", { count: "exact", head: true }).eq("user_id", userId)
const { count: saleCount } = await supabase
  .from("sales").select("id", { count: "exact", head: true }).eq("user_id", userId)

console.log("\n════════════════════════════════════════════════════")
console.log("  Demo dealer account ready")
console.log("════════════════════════════════════════════════════")
console.log(`  Email:        ${stats?.email || EMAIL}`)
console.log(`  Password:     ${PASSWORD}`)
console.log(`  Role:         ${stats?.role}`)
console.log(`  User id:      ${stats?.id}`)
console.log(`  Dealer name:  ${stats?.dealer_name}`)
console.log(`  Vehicles:     ${vehCount}`)
console.log(`  Sales:        ${saleCount}`)
console.log("")
console.log("  Live site:")
console.log("    Dealer login →  https://lmctpro.com.au/auth/login")
console.log("    Dealer view  →  https://lmctpro.com.au/dashboard")
console.log("")
console.log("  Founder admin (separate account, m.rahman746301@gmail.com):")
console.log("    Founder login → https://lmctpro.com.au/auth/login")
console.log("    Admin console → https://lmctpro.com.au/admin")
console.log("════════════════════════════════════════════════════\n")
