import Link from "next/link"
import { Fraunces, Plus_Jakarta_Sans, DM_Mono } from "next/font/google"

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

// ── SVG icons. No emojis, no Lucide. Drawn for this brand. ───────────────
function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <div className={`${fraunces.variable} ${jakarta.variable} ${dmMono.variable}`}>
      <style>{`
        :root {
          --cream: #fdf8f0;
          --cream-2: #f6efe1;
          --ink: #0a1628;
          --ink-2: #1d2a3f;
          --ink-3: #4a5567;
          --gold: #d4921a;
          --gold-2: #b87a12;
          --rule: rgba(10, 22, 40, 0.10);
          --rule-2: rgba(10, 22, 40, 0.18);
        }
        .lmct-root {
          background: var(--cream);
          color: var(--ink);
          font-family: var(--font-jakarta), -apple-system, system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          font-feature-settings: "ss01", "ss02", "cv01";
        }
        .serif { font-family: var(--font-fraunces), Georgia, serif; font-feature-settings: "ss01"; }
        .mono  { font-family: var(--font-dm-mono), ui-monospace, monospace; }
        .kicker {
          font-family: var(--font-dm-mono), ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold-2);
        }
        .nav-link {
          font-family: var(--font-jakarta), sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--ink-2);
          transition: color 200ms cubic-bezier(.2,.8,.3,1);
        }
        .nav-link:hover { color: var(--ink); }
        .btn-primary {
          background: var(--ink);
          color: var(--cream);
          font-weight: 600;
          padding: 14px 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 200ms cubic-bezier(.2,.8,.3,1), box-shadow 200ms cubic-bezier(.2,.8,.3,1);
          font-size: 15px;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 14px 30px -10px rgba(10,22,40,0.4); }
        .btn-ghost {
          color: var(--ink);
          font-weight: 600;
          padding: 14px 20px;
          border-radius: 999px;
          border: 1px solid var(--rule-2);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          transition: background 200ms cubic-bezier(.2,.8,.3,1), border-color 200ms cubic-bezier(.2,.8,.3,1);
          font-size: 15px;
        }
        .btn-ghost:hover { background: var(--cream-2); border-color: var(--ink-2); }
        .h-display {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700;
          font-feature-settings: "ss01";
          letter-spacing: -0.025em;
          line-height: 0.95;
          color: var(--ink);
        }
        .h-section {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 600;
          letter-spacing: -0.018em;
          line-height: 1;
          color: var(--ink);
        }
        .lede { color: var(--ink-3); font-size: 18px; line-height: 1.55; max-width: 60ch; }
        .panel {
          background: var(--cream-2);
          border: 1px solid var(--rule);
          border-radius: 22px;
        }
        /* Hero dashboard mockup — composed in HTML, transformed in 3D */
        .mockup-stage {
          perspective: 2000px;
          perspective-origin: 50% 30%;
        }
        .mockup {
          background: linear-gradient(180deg, #12121e 0%, #0a0a12 100%);
          border-radius: 18px;
          border: 1px solid rgba(139, 92, 246, 0.18);
          box-shadow:
            0 60px 120px -40px rgba(10, 22, 40, 0.55),
            0 30px 60px -20px rgba(139, 92, 246, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          transform: rotateX(8deg) rotateY(-14deg) rotateZ(0.5deg);
          transform-style: preserve-3d;
          transition: transform 800ms cubic-bezier(.2,.8,.3,1);
        }
        .mockup:hover { transform: rotateX(4deg) rotateY(-8deg) rotateZ(0.5deg); }
        .mockup-stat { font-family: var(--font-dm-mono), monospace; }
        .mockup-row { border-bottom: 1px solid rgba(255,255,255,0.05); }
        .mockup-row:last-child { border-bottom: 0; }
        .mockup-dot { width: 6px; height: 6px; border-radius: 999px; }
        .lift {
          transition: transform 280ms cubic-bezier(.2,.8,.3,1), box-shadow 280ms cubic-bezier(.2,.8,.3,1);
        }
        .lift:hover { transform: translateY(-3px); box-shadow: 0 24px 50px -28px rgba(10,22,40,0.4); }
        .gold-rule { background: linear-gradient(90deg, transparent, var(--gold) 30%, var(--gold) 70%, transparent); height: 1px; }
        .ticker-item { border-left: 1px solid var(--rule); }
        .price-card { background: var(--cream); border: 1px solid var(--rule-2); border-radius: 22px; }
        .price-card.featured { background: var(--ink); color: var(--cream); border-color: var(--ink); }
        .pill {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(212, 146, 26, 0.12);
          color: var(--gold-2);
          border: 1px solid rgba(212, 146, 26, 0.25);
        }
        .footnote { color: var(--ink-3); font-size: 13px; }
        @keyframes blink-soft { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        .blink { animation: blink-soft 2.4s ease-in-out infinite; }
      `}</style>

      <main className="lmct-root min-h-screen">

        {/* ─── Top nav ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40" style={{ backdropFilter: "blur(10px)", background: "rgba(253, 248, 240, 0.78)", borderBottom: "1px solid var(--rule)" }}>
          <div className="mx-auto max-w-[1240px] flex items-center justify-between px-6 lg:px-10 h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <Mark />
              <span className="serif text-[19px] font-bold tracking-tight" style={{ color: "var(--ink)" }}>
                LMCT PRO
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-7">
              <a className="nav-link" href="#platform">Platform</a>
              <a className="nav-link" href="#how">How it works</a>
              <a className="nav-link" href="#voices">Dealers</a>
              <a className="nav-link" href="#pricing">Pricing</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="nav-link hidden sm:inline">Sign in</Link>
              <Link href="/auth/sign-up" className="btn-primary" style={{ padding: "10px 18px", fontSize: 14 }}>
                Start trial <Arrow />
              </Link>
            </div>
          </div>
        </header>

        {/* ─── Hero ────────────────────────────────────────────────────── */}
        <section className="relative pt-20 lg:pt-28 pb-24 lg:pb-32">
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <p className="kicker mb-6">For Licensed Motor Car Traders — VIC · NSW · QLD</p>
              <h1 className="h-display text-[52px] sm:text-[64px] lg:text-[78px]">
                Run a <span className="serif italic font-normal" style={{ color: "var(--gold)" }}>tighter</span> yard.
                <br />Sell with conviction.
              </h1>
              <p className="lede mt-8 text-[19px]">
                LMCT PRO is the dealer management platform built for the way Australian
                car traders actually work — auction Monday, recon Tuesday, listings live by Wednesday.
                One screen for your stock, your sales, your compliance, and the assistant
                that knows your inventory by heart.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link href="/auth/sign-up" className="btn-primary">
                  Start free for 14 days <Arrow />
                </Link>
                <a href="#platform" className="btn-ghost">
                  See the platform
                </a>
              </div>
              <p className="footnote mt-6">No credit card · Cancel anytime · Onboarded in under an hour.</p>
            </div>

            {/* 3D mockup */}
            <div className="lg:col-span-5">
              <div className="mockup-stage">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Trust strip ─────────────────────────────────────────────── */}
        <section className="border-y" style={{ borderColor: "var(--rule)", background: "var(--cream-2)" }}>
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Ticker label="LMCT compliance" body="VP151, dealings register, statutory warranty — generated, not chased." />
            <Ticker label="Australian built" body="Designed around VicRoads, fairtrading.nsw.gov.au, and the ACL." />
            <Ticker label="Mobile first" body="Add a car at the auction. Print a receipt from your phone. Install as an app." />
            <Ticker label="Your data, yours" body="Row-level isolation. Export everything as CSV the moment you ask." />
          </div>
        </section>

        {/* ─── Pillar 1 — Inventory ────────────────────────────────────── */}
        <section id="platform" className="py-28 lg:py-36">
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <p className="kicker mb-4">01 — Inventory</p>
              <h2 className="h-section text-[40px] sm:text-[48px] lg:text-[56px]">
                Every car answered for,
                <span className="serif italic font-normal" style={{ color: "var(--gold)" }}> every day.</span>
              </h2>
              <p className="lede mt-6">
                A real working table — not a card grid. Sort by days held, filter by what&apos;s
                missing, drop ten photos in at once, and let the assistant write the listing.
                Stale stock surfaces before it costs you a margin point.
              </p>
              <ul className="mt-8 space-y-3.5">
                <Feat>Days-in-stock with action bands at 30, 60 and 90.</Feat>
                <Feat>Quality flags for No Photos · No Description · PPSR Pending.</Feat>
                <Feat>Listing builder writes Facebook, Carsales and Gumtree copy from one click.</Feat>
                <Feat>Scanner adds a vehicle from a rego plate in twelve seconds.</Feat>
              </ul>
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2">
              <InventoryVignette />
            </div>
          </div>
        </section>

        {/* ─── Pillar 2 — Compliance ───────────────────────────────────── */}
        <section className="py-28 lg:py-36" style={{ background: "var(--cream-2)" }}>
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-7">
              <ComplianceVignette />
            </div>
            <div className="lg:col-span-5">
              <p className="kicker mb-4">02 — Compliance</p>
              <h2 className="h-section text-[40px] sm:text-[48px] lg:text-[56px]">
                The forms, the register,
                <span className="serif italic font-normal" style={{ color: "var(--gold)" }}> the licence.</span>
              </h2>
              <p className="lede mt-6">
                The paper that used to sit on your desk is now produced when you need
                it and filed when you don&apos;t. The dealings register prints itself
                quarterly. The buyer receipt goes out with the keys.
              </p>
              <ul className="mt-8 space-y-3.5">
                <Feat>VicRoads VP151 transfer prepopulated from the sale.</Feat>
                <Feat>Dealings register formatted to the LMCT requirement.</Feat>
                <Feat>GST summary, BAS-ready. Quarterly export to your accountant.</Feat>
                <Feat>Statutory warranty defaults to the VIC cars-under-10-year rule.</Feat>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── Pillar 3 — Assistant ────────────────────────────────────── */}
        <section className="py-28 lg:py-36">
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-5">
              <p className="kicker mb-4">03 — Intelligence</p>
              <h2 className="h-section text-[40px] sm:text-[48px] lg:text-[56px]">
                A digital colleague
                <span className="serif italic font-normal" style={{ color: "var(--gold)" }}> who knows your yard.</span>
              </h2>
              <p className="lede mt-6">
                MAX answers questions about your business with your data — not a generic
                chatbot. Ask &ldquo;what should I do with the white Tiguan?&rdquo; and you
                get the days held, the asking price, the comparable sales and a
                specific suggestion. Trained on your tone of voice.
              </p>
              <ul className="mt-8 space-y-3.5">
                <Feat>Lives inside your stock, sales and customer database.</Feat>
                <Feat>Personalised — give MAX a name and a personality once.</Feat>
                <Feat>Drafts listings, calculates margin, suggests action on aged stock.</Feat>
                <Feat>Runs on Claude. Cached for speed, billed inside your subscription.</Feat>
              </ul>
            </div>
            <div className="lg:col-span-7">
              <AssistantVignette />
            </div>
          </div>
        </section>

        {/* ─── How it works ────────────────────────────────────────────── */}
        <section id="how" className="py-28 border-t" style={{ borderColor: "var(--rule)" }}>
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
            <div className="grid lg:grid-cols-12 gap-12 mb-16">
              <div className="lg:col-span-4">
                <p className="kicker mb-3">How it works</p>
                <h2 className="h-section text-[40px] sm:text-[48px]">
                  An hour to set up. <br/>A morning to fall in love with it.
                </h2>
              </div>
              <p className="lg:col-span-7 lg:col-start-6 lede self-end">
                Most dealers we onboard are running a real sale through LMCT PRO by the end
                of their first day. The team will move your existing stock in for you if
                that&apos;s where you&apos;d rather start.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-10">
              <Step n="01" title="Sign up" body="Drop your ABN, LMCT number and dealer details. We provision your workspace inside five minutes, isolated from every other dealer." />
              <Step n="02" title="Bring in your stock" body="Photograph from your phone, paste a rego, or hand it to us — we&rsquo;ll import from your spreadsheet, CSV, or current DMS." />
              <Step n="03" title="Sell on" body="Record sales, print transfers, email receipts. The numbers add themselves up at the end of the quarter." />
            </div>
          </div>
        </section>

        {/* ─── Voices ──────────────────────────────────────────────────── */}
        <section id="voices" className="py-28" style={{ background: "var(--cream-2)" }}>
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
            <p className="kicker mb-3">Dealers</p>
            <h2 className="h-section text-[40px] sm:text-[48px] max-w-[14ch] mb-14">
              Built around the way a real yard runs.
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Quote
                body="We were paying a bookkeeper to chase the dealings register every quarter. Now it prints itself. The aged-stock email pings me before I notice the car&rsquo;s gone stale."
                who="James W."
                where="Geelong"
              />
              <Quote
                body="The listing builder gives me Facebook, Carsales and Gumtree copy in one click. Saturday morning is for selling cars again, not typing."
                who="Anh N."
                where="Bankstown"
              />
              <Quote
                body="MAX knows my stock. I asked what to do with a 2018 Ranger sitting at 84 days — it gave me the comparables and a price. Sold it that week."
                who="Marco D."
                where="Brunswick"
              />
            </div>
          </div>
        </section>

        {/* ─── Pricing ─────────────────────────────────────────────────── */}
        <section id="pricing" className="py-28">
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10">
            <div className="mb-14 grid lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7">
                <p className="kicker mb-3">Pricing</p>
                <h2 className="h-section text-[40px] sm:text-[48px]">
                  Three ways to run your yard
                  <span className="serif italic font-normal" style={{ color: "var(--gold)" }}> on LMCT PRO.</span>
                </h2>
              </div>
              <p className="lg:col-span-5 lede">
                Start with the software and add hands when you&apos;re ready. All plans
                include the assistant, all compliance reports, and unlimited stock.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              <PriceCard
                kicker="Software"
                title="Software + AI"
                price="$249"
                period="/ month"
                description="The full platform, on your phone and your laptop, with the assistant trained on your stock."
                features={[
                  "Unlimited vehicles, sales and customers",
                  "All compliance reports + PDF + CSV",
                  "MAX, your AI assistant",
                  "Resend buyer receipts",
                  "Mobile / PWA install",
                ]}
                cta="Start free trial"
                href="/auth/sign-up"
              />
              <PriceCard
                featured
                kicker="Most chosen"
                title="Done For You"
                price="$799"
                period="/ month"
                description="We take the listings, the photo retouching, the buyer follow-up. You focus on buying and closing."
                features={[
                  "Everything in Software + AI",
                  "Listings written and posted for you",
                  "Photo cleanup and watermarking",
                  "Buyer enquiry triage",
                  "Quarterly compliance audit",
                ]}
                cta="Talk to us"
                href="mailto:hello@lmctpro.com.au"
              />
              <PriceCard
                kicker="At scale"
                title="Growth"
                price="Let’s talk"
                period=""
                description="Multi-yard operators, finance brokers, and dealer groups that need bespoke integration."
                features={[
                  "Everything in Done For You",
                  "Multi-yard consolidation",
                  "Custom Carsales / AutoGrab integration",
                  "Dedicated specialist",
                  "Service-level agreement",
                ]}
                cta="Contact us for pricing"
                href="mailto:hello@lmctpro.com.au"
              />
            </div>
          </div>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────────── */}
        <section className="py-28 border-t" style={{ borderColor: "var(--rule)" }}>
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10 grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <p className="kicker mb-3">Questions</p>
              <h2 className="h-section text-[40px] sm:text-[48px]">
                Things dealers ask first.
              </h2>
              <p className="lede mt-6">
                Don&rsquo;t see your question? Email us at{" "}
                <a href="mailto:hello@lmctpro.com.au" className="underline underline-offset-4" style={{ color: "var(--ink)" }}>
                  hello@lmctpro.com.au
                </a>{" "}— we usually reply same-day.
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 divide-y" style={{ borderColor: "var(--rule)" }}>
              <Faq
                q="Will this replace my current DMS?"
                a="Yes. LMCT PRO covers stock, sales, customers, compliance and reporting. We’ll migrate your existing data — CSV from a spreadsheet, export from your current system, or by hand if that’s easiest."
              />
              <Faq
                q="Is it built for VIC dealers specifically?"
                a="Built first for VIC because that’s where we know the rules best — VP151, statutory warranty, the dealings register requirement. NSW and QLD are first-class; other states are coming."
              />
              <Faq
                q="What about my accountant?"
                a="The GST report is BAS-ready. Quarterly CSV exports drop into Xero or MYOB cleanly. Direct Xero integration is on the roadmap; in the meantime accountants tell us our PDFs are easier to read than what they were getting before."
              />
              <Faq
                q="How does the AI assistant get my data?"
                a="The assistant runs server-side. Your stock, sales and customer records are read under your authenticated session — row-level security means no other dealer ever sees your data, including the AI. We use Claude under the hood and cache the system prompt to keep it fast and affordable."
              />
              <Faq
                q="Can I leave?"
                a="Any time. Export every record as CSV in one click. We keep no data hostage and we don’t lock you in."
              />
            </div>
          </div>
        </section>

        {/* ─── Final CTA ───────────────────────────────────────────────── */}
        <section className="py-24" style={{ background: "var(--ink)", color: "var(--cream)" }}>
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10 text-center">
            <p className="kicker mb-5" style={{ color: "var(--gold)" }}>Start today</p>
            <h2 className="serif text-[44px] sm:text-[60px] font-bold tracking-tight" style={{ lineHeight: 0.98 }}>
              Fourteen days. <span className="italic font-normal" style={{ color: "var(--gold)" }}>No credit card.</span>
            </h2>
            <p className="mt-6 mx-auto max-w-[52ch] text-[17px]" style={{ color: "rgba(253,248,240,0.7)" }}>
              Sign up, bring in a handful of vehicles, run a sale. If LMCT PRO doesn&rsquo;t
              feel like the easiest software your dealership has ever used, we&rsquo;ll help
              you export every record and part as friends.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: "var(--cream)", color: "var(--ink)", fontSize: 15 }}
              >
                Start free trial <Arrow />
              </Link>
              <a
                href="mailto:hello@lmctpro.com.au"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold border transition-colors hover:bg-white/5"
                style={{ borderColor: "rgba(253,248,240,0.25)", color: "var(--cream)", fontSize: 15 }}
              >
                Talk to a human
              </a>
            </div>
          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <footer className="py-12 border-t" style={{ borderColor: "var(--rule)" }}>
          <div className="mx-auto max-w-[1240px] px-6 lg:px-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Mark />
              <span className="serif text-[16px] font-bold tracking-tight" style={{ color: "var(--ink)" }}>LMCT PRO</span>
            </div>
            <p className="mono text-[11px]" style={{ color: "var(--ink-3)", letterSpacing: "0.06em" }}>
              © {new Date().getFullYear()} LMCT PRO PTY LTD · MELBOURNE
            </p>
            <div className="flex items-center gap-6 text-[13px]" style={{ color: "var(--ink-3)" }}>
              <a href="#" className="hover:opacity-80">Privacy</a>
              <a href="#" className="hover:opacity-80">Terms</a>
              <a href="mailto:hello@lmctpro.com.au" className="hover:opacity-80">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

