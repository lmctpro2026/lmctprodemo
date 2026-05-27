"use client"

import React from "react"
import Link from "next/link"
import { LogoMark, Wordmark } from "@/components/brand/logo"

/* ─── Button ──────────────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient"
  size?: "default" | "sm" | "lg"
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    const variants = {
      default:   "bg-white text-black hover:bg-gray-100",
      secondary: "bg-gray-800 text-white hover:bg-gray-700",
      ghost:     "hover:bg-gray-800/50 text-white",
      gradient:  "bg-gradient-to-b from-white via-white/95 to-white/60 text-black hover:scale-105 active:scale-95",
    }
    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm:      "h-10 px-5 text-sm",
      lg:      "h-12 px-8 text-base",
    }
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

/* ─── Inline SVG icons ───────────────────────────────────────────── */
function ArrowRight({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  )
}
function MenuIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6"  y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}
function XIcon({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}

/* ─── Navigation ─────────────────────────────────────────────────── */
const Navigation = React.memo(function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="LMCT PRO home" className="flex items-center gap-2.5">
            <LogoMark size={32} tone="transparent" />
            <Wordmark height={18} color="#ffffff" accent="#c8a96e" />
          </Link>

          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a href="#platform" className="text-sm text-white/60 hover:text-white transition-colors">
              Platform
            </a>
            <a href="#max" className="text-sm text-white/60 hover:text-white transition-colors">
              MAX
            </a>
            <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login">
              <Button type="button" variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/demo">
              <Button type="button" variant="default" size="sm">Book a demo</Button>
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]">
          <div className="px-6 py-4 flex flex-col gap-4">
            <a href="#platform" onClick={() => setMobileMenuOpen(false)}
               className="text-sm text-white/60 hover:text-white transition-colors py-2">Platform</a>
            <a href="#max" onClick={() => setMobileMenuOpen(false)}
               className="text-sm text-white/60 hover:text-white transition-colors py-2">MAX</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}
               className="text-sm text-white/60 hover:text-white transition-colors py-2">Pricing</a>
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
              <Link href="/auth/login">
                <Button type="button" variant="ghost" size="sm" className="w-full">Sign in</Button>
              </Link>
              <Link href="/demo">
                <Button type="button" variant="default" size="sm" className="w-full">Book a demo</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
})

/* ─── Dashboard mockup (HTML, not a PNG) ─────────────────────────── */
function DashboardMockup() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#161a23] to-[#0a0a12] shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <span className="font-mono text-[10px] text-white/40 tracking-wider">lmctpro.com.au / dashboard</span>
        <span className="font-mono text-[10px] text-emerald-400 tracking-widest inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          MAX
        </span>
      </div>

      <div className="p-5">
        {/* Dealer + date */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Westside Motors</p>
            <p className="font-mono text-[10px] text-white/40 tracking-wider mt-0.5">WED · 27 MAY</p>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Kpi label="IN STOCK" value="42" />
          <Kpi label="SOLD MTD" value="11" tone="money" />
          <Kpi label="REVENUE" value="$284K" />
          <Kpi label="PROFIT" value="$48K" tone="money" />
        </div>

        {/* Aged alert */}
        <div className="rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2 border border-red-500/25 bg-red-500/10">
          <span className="font-mono text-[10px] font-semibold text-red-300 tracking-widest">3 VEHICLES AGED 60+</span>
          <span className="font-mono text-[10px] text-white/40">· $74K tied up</span>
        </div>

        {/* Table */}
        <div className="rounded-lg overflow-hidden border border-white/5 bg-white/[0.02]">
          <Row rego="DPR76M" car="2017 VW Tiguan 132TSI"    days={15} price="$18,999"  tone="green" />
          <Row rego="VMDMR"  car="2022 Lamborghini Urus"    days={67} price="$369,000" tone="amber" />
          <Row rego="2CY1PF" car="2018 Mercedes C300"        days={92} price="$32,500"  tone="red"   />
          <Row rego="QRT332" car="2021 Toyota RAV4 Cruiser" days={6}  price="$41,750"  tone="green" />
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "money" }) {
  return (
    <div className="rounded-md p-2.5 bg-white/[0.025] border border-white/[0.04]">
      <p className="font-mono text-[9px] text-white/40 tracking-widest">{label}</p>
      <p className={`font-mono text-base font-medium leading-tight mt-1 ${tone === "money" ? "text-emerald-400" : "text-white"}`}>{value}</p>
    </div>
  )
}

function Row({ rego, car, days, price, tone }: { rego: string; car: string; days: number; price: string; tone: "green" | "amber" | "red" }) {
  const cls = tone === "red" ? "text-red-300" : tone === "amber" ? "text-amber-400" : "text-emerald-400"
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.04] last:border-b-0">
      <span className="font-mono text-[10px] text-white/40 w-14">{rego}</span>
      <span className="text-xs text-white flex-1 truncate">{car}</span>
      <span className={`font-mono text-[11px] w-8 text-right ${cls}`}>{days}d</span>
      <span className="font-mono text-xs font-medium text-white w-20 text-right">{price}</span>
    </div>
  )
}

/* ─── Hero ────────────────────────────────────────────────────────── */
const Hero = React.memo(function Hero() {
  return (
    <section
      id="platform"
      className="relative min-h-screen flex flex-col items-center justify-start px-6 py-24 md:py-32"
      style={{ animation: "v2FadeIn 0.6s ease-out" }}
    >
      <style>{`
        @keyframes v2FadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Announcement pill */}
      <aside className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
        <span className="text-xs text-gray-300">
          MAX is here — an AI assistant trained on your stock
        </span>
        <a
          href="#max"
          className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-all active:scale-95"
          aria-label="Read more about MAX"
        >
          Read more <ArrowRight size={12} />
        </a>
      </aside>

      <h1
        className="text-4xl md:text-6xl lg:text-7xl font-semibold text-center max-w-4xl px-6 leading-[1.05] mb-6"
        style={{
          background: "linear-gradient(to bottom, #ffffff 0%, #ffffff 60%, rgba(255, 255, 255, 0.55) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.04em",
        }}
      >
        Run a tighter yard.<br />Sell with conviction.
      </h1>

      <p className="text-base md:text-lg text-center max-w-2xl px-6 mb-10 text-gray-400 leading-relaxed">
        LMCT PRO is the dealer management platform built for the way Australian car
        traders actually work — auction Monday, recon Tuesday, listings live by Wednesday.
        Stock, sales, compliance and an AI assistant trained on your inventory.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 relative z-10 mb-16">
        <Link href="/demo">
          <Button type="button" variant="gradient" size="lg" className="rounded-lg">
            Book a demo
            <ArrowRight size={16} />
          </Button>
        </Link>
        <Link href="/auth/sign-up">
          <Button type="button" variant="ghost" size="lg" className="rounded-lg">
            Or start a 14-day trial
          </Button>
        </Link>
      </div>

      {/* Dashboard frame with glow */}
      <div className="w-full max-w-5xl relative pb-20">
        {/* Glow — CSS radial, no PNG */}
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-0"
          style={{
            top: "-12%",
            width: "90%",
            height: "120%",
            background:
              "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(200, 169, 110, 0.20) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <DashboardMockup />
        </div>
      </div>
    </section>
  )
})

/* ─── Main ────────────────────────────────────────────────────────── */
export default function Component() {
  return (
    <main className="min-h-screen bg-black text-white" style={{ fontFamily: "var(--font-jakarta), -apple-system, system-ui, sans-serif" }}>
      <Navigation />
      <Hero />
    </main>
  )
}
