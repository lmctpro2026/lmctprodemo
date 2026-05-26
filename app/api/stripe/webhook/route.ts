import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { getStripe } from "@/lib/stripe"
import type { SubscriptionStatus, PlanId } from "@/lib/types"

export const runtime = "nodejs"

const ALLOWED_STATUSES: Record<string, SubscriptionStatus> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "past_due",
  incomplete: "incomplete",
  incomplete_expired: "canceled",
  paused: "paused",
}

function planFromMetadata(meta: Stripe.Metadata | null | undefined): PlanId | null {
  const v = meta?.plan
  if (v === "software_ai" || v === "done_for_you" || v === "grow_for_you") return v
  return null
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    )
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "missing stripe-signature" }, { status: 400 })
  }

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad signature"
    return NextResponse.json({ error: `Webhook signature failed: ${msg}` }, { status: 400 })
  }

  // Service-role client — webhook is not a user request, no auth cookie.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server Supabase credentials missing" },
      { status: 500 }
    )
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const status = ALLOWED_STATUSES[sub.status] ?? "incomplete"
        const userId = (sub.metadata?.user_id as string | undefined) || null
        const plan = planFromMetadata(sub.metadata)
        if (!userId) break
        await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            plan: plan,
            stripe_customer_id:
              typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          })
          .eq("id", userId)
        break
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = (session.metadata?.user_id as string | undefined) || null
        const plan = planFromMetadata(session.metadata)
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              plan: plan,
              stripe_customer_id:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id ?? null,
            })
            .eq("id", userId)
        }
        break
      }
      default:
        // Ignore other events for now.
        break
    }
    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "webhook handler error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
