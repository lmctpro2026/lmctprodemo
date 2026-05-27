"use client"

import { useEffect, useState } from "react"

type TabKey = "stock" | "add" | "form" | "max"

const tabs: { key: TabKey; label: string }[] = [
  { key: "stock", label: "Live stock"       },
  { key: "add",   label: "Add a vehicle"    },
  { key: "form",  label: "Compliance form"  },
  { key: "max",   label: "Ask MAX"          },
]

const CYCLE_MS = 5200

export function HeroShowcase() {
  const [active, setActive] = useState<TabKey>("stock")
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const id = window.setInterval(() => {
      setActive((cur) => {
        const i = tabs.findIndex((t) => t.key === cur)
        return tabs[(i + 1) % tabs.length].key
      })
    }, CYCLE_MS)
    return () => window.clearInterval(id)
  }, [auto])

  function pick(k: TabKey) {
    setAuto(false)
    setActive(k)
  }

  return (
    <div className="ls-showcase">
      <div className="ls-frame">
        {/* Window chrome */}
        <div className="ls-chrome">
          <div className="ls-dots">
            <span /><span /><span />
          </div>
          <span className="ls-url">lmctpro.com.au / dashboard</span>
          <span className="ls-max">
            <span className="ls-pulse" /> MAX
          </span>
        </div>
        <div className="ls-stage" data-active={active}>
          <PanelStock />
          <PanelAdd />
          <PanelForm />
          <PanelMax />
        </div>
      </div>

      {/* Tab pills */}
      <div className="ls-tabs" role="tablist" aria-label="Platform showcase">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active === t.key}
            onClick={() => pick(t.key)}
            className={`ls-tab${active === t.key ? " is-active" : ""}`}
          >
            <span className="ls-tab-dot" />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Stock panel ─────────────────────────────────────────────────────── */
function PanelStock() {
  return (
    <div className="ls-panel" data-key="stock">
      <div className="ls-panel-head">
        <div className="ls-kpis">
          <Kpi label="IN STOCK" value="42" />
          <Kpi label="SOLD MTD" value="11" tone="money" />
          <Kpi label="REVENUE" value="$284K" />
          <Kpi label="PROFIT" value="$48K" tone="money" />
        </div>
      </div>
      <div className="ls-rows">
        <Row stock="S-104" car="2021 Toyota RAV4 Cruiser" body="SUV"   days={6}  price="$41,750" tone="ok" />
        <Row stock="S-097" car="2017 VW Tiguan 132TSI"    body="SUV"   days={15} price="$18,999" tone="ok" />
        <Row stock="S-088" car="2022 Mazda CX-5 Akera"    body="SUV"   days={41} price="$46,900" tone="watch" />
        <Row stock="S-073" car="2018 Mercedes C300"        body="Sedan" days={92} price="$32,500" tone="danger" />
      </div>
    </div>
  )
}

/* ── Add Vehicle panel — animated form fill ──────────────────────────── */
function PanelAdd() {
  return (
    <div className="ls-panel" data-key="add">
      <div className="ls-add-grid">
        <Field label="Rego"        delay="0s"   value="DPR76M" />
        <Field label="Year"        delay="0.6s" value="2017" />
        <Field label="Make"        delay="1.0s" value="Volkswagen" />
        <Field label="Model"       delay="1.4s" value="Tiguan 132TSI" />
        <Field label="Odometer"    delay="1.8s" value="84,250 km" />
        <Field label="Colour"      delay="2.2s" value="Pure White" />
        <Field label="Purchase"    delay="2.6s" value="$14,500" />
        <Field label="Ask price"   delay="3.0s" value="$18,999" />
      </div>
      <div className="ls-add-done">
        <Check />
        <span>Added to stock · S-097 · 12 seconds</span>
      </div>
    </div>
  )
}

