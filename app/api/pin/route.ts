import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Edge-runtime compatible — uses Web Crypto, no Node bcrypt.
// Per-user salt is the authenticated user's UUID. Not as strong as a random
// per-record salt, but acceptable for an authenticated UI edit-gate: SHA-256
// is one-way, and the UUID is not secret (it's already in the JWT).
export const runtime = "edge"

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function POST(request: NextRequest) {
  let body: { action?: "set" | "verify"; pin?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { action, pin } = body
  if (action !== "set" && action !== "verify") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
  if (typeof pin !== "string" || pin.length < 4 || pin.length > 12) {
    return NextResponse.json({ error: "PIN must be 4–12 characters" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const hash = await sha256Hex(`${user.id}:${pin}`)

  if (action === "set") {
    const { error } = await supabase
      .from("profiles")
      .update({ manager_pin: hash })
      .eq("id", user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // verify
  const { data, error } = await supabase
    .from("profiles")
    .select("manager_pin")
    .eq("id", user.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const stored = (data as { manager_pin: string | null } | null)?.manager_pin
  // First-run default in 001_create_schema.sql is the plaintext '1234'. Treat
  // a non-64-char value as unset (since SHA-256 hex is always 64 chars), so
  // dealers who haven't set a PIN yet are gated out by default.
  const ok = typeof stored === "string" && stored.length === 64 && stored === hash
  return NextResponse.json({ ok })
}
