// /admin — Phase 1 of the data engine.
//
// Server fetches everything the founder needs across all dealers (gated by
// the founder-read-all RLS policies in scripts/008_founder_read_all.sql).
// The 6-tab client UI lives in admin-tabs.tsx. Realtime feed subscribes in
// the browser using the same RLS-enforced session.

import { createClient } from "@/lib/supabase/server"
import { AdminTabs, type AdminData, type MarketCache } from "./admin-tabs"

async function getAdminData(): Promise<AdminData> {
  const supabase = await createClient()

  const [profilesRes, vehiclesRes, salesRes, cacheRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, dealer_name, lmct, email, phone, address, role, plan, subscription_status, trial_ends_at, created_at, updated_at"),
    supabase
      .from("vehicles")
      .select("id, user_id, make, model, year, body, source, status, price, purchase_price, acquisition_date, created_at"),
    supabase
      .from("sales")
      .select("id, user_id, vehicle_id, make, model, year, sale_price, profit, margin, sale_date, status, created_at"),
    // Defensive: 006 may not be applied yet. Swallow the error so /admin still renders.
    supabase
      .from("market_intelligence_cache")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    profiles: (profilesRes.data as AdminData["profiles"]) ?? [],
    vehicles: (vehiclesRes.data as AdminData["vehicles"]) ?? [],
    sales: (salesRes.data as AdminData["sales"]) ?? [],
    marketIntel: (cacheRes.data as MarketCache | null) ?? null,
  }
}

export default async function AdminPage() {
  const data = await getAdminData()
  return <AdminTabs data={data} />
}
