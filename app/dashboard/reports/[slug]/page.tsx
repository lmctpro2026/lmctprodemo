import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getReport } from "@/lib/reports/registry"
import { runReport, defaultDateRange } from "@/lib/reports/runners"
import { ReportShell } from "@/components/reports/report-shell"

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const sp = await searchParams
  const report = getReport(slug)
  if (!report || report.status !== "live") notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const def = defaultDateRange()
  const filters = {
    from: oneStr(sp.from) || def.from,
    to:   oneStr(sp.to)   || def.to,
    status: oneStr(sp.status) || undefined,
  }

  const result = await runReport(slug, supabase, user.id, filters)
  if (!result) notFound()

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealer_name")
    .eq("id", user.id)
    .single()

  return (
    <ReportShell
      report={report}
      result={result}
      filters={filters}
      dealerName={(profile?.dealer_name as string) || "Dealership"}
    />
  )
}

function oneStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}
