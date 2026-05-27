import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const TO_EMAIL = "sami@studyin.com.au"

interface DemoLead {
  dealer_name?: string
  your_name?: string
  phone?: string
  email?: string
  lmct?: string
  suburb?: string
  current_setup?: string
}

export async function POST(request: NextRequest) {
  let body: DemoLead
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Minimum-viable validation. Any field can be empty if the dealer wants — we
  // still email the lead through and follow up by phone. But if NOTHING is
  // filled, drop the request.
  const meaningful =
    (body.dealer_name && body.dealer_name.trim()) ||
    (body.your_name && body.your_name.trim()) ||
    (body.email && body.email.trim()) ||
    (body.phone && body.phone.trim())
  if (!meaningful) {
    return NextResponse.json({ error: "Please fill at least one field." }, { status: 400 })
  }

  const lines = [
    ["Dealership",     body.dealer_name],
    ["Name",           body.your_name],
    ["Phone",          body.phone],
    ["Email",          body.email],
    ["LMCT",           body.lmct],
    ["Suburb",         body.suburb],
    ["Current setup",  body.current_setup],
  ]
    .map(([k, v]) => (v ? `${k}: ${v}` : null))
    .filter(Boolean) as string[]

  const text = `New LMCT PRO demo request\n\n${lines.join("\n")}\n\nReply to this email to confirm a time.`

  const html = `<div style="font-family:-apple-system,system-ui,Helvetica,Arial,sans-serif;background:#fdf8f0;padding:24px;color:#0a1628">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e2d6;border-radius:12px;overflow:hidden">
      <div style="padding:18px 22px;background:#0a1628;color:#fdf8f0">
        <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#d4921a">New demo request</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px">LMCT PRO</div>
      </div>
      <div style="padding:22px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${lines.map((l) => {
            const [k, ...rest] = l.split(":")
            const v = rest.join(":").trim()
            return `<tr>
              <td style="padding:8px 0;color:#4a5567;width:130px;vertical-align:top">${escapeHtml(k)}</td>
              <td style="padding:8px 0;color:#0a1628;font-weight:500">${escapeHtml(v)}</td>
            </tr>`
          }).join("")}
        </table>
        <p style="font-size:12px;color:#4a5567;margin-top:20px">Reply to the email address above to confirm a time. Demo runs ~15 minutes on a screenshare.</p>
      </div>
    </div>
  </div>`

  // If Resend isn't configured yet, log + accept so leads aren't dropped.
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
  if (!apiKey) {
    console.log("[demo lead — Resend not configured]\n" + text)
    return NextResponse.json({ ok: true, queued: true })
  }

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: `LMCT PRO Demo <${fromEmail}>`,
      to: TO_EMAIL,
      replyTo: body.email || undefined,
      subject: `Demo request — ${body.dealer_name || body.your_name || body.email || "no name"}`,
      html,
      text,
    })
    if (result.error) {
      return NextResponse.json(
        { error: `Couldn't send the request: ${result.error.message}` },
        { status: 502 }
      )
    }
    return NextResponse.json({ ok: true, id: result.data?.id ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
