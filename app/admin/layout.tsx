// Founder-only layout. Anyone without role='founder' gets redirected.
// Dealers should never see /admin even if they guess the URL.

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, dealer_name")
    .eq("id", user.id)
    .single()

  // Defensive: any role other than founder bounces back to dealer dashboard.
  if (!profile || (profile as { role?: string }).role !== "founder") {
    redirect("/dashboard")
  }

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", color: "#F1F0FF" }}>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.5px" }}>
            LMCT<span style={{ color: "#E8A020" }}>PRO</span>
          </span>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase",
            padding: "4px 10px", borderRadius: 4,
            background: "rgba(232,160,32,0.12)", color: "#E8A020",
            border: "1px solid rgba(232,160,32,0.3)",
          }}>
            Founder · Data Engine
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13 }}>
          <Link href="/admin" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>Overview</Link>
          <Link href="/dashboard" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← My dealer view</Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
