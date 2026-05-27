// Manual trigger for the market-intelligence Edge Function.
// Gated to profile.role='founder'. Calls the EF using the service role key
// (never expose service role to the browser).
//
// Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Returns 503 when service role isn't configured — clean degradation.

import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if ((profile as { role?: string } | null)?.role !== "founder") {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return Response.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 503 },
    )
  }

  const efUrl = `${url.replace(/\/$/, "")}/functions/v1/market-intelligence`
  const res = await fetch(efUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${serviceKey}` },
  })
  const body = await res.text()
  try {
    return Response.json(JSON.parse(body), { status: res.status })
  } catch {
    return Response.json({ ok: false, error: body || `HTTP ${res.status}` }, { status: res.status })
  }
}
