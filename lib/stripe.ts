import Stripe from "stripe"

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  // No explicit apiVersion: the SDK pins to a version that matches its own
  // types. Letting it default avoids tying our build to a literal string the
  // SDK might widen or narrow in a minor release.
  return new Stripe(key)
}

export function priceIdForPlan(plan: string): string | null {
  switch (plan) {
    case "software_ai":
      return process.env.STRIPE_PRICE_SOFTWARE_AI || null
    case "done_for_you":
      return process.env.STRIPE_PRICE_DONE_FOR_YOU || null
    default:
      return null
  }
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}
