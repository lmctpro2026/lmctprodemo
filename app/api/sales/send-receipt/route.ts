import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import type { Sale, Profile } from "@/lib/types"

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Email is not configured yet. Drop RESEND_API_KEY into .env.local and reload.",
      },
      { status: 503 }
    )
  }

  let body: { sale_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  if (!body.sale_id) {
    return NextResponse.json({ error: "sale_id required" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { data: sale } = await supabase
    .from("sales")
    .select("*")
    .eq("id", body.sale_id)
    .eq("user_id", user.id)
    .single<Sale>()

  if (!sale) {
    return NextResponse.json({ error: "Sale not found" }, { status: 404 })
  }
  if (!sale.buyer_email) {
    return NextResponse.json(
      { error: "Buyer has no email on file" },
      { status: 422 }
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  const html = renderReceiptHtml(sale, profile)
  const subject = `Vehicle Purchase Receipt — ${sale.year} ${sale.make} ${sale.model}`

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: `${profile?.dealer_name || "LMCT PRO"} <${fromEmail}>`,
      to: sale.buyer_email,
      replyTo: profile?.email || undefined,
      subject,
      html,
    })
    if (result.error) {
      return NextResponse.json(
        { error: `Resend rejected: ${result.error.message}` },
        { status: 502 }
      )
    }
    return NextResponse.json({ ok: true, id: result.data?.id ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function renderReceiptHtml(sale: Sale, profile: Profile | null): string {
  const dealerName = profile?.dealer_name || "Your Dealer"
  const lmct = profile?.lmct ? `LMCT ${profile.lmct}` : ""
  const abn = profile?.abn ? `ABN ${profile.abn}` : ""
  const address = profile?.address || ""
  const phone = profile?.phone || ""
  const totalLine = formatAUD(sale.sale_price)
  const depositLine = sale.deposit_amount > 0 ? formatAUD(sale.deposit_amount) : null
  const warranty =
    sale.warranty_months > 0
      ? `${sale.warranty_months} months ${sale.warranty_type || ""}`.trim()
      : null

  const rows = [
    ["Vehicle", `${sale.year} ${sale.make} ${sale.model}`],
    ["Rego", sale.rego || "-"],
    ["Sale Date", sale.sale_date],
    ["Sale Price", totalLine],
    depositLine ? ["Deposit Paid", depositLine] : null,
    sale.payment_method ? ["Payment Method", titleCase(sale.payment_method)] : null,
    warranty ? ["Warranty", warranty] : null,
    sale.settlement_date ? ["Settlement", sale.settlement_date] : null,
  ].filter((r): r is [string, string] => r !== null)

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;color:#525252;font-size:13px;width:42%">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;color:#0a0a0a;font-size:14px;font-weight:600">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("")

  return `<!doctype html>
<html><body style="margin:0;background:#f5f5f4;font-family:-apple-system,system-ui,Helvetica,Arial,sans-serif;color:#0a0a0a">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden">
    <div style="padding:24px 28px;background:#0a0a0a;color:#ffffff">
      <div style="font-size:22px;font-weight:800;letter-spacing:-0.2px">${escapeHtml(dealerName)}</div>
      <div style="margin-top:4px;font-size:12px;color:#a3a3a3">${[lmct, abn].filter(Boolean).map(escapeHtml).join("  •  ")}</div>
    </div>
    <div style="padding:28px">
      <div style="font-size:13px;color:#737373;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Vehicle Purchase Receipt</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:4px">${escapeHtml(sale.year + " " + sale.make + " " + sale.model)}</div>
      <div style="font-size:14px;color:#525252;margin-bottom:24px">For: ${escapeHtml(sale.buyer_name)}</div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden">
        ${rowsHtml}
      </table>

      <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#525252">
        Thank you for your purchase. Keep this receipt for your records — you may need it for registration transfer, insurance, and any warranty claims.
      </p>
      ${
        warranty
          ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#525252">Your warranty coverage runs from the sale date for ${escapeHtml(warranty)}.</p>`
          : ""
      }
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e5e5;font-size:12px;color:#737373;line-height:1.6">
        ${escapeHtml(dealerName)}<br/>
        ${address ? escapeHtml(address) + "<br/>" : ""}
        ${phone ? "Ph " + escapeHtml(phone) : ""}
      </div>
    </div>
  </div>
</body></html>`
}

function formatAUD(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)
}

function titleCase(s: string): string {
  return s
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
