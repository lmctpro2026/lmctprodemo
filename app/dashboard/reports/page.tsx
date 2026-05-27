import Link from "next/link"
import { reports, reportsByCategory, categoryOrder } from "@/lib/reports/registry"
import { cn } from "@/lib/utils"
import { ArrowRight, Clock } from "lucide-react"

export default function ReportsIndexPage() {
  const grouped = reportsByCategory()
  const liveCount = reports.filter((r) => r.status === "live").length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {liveCount} live reports — every report prints to PDF and exports to CSV.
          </p>
        </div>
      </div>

      {categoryOrder.map((cat) => {
        const items = grouped[cat]
        if (!items || items.length === 0) return null
        return (
          <section key={cat} className="space-y-2">
            <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold pl-1">
              {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {items.map((r) => {
                const live = r.status === "live"
                const content = (
                  <div
                    className={cn(
                      "group h-full flex flex-col gap-1.5 rounded-lg border p-4 transition-colors",
                      live
                        ? "border-border bg-card/40 hover:border-border/80 hover:bg-secondary/30 cursor-pointer"
                        : "border-border/50 bg-card/20 opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-tight">{r.title}</h3>
                      {live ? (
                        <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground border border-border rounded-full px-1.5 py-0.5 shrink-0">
                          <Clock className="h-2.5 w-2.5" />
                          Planned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                  </div>
                )
                return live ? (
                  <Link key={r.slug} href={`/dashboard/reports/${r.slug}`} className="block h-full">
                    {content}
                  </Link>
                ) : (
                  <div key={r.slug} className="block h-full">
                    {content}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
