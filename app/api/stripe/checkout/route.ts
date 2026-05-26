import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe, priceIdForPlan, siteUrl } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Billing is not configured yet. Drop STRIPE_SECRET_KEY into .env.local." },
      { status: 503 }
    )
  }

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: string }
  if (!plan) {
    return NextResponse.json({ error: "plan required" }, { status: 400 })
  }
  const priceId = priceIdForPlan(plan)
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for plan "${plan}"` },
      { status: 422 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, dealer_name")
    .eq("id", user.id)
    .single()

  let customerId = profile?.stripe_customer_id ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      name: profile?.dealer_name ?? undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl()}/dashboard?billing=success`,
    cancel_url: `${siteUrl()}/dashboard?billing=cancel`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { user_id: user.id, plan },
    },
    metadata: { user_id: user.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