/* ── Components ──────────────────────────────────────────────────────── */

function Mark() {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ink)" }}
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fdf8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17V9a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v8" />
        <circle cx="7.5" cy="17.5" r="2.5" />
        <circle cx="16.5" cy="17.5" r="2.5" />
      </svg>
    </span>
  )
}

function Ticker({ label, body }: { label: string; body: string }) {
  return (
    <div className="ticker-item pl-5">
      <p className="kicker mb-1">{label}</p>
      <p className="text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{body}</p>
    </div>
  )
}

function Feat({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px]" style={{ color: "var(--ink-2)" }}>
      <span aria-hidden="true" className="mt-1.5 inline-block" style={{ width: 18, height: 1, background: "var(--gold)" }} />
      <span>{children}</span>
    </li>
  )
}

function Step({ n, title, body }: { n: string; title: string; body: React.ReactNode }) {
  return (
    <div>
      <p className="mono text-[13px] mb-3" style={{ color: "var(--gold-2)", letterSpacing: "0.16em" }}>{n}</p>
      <h3 className="serif text-[26px] font-bold mb-2" style={{ color: "var(--ink)" }}>{title}</h3>
      <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-3)" }}>{body}</p>
    </div>
  )
}

function Quote({ body, who, where }: { body: string; who: string; where: string }) {
  return (
    <figure className="panel p-7 lift">
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden="true" style={{ marginBottom: 18 }}>
        <path d="M0 22V13.5C0 6 4 1 11 0V4.5C7 5.5 4.5 8.5 4.5 13H11V22H0ZM17 22V13.5C17 6 21 1 28 0V4.5C24 5.5 21.5 8.5 21.5 13H28V22H17Z" fill="#d4921a" fillOpacity="0.35" />
      </svg>
      <blockquote className="serif text-[19px] leading-snug" style={{ color: "var(--ink)" }}>
        {body}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-2 text-[13px]">
        <span className="font-semibold" style={{ color: "var(--ink)" }}>{who}</span>
        <span style={{ color: "var(--ink-3)" }}>·</span>
        <span className="mono uppercase" style={{ color: "var(--ink-3)", letterSpacing: "0.12em", fontSize: 11 }}>{where}</span>
      </figcaption>
    </figure>
  )
}