/* ── Compliance form panel — animated form fill ──────────────────────── */
function PanelForm() {
  return (
    <div className="ls-panel" data-key="form">
      <div className="ls-form-head">
        <span className="ls-mono ls-form-kicker">VicRoads VP151 — Transfer of Registration</span>
        <span className="ls-form-title">2018 Mercedes-Benz C300</span>
        <span className="ls-mono ls-muted">STOCK S-073 · REGO 2CY1PF</span>
      </div>
      <div className="ls-form-grid">
        <FormRow k="Buyer"      v="Emma S."                 delay="0s"   />
        <FormRow k="Licence"    v="VIC · 09421003"          delay="0.4s" />
        <FormRow k="Address"    v="42 Park Road, Hawthorn"  delay="0.8s" />
        <FormRow k="Phone"      v="0413 552 081"            delay="1.2s" />
        <FormRow k="Sale date"  v="27 May 2026"             delay="1.6s" />
        <FormRow k="Sale price" v="$32,500"                 delay="2.0s" />
      </div>
      <div className="ls-form-docs">
        <DocPill delay="2.6s">Tax invoice</DocPill>
        <DocPill delay="2.9s">Transfer form</DocPill>
        <DocPill delay="3.2s">Buyer receipt</DocPill>
      </div>
    </div>
  )
}

/* ── MAX chat panel — typed conversation ─────────────────────────────── */
function PanelMax() {
  return (
    <div className="ls-panel" data-key="max">
      <div className="ls-chat">
        <ChatBubble side="user" delay="0s">
          What should I do with the white Tiguan?
        </ChatBubble>
        <Typing delay="1.4s" />
        <ChatBubble side="max" delay="2.4s">
          <span><span className="ls-violet">2017 Tiguan 132TSI (DPR76M)</span> — on the lot 15 days at <span className="ls-mono">$18,999</span>.</span>
        </ChatBubble>
        <ChatBubble side="max" delay="3.2s" muted>
          Comparables in your last 90 days sold around <span className="ls-mono">$18.2K–$19.4K</span>, average 22 days held. Hold for now — revisit at 30 days, consider <span className="ls-warn">$17,990</span> if no enquiries.
        </ChatBubble>
      </div>
      <div className="ls-tools">
        {["lookup_vehicle_by_rego", "top_makes_last_n_days"].map((t) => (
          <span key={t} className="ls-tool">{t}()</span>
        ))}
      </div>
    </div>
  )
}

/* ── tiny primitives ─────────────────────────────────────────────────── */
function Kpi({ label, value, tone }: { label: string; value: string; tone?: "money" }) {
  return (
    <div className="ls-kpi">
      <span className="ls-mono ls-kpi-label">{label}</span>
      <span className={`ls-mono ls-kpi-value${tone === "money" ? " is-money" : ""}`}>{value}</span>
    </div>
  )
}

function Row({ stock, car, body, days, price, tone }: { stock: string; car: string; body: string; days: number; price: string; tone: "ok" | "watch" | "danger" }) {
  const daysClass = tone === "danger" ? "ls-danger" : tone === "watch" ? "ls-warn" : "ls-money"
  return (
    <div className="ls-row">
      <span className="ls-mono ls-row-stock">{stock}</span>
      <span className="ls-row-car">{car}</span>
      <span className="ls-mono ls-row-body">{body}</span>
      <span className={`ls-mono ls-row-days ${daysClass}`}>{days}d</span>
      <span className="ls-mono ls-row-price">{price}</span>
    </div>
  )
}

function Field({ label, value, delay }: { label: string; value: string; delay: string }) {
  return (
    <div className="ls-field" style={{ animationDelay: delay }}>
      <span className="ls-mono ls-field-label">{label}</span>
      <span className="ls-field-value">{value}</span>
    </div>
  )
}

function FormRow({ k, v, delay }: { k: string; v: string; delay: string }) {
  return (
    <div className="ls-formrow" style={{ animationDelay: delay }}>
      <span className="ls-mono ls-form-key">{k}</span>
      <span className="ls-form-val">{v}</span>
    </div>
  )
}

function DocPill({ children, delay }: { children: React.ReactNode; delay: string }) {
  return (
    <span className="ls-docpill" style={{ animationDelay: delay }}>{children}</span>
  )
}

function ChatBubble({ side, children, delay, muted }: { side: "user" | "max"; children: React.ReactNode; delay: string; muted?: boolean }) {
  return (
    <div className={`ls-bubble ls-${side}${muted ? " is-muted" : ""}`} style={{ animationDelay: delay }}>
      {children}
    </div>
  )
}

function Typing({ delay }: { delay: string }) {
  return (
    <div className="ls-typing" style={{ animationDelay: delay }}>
      <span /><span /><span />
    </div>
  )
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
