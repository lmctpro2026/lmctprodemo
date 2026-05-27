// Dealer Network — placeholder. SQL tables exist (007_dealer_network.sql);
// UI activates at 20 dealers. Until then this page shows the runway gauge.

import { createClient } from "@/lib/supabase/server"
import { Users, MessageSquare, MegaphoneIcon } from "lucide-react"

const TARGET = 20

export default async function NetworkPage() {
  const supabase = await createClient()
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "dealer")

  const dealers = count ?? 0
  const pct = Math.min(100, Math.round((dealers / TARGET) * 100))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dealer Network</h1>
        <p className="text-muted-foreground">
          Buy, sell, and message dealers across Victoria — without the auction-house margin.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Coming soon</div>
          <div className="text-xs uppercase tracking-widest text-amber-500 font-mono">activates at 20</div>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold">{dealers}</span>
          <span className="text-sm text-muted-foreground">/ {TARGET} dealers on the platform · {pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-muted-foreground mt-6 max-w-2xl">
          The network unlocks once enough dealers join to make it valuable. You&apos;ll be able to message other LMCT
          dealers directly, broadcast stock enquiries (&quot;anyone got a 2019 RAV4 under 80k?&quot;), and opt in to a public
          directory of dealers by suburb and specialty.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PreviewCard
          icon={<Users className="h-5 w-5" />}
          title="Public directory"
          body="Dealers who opt in appear by suburb, state, and what they typically stock. Filterable, contactable."
        />
        <PreviewCard
          icon={<MessageSquare className="h-5 w-5" />}
          title="1:1 messaging"
          body="Direct messages between dealers. Per-dealer inbox. Read receipts. Never visible to anyone outside the conversation."
        />
        <PreviewCard
          icon={<MegaphoneIcon className="h-5 w-5" />}
          title="Stock enquiries"
          body="Broadcast a stock request to dealers in your state. 24-hour TTL — first to reply wins."
        />
      </div>
    </div>
  )
}

function PreviewCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-5">
      <div className="flex items-center gap-2 text-amber-500 mb-2">{icon}<span className="text-xs uppercase tracking-wider font-mono">Phase 5</span></div>
      <div className="font-semibold mb-1">{title}</div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  )
}
