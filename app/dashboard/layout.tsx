import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav"
import { TrialBanner } from "@/components/billing/trial-banner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader user={user} profile={profile} />
        <TrialBanner profile={profile} />
        <main className="flex-1 p-6 overflow-auto pb-[calc(env(safe-area-inset-bottom)+72px)] lg:pb-6">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
