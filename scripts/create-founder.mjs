/**
 * Provision the founder account end-to-end.
 *
 *   node --env-file=.env.local scripts/create-founder.mjs
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY to talk to the Supabase Admin API. Will:
 *   1. Verify scripts/004 has been applied (profiles.role column exists).
 *   2. Create the user (or reset the password if already exists).
 *   3. Set email_confirm:true so login works immediately without an email.
 *   4. UPDATE profiles.role = 'founder' for that user.
 *   5. Print the credentials.
 *
 * Safe to re-run. Idempotent.
 */

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.")
  console.error("Run with: node --env-file=.env.local scripts/create-founder.mjs")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL    = "m.rahman746301@gmail.com"
const PASSWORD = "Admin@LMCTpro2026"
const META = {
  dealer_name: "LMCT PRO HQ",
  lmct:        "FOUNDER",
  abn:         "",
  phone:       "",
  suburb:      "Melbourne",
  state:       "VIC",
}

const log  = (...args) => console.log("  ", ...args)
const fail = (msg) => { console.error("✗", msg); process.exit(1) }

console.log(`\nProvisioning founder account for ${EMAIL}…\n`)

/* ─── 1. Verify schema ─────────────────────────────────────────────── */
const { error: schemaErr } = await supabase
  .from("profiles")
  .select("role")
  .limit(1)

if (schemaErr) {
  if (String(schemaErr.message || "").toLowerCase().includes("role")) {
    console.error("✗ The 'role' column does not exist on public.profiles.")
    console.error("\nPaste this SQL into the Supabase SQL Editor first, then re-run me:\n")
    console.error("---")
    console.error(`ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'dealer';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_chk') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_chk
      CHECK (role IN ('dealer', 'founder', 'support', 'analyst'));
  END IF;
END $$;`)
    console.error("---\n")
    process.exit(1)
  }
  fail(`Schema check failed: ${schemaErr.message}`)
}
log("✓ profiles.role column present")

/* ─── 2. Find or create user ───────────────────────────────────────── */
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 200 })
if (listErr) fail(`listUsers failed: ${listErr.message}`)
const existing = list.users.find((u) => u.email === EMAIL)

let userId
if (existing) {
  log(`◦ User exists (id ${existing.id}). Resetting password + confirming email…`)
  const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { ...existing.user_metadata, ...META },
  })
  if (updErr) fail(`updateUserById failed: ${updErr.message}`)
  userId = existing.id
} else {
  log("◦ Creating user via Supabase Admin API…")
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: META,
  })
  if (createErr) fail(`createUser failed: ${createErr.message}`)
  userId = created.user.id
  log(`✓ Created user (id ${userId})`)
  // Give the on_auth_user_created trigger a moment to insert the profiles row.
  await new Promise((r) => setTimeout(r, 1200))
}

/* ─── 3. Ensure profiles row exists (defensive — trigger should have done it) */
const { data: profileCheck } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", userId)
  .maybeSingle()

if (!profileCheck) {
  log("◦ profiles row not found, inserting manually…")
  const address = [META.suburb, META.state].filter(Boolean).join(", ")
  const { error: insErr } = await supabase.from("profiles").insert({
    id: userId,
    dealer_name: META.dealer_name,
    lmct: META.lmct,
    abn: META.abn,
    phone: META.phone,
    address,
    email: EMAIL,
  })
  if (insErr) fail(`profile insert failed: ${insErr.message}`)
}

/* ─── 4. Set role = 'founder' ──────────────────────────────────────── */
log("◦ Setting role = 'founder'…")
const { error: roleErr } = await supabase
  .from("profiles")
  .update({ role: "founder" })
  .eq("id", userId)

if (roleErr) fail(`role update failed: ${roleErr.message}`)

/* ─── 5. Verify ────────────────────────────────────────────────────── */
const { data: profile, error: readErr } = await supabase
  .from("profiles")
  .select("id, dealer_name, email, role")
  .eq("id", userId)
  .single()

if (readErr) fail(`final read failed: ${readErr.message}`)

console.log("\n════════════════════════════════════════════════════")
console.log("  Founder account ready")
console.log("════════════════════════════════════════════════════")
console.log(`  Email:     ${profile.email || EMAIL}`)
console.log(`  Password:  ${PASSWORD}`)
console.log(`  Role:      ${profile.role}`)
console.log(`  User id:   ${profile.id}`)
console.log(`  Dealer:    ${profile.dealer_name}`)
console.log("")
console.log("  Live site:")
console.log("    Login →  https://lmctpro.com.au/auth/login")
console.log("    Admin →  https://lmctpro.com.au/admin")
console.log("════════════════════════════════════════════════════")
console.log("Change the password after first login: /dashboard/settings\n")