function PriceCard({
  kicker, title, price, period, description, features, cta, href, featured,
}: {
  kicker: string; title: string; price: string; period: string; description: string;
  features: string[]; cta: string; href: string; featured?: boolean;
}) {
  const body  = featured ? "rgba(253,248,240,0.88)" : "var(--ink-2)"
  const muted = featured ? "rgba(253,248,240,0.65)" : "var(--ink-3)"
  return (
    <div className={`price-card lift p-8 flex flex-col${featured ? " featured" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="pill" style={featured ? { background: "rgba(212,146,26,0.18)", color: "var(--gold)", borderColor: "rgba(212,146,26,0.35)" } : undefined}>{kicker}</p>
      </div>
      <h3 className="serif text-[28px] font-bold mt-5" style={{ color: featured ? "var(--cream)" : "var(--ink)" }}>{title}</h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="mono text-[34px] font-medium" style={{ color: featured ? "var(--cream)" : "var(--ink)" }}>{price}</span>
        {period && <span className="mono text-[14px]" style={{ color: muted }}>{period}</span>}
      </div>
      <p className="text-[15px] leading-relaxed mt-5" style={{ color: body }}>{description}</p>
      <ul className="mt-7 space-y-2.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[14px]" style={{ color: body }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={featured ? "var(--gold)" : "var(--gold-2)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-9 inline-flex items-center justify-between rounded-full px-5 py-3 font-semibold transition-transform hover:-translate-y-0.5"
        style={featured
          ? { background: "var(--gold)", color: "var(--ink)", fontSize: 14 }
          : { background: "var(--ink)", color: "var(--cream)", fontSize: 14 }}
      >
        <span>{cta}</span>
        <Arrow />
      </Link>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="py-5 group">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="serif text-[20px] font-semibold pr-6" style={{ color: "var(--ink)" }}>{q}</span>
        <span className="shrink-0 grid place-items-center transition-transform group-open:rotate-45" aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 999, border: "1px solid var(--rule-2)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>
      <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-3)" }}>{a}</p>
    </details>
  )
}

/* ── 3D dashboard mockup ────────────────────────────────────────────── */

function DashboardMockup() {
  return (
    <div className="mockup p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span className="mockup-dot" style={{ background: "rgba(255,255,255,0.18)" }} />
          <span className="mockup-dot" style={{ background: "rgba(255,255,255,0.18)" }} />
          <span className="mockup-dot" style={{ background: "rgba(255,255,255,0.18)" }} />
        </div>
        <span className="mockup-stat text-[10px]" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>LMCTPRO.COM.AU / DASHBOARD</span>
        <span className="mockup-stat text-[10px] inline-flex items-center gap-1.5" style={{ color: "#a78bfa" }}>
          <span className="blink" style={{ width: 6, height: 6, borderRadius: 999, background: "#a78bfa" }} />
          MAX
        </span>
      </div>

      <div className="mb-4">
        <p className="text-[13px] font-semibold" style={{ color: "#f1f0ff" }}>Westside Motors</p>
        <p className="mockup-stat text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>WED · 27 MAY</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <MockKpi label="IN STOCK"      value="42"    accent="#f1f0ff" />
        <MockKpi label="SOLD MTD"      value="11"    accent="#10b981" />
        <MockKpi label="REVENUE"       value="$284K" accent="#f1f0ff" />
        <MockKpi label="PROFIT"        value="$48K"  accent="#10b981" />
      </div>

      <div className="rounded-lg p-2.5 mb-3 flex items-center gap-2" style={{ background: "rgba(239, 68, 68, 0.10)", border: "1px solid rgba(239, 68, 68, 0.22)" }}>
        <span className="mockup-stat text-[10px] font-semibold" style={{ color: "#fca5a5" }}>3 VEHICLES AGED 60+</span>
        <span className="mockup-stat text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>· $74K tied up</span>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <MockRow rego="DPR76M" car="2017 VW Tiguan 132TSI"     days={15} price="$18,999"  tone="ok" />
        <MockRow rego="VMDMR"  car="2022 Lamborghini Urus"      days={67} price="$369,000" tone="warn" />
        <MockRow rego="2CY1PF" car="2018 Mercedes C300"         days={92} price="$32,500"  tone="danger" />
        <MockRow rego="QRT332" car="2021 Toyota RAV4 Cruiser"   days={6}  price="$41,750"  tone="ok" />
      </div>
    </div>
  )
}

function MockKpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-md p-2.5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <p className="mockup-stat text-[9px]" style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>{label}</p>
      <p className="mockup-stat text-[18px] font-medium leading-tight mt-1" style={{ color: accent }}>{value}</p>
    </div>
  )
}

function MockRow({ rego, car, days, price, tone }: { rego: string; car: string; days: number; price: string; tone: "ok" | "warn" | "danger" }) {
  const dColor = tone === "danger" ? "#fca5a5" : tone === "warn" ? "#fbbf24" : "#34d399"
  return (
    <div className="mockup-row flex items-center gap-3 px-3 py-2">
      <span className="mockup-stat text-[10px]" style={{ color: "rgba(255,255,255,0.4)", width: 60 }}>{rego}</span>
      <span className="text-[12px] flex-1 truncate" style={{ color: "#f1f0ff" }}>{car}</span>
      <span className="mockup-stat text-[11px]" style={{ color: dColor }}>{days}d</span>
      <span className="mockup-stat text-[11px] font-medium" style={{ color: "#f1f0ff", width: 64, textAlign: "right" }}>{price}</span>
    </div>
  )
}

/* ── Pillar vignettes ────────────────────────────────────────────────── */

function InventoryVignette() {
  return (
    <div className="panel p-6 lg:p-8 lift">
      <div className="flex items-center justify-between mb-5">
        <span className="pill">Stock · 42 vehicles</span>
        <div className="flex gap-1.5">
          <span className="mono text-[10px] px-2 py-1 rounded-md" style={{ background: "var(--ink)", color: "var(--cream)" }}>TABLE</span>
          <span className="mono text-[10px] px-2 py-1 rounded-md" style={{ border: "1px solid var(--rule-2)", color: "var(--ink-3)" }}>GRID</span>
        </div>
      </div>
      <div className="space-y-1">
        {[
          { stock: "S-104", car: "2021 Toyota RAV4 Cruiser",     body: "SUV",   days: 6,  price: "$41,750", tone: "ok" },
          { stock: "S-097", car: "2017 VW Tiguan 132TSI",        body: "SUV",   days: 15, price: "$18,999", tone: "ok" },
          { stock: "S-088", car: "2022 Mazda CX-5 Akera",        body: "SUV",   days: 41, price: "$46,900", tone: "watch" },
          { stock: "S-073", car: "2018 Mercedes C300",            body: "Sedan", days: 92, price: "$32,500", tone: "danger" },
          { stock: "S-069", car: "2019 Hyundai i30 N-Line",      body: "Hatch", days: 11, price: "$24,990", tone: "ok" },
        ].map((row) => (
          <div key={row.stock} className="flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/40">
            <span className="mono text-[12px]" style={{ color: "var(--ink-3)", width: 44 }}>{row.stock}</span>
            <span className="text-[14px] flex-1 truncate" style={{ color: "var(--ink)" }}>{row.car}</span>
            <span className="mono text-[12px]" style={{ color: "var(--ink-3)", width: 50 }}>{row.body}</span>
            <span
              className="mono text-[12px] font-medium"
              style={{
                color: row.tone === "danger" ? "#b91c1c" : row.tone === "watch" ? "#b45309" : "#047857",
                width: 36, textAlign: "right",
              }}
            >
              {row.days}d
            </span>
            <span className="mono text-[13px] font-medium" style={{ color: "var(--ink)", width: 72, textAlign: "right" }}>{row.price}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between pt-5" style={{ borderTop: "1px solid var(--rule)" }}>
        <p className="mono text-[11px]" style={{ color: "var(--ink-3)", letterSpacing: "0.1em" }}>QUALITY FILTERS</p>
        <div className="flex gap-2 flex-wrap">
          <span className="mono text-[10px] px-2.5 py-1 rounded-full" style={{ border: "1px solid var(--rule-2)", color: "var(--ink-2)" }}>No photos · 3</span>
          <span className="mono text-[10px] px-2.5 py-1 rounded-full" style={{ border: "1px solid var(--rule-2)", color: "var(--ink-2)" }}>No description · 1</span>
          <span className="mono text-[10px] px-2.5 py-1 rounded-full" style={{ border: "1px solid var(--rule-2)", color: "var(--ink-2)" }}>PPSR pending · 5</span>
        </div>
      </div>
    </div>
  )
}

function ComplianceVignette() {
  return (
    <div className="panel p-6 lg:p-8 lift relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 gold-rule" />
      <p className="kicker mb-4">VicRoads VP151 — Transfer of Registration</p>
      <h3 className="serif text-[24px] font-bold mb-1" style={{ color: "var(--ink)" }}>2018 Mercedes-Benz C300</h3>
      <p className="mono text-[12px]" style={{ color: "var(--ink-3)" }}>STOCK S-073 · REGO 2CY1PF · VIN WDDWF4DB8JR353201</p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-7">
        <FormRow k="Buyer"      v="Emma S." />
        <FormRow k="Licence"    v="VIC · 09421003" />
        <FormRow k="Address"    v="42 Park Road, Hawthorn" />
        <FormRow k="Phone"      v="0413 552 081" />
        <FormRow k="Sale date"  v="27 May 2026" />
        <FormRow k="Sale price" v="$32,500.00" />
        <FormRow k="Deposit"    v="$2,000.00" />
        <FormRow k="Warranty"   v="Statutory · 3 mo / 5,000km" />
      </div>

      <div className="mt-7 grid grid-cols-3 gap-2.5">
        <MiniPill label="Tax invoice" />
        <MiniPill label="Transfer form" />
        <MiniPill label="Buyer receipt" />
      </div>
    </div>
  )
}
function FormRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col">
      <span className="mono text-[10px] mb-1" style={{ color: "var(--ink-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{k}</span>
      <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{v}</span>
    </div>
  )
}
function MiniPill({ label }: { label: string }) {
  return (
    <div className="text-center py-2.5 rounded-lg mono text-[11px]" style={{ background: "var(--ink)", color: "var(--cream)", letterSpacing: "0.08em" }}>
      {label}
    </div>
  )
}

function AssistantVignette() {
  return (
    <div
      className="rounded-2xl p-6 lg:p-8 lift relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0a0a12 0%, #18182a 100%)",
        border: "1px solid rgba(139,92,246,0.18)",
        boxShadow: "0 30px 80px -30px rgba(139,92,246,0.25)",
      }}
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="blink" style={{ width: 8, height: 8, borderRadius: 999, background: "#a78bfa" }} />
        <span className="mono text-[11px]" style={{ color: "#a78bfa", letterSpacing: "0.18em" }}>MAX · ONLINE</span>
      </div>

      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3" style={{ background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.25)" }}>
          <p className="text-[14px]" style={{ color: "#f1f0ff" }}>What should I do with the white Tiguan?</p>
        </div>
      </div>

      <div className="flex">
        <div className="max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[14px] leading-relaxed" style={{ color: "#f1f0ff" }}>
            The <span style={{ color: "#a78bfa" }}>2017 Tiguan 132TSI (DPR76M)</span> has been on the lot 15 days at <span className="mono">$18,999</span>.
          </p>
          <p className="text-[14px] leading-relaxed mt-2" style={{ color: "rgba(241,240,255,0.78)" }}>
            Comparables in your last 90 days sold around <span className="mono">$18.2K–$19.4K</span>, average 22 days held.
            You&rsquo;re inside the band, slightly early. Hold for now — revisit at 30 days
            and consider <span style={{ color: "#fbbf24" }}>$17,990</span> if no enquiries by then.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["lookup_vehicle_by_rego", "stock_summary", "top_makes_last_n_days"].map((t) => (
          <span key={t} className="mono text-[10px] px-2.5 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.10)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.20)", letterSpacing: "0.04em" }}>
            {t}()
          </span>
        ))}
      </div>
    </div>
  )
}
