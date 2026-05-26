"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, X } from "lucide-react"
import type { Profile } from "@/lib/types"

interface Props {
  profile: Profile | null
}

export function TrialBanner({ profile }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!profile) return null
  if (dismissed) return null
  // Active subscriptions don't need the banner.
  if (profile.subscription_status === "active") return null

  const daysLeft = computeDaysLeft(profile.trial_ends_at)
  const isPastDue = profile.subscription_status === "past_due"
  const isCanceled =
    profile.subscription_status === "canceled" ||
    profile.subscription_status === "incomplete"
  const isExpiredTrial =
    profile.subscription_status === "trialing" && daysLeft !== null && daysLeft <= 0

  let tone: "warn" | "info" | "danger" = "info"
  let message = ""
  if (isPastDue) {
    tone = "danger"
    message = "Your payment is past due. Update your billing details to keep access."
  } else if (isCanceled || isExpiredTrial) {
    tone = "danger"
    message = "Your trial has ended. Subscribe to keep using LMCT PRO."
  } else if (daysLeft !== null && daysLeft <= 3) {
    tone = "warn"
    message = `Trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — upgrade to keep your data.`
  } else if (daysLeft !== null) {
    tone = "info"
    message = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial.`
  } else {
    return null
  }

  const toneClass =
    tone === "danger"
      ? "bg-destructive/10 border-destructive/30 text-destructive"
      : tone === "warn"
        ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
        : "bg-primary/10 border-primary/30 text-foreground"

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "software_ai" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        toast.error(data?.error || "Could not start checkout")
        return
      }
      window.location.href = data.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`relative border-b px-4 lg:px-6 py-3 flex items-center gap-3 text-sm ${toneClass}`}
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 leading-snug">{message}</span>
      <Button
        size="sm"
        variant={tone === "danger" ? "destructive" : "default"}
        onClick={handleUpgrade}
        disabled={loading}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
        Upgrade
      </Button>
      {tone === "info" && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function computeDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null
  const end = new Date(trialEndsAt).getTime()
  if (Number.isNaN(end)) return null
  const ms = end - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}
