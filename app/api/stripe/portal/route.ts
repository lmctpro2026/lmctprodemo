import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe, siteUrl } from "@/lib/stripe"

export async function POST() {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Billing is not configured yet." },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer yet — start by subscribing." },
      { status: 422 }
    )
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl()}/dashboard/settings`,
  })

  return NextResponse.json({ url: session.url })
}
