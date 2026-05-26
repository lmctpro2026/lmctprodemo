# LMCT PRO — Product strategy & architecture

Living doc. Updated 2026-05-27. Read this before making product decisions.

## The moat (why we win)

EasyCars and Virtual Yard are old: bootstrap-era UIs, no AI, no mobile-first, no cross-dealer learning, no specialist service. They charge dealers software fees and walk away. **We sell software AND the human specialist AND, eventually, the only Australian used-car data engine that has any signal.** Each tier raises switching cost.

| Tier | Today | Phase 2 | Phase 3 |
|---|---|---|---|
| Software | DMS + AI MAX + listings + forms | Mobile scanner + plate API + multi-channel autopost | Real-time benchmarks |
| Specialist | Done For You ($799) — listings, enquiries, website | Same, more dealers per specialist | Specialist becomes a *team* tier |
| Data | (none — building) | Aggregated trends inside the dealer UI | The Bloomberg of Australian used cars |

**The data engine is the long moat.** Once 50+ dealers feed in stock+sales daily, we know — better than anyone in Australia — what's selling, at what price, in which suburb, how fast. That insight goes back to dealers as features ("Camrys turning in 14 days at $23k median in your 50km radius"), and outward as licensable B2B data later.

## Mobile app — PWA first, RN later

Decision: **Progressive Web App, not React Native.** Reasons:
- One codebase, one deploy, one auth surface
- iOS Add-to-Home-Screen + offline cache covers 90% of native UX
- Camera + plate OCR available via Web APIs (`getUserMedia`, `Tesseract.js`, or server-side OCR)
- Native app stores add 1–2 weeks of review pain for v1
- React Native makes sense in Phase 2 if a feature genuinely needs native (push notifications, deeper biometrics, etc.)

Concrete work (separate task — PWA): `public/manifest.json`, `next-pwa` for service worker, iOS meta tags, responsive nav (bottom tab bar on mobile, sidebar on desktop), camera scanner UI on `/dashboard/scanner`.

## Plate API — `lib/vehicle-lookup.ts`

Abstraction shipped today. Currently a **stub** that returns plausible synthetic data based on rego format, so the UI can be wired without an API key. Swap the stub for a real call when you pick a vendor:

| Vendor | Strength | Pricing | Best for |
|---|---|---|---|
| **AutoGrab** | Best AU coverage, includes vehicle history | ~$1–3 per lookup | Production. Recommended. |
| CarCheck.com.au | PPSR + financial encumbrance | ~$2 per cert | If we need write-off/stolen checks |
| RegCheckAU | Basic — just registration details | Low | Cheap fallback |
| VicRoads / govt | Cumbersome, requires LMCT cert | Free-ish | Last resort |

For mobile: plate is captured via camera → OCR'd → same `lookupVehicleByRego(rego)` call → server proxies to vendor → returns vehicle data → prefills `VehicleDialog`. **The abstraction is the contract.** The vendor is hot-swappable.

## Data engine architecture (`/admin`)

Founder-only route. Role-gated via `profiles.role = 'founder'`.

### Schema (added by `scripts/004_add_admin_roles.sql`)

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'dealer';
-- After applying: UPDATE profiles SET role='founder' WHERE id = '<your user uuid>';
```

### Phases

**v1 (today's skeleton):** aggregate counts. Total dealers, total vehicles, total sales, total revenue, top makes, average margin. Read directly from `vehicles`/`sales` via the *founder*'s server-side client, bypassing dealer RLS via role check in the layout. Cheap, ~5 queries.

**v2 (when 10+ dealers):** materialized views refreshed nightly. Avoids slow scans as data grows. Pre-computed dimensions: by make, by body, by state, by month. Read fast, refresh cheap.

**v3 (the "movie style" engine):** real-time activity feed via Supabase Realtime channels. Live event stream: *"Dealer in Pakenham just sold a 2020 RAV4 for $34,500, 18% margin"* (with dealer name **redacted** beyond city level — anonymization is non-negotiable; we're not the dealer's competition, we're their data ally). Live charts powered by streamed inserts. Animated graph of stock moving between Available → Reserved → Sold.

### Anonymization rules (read carefully)

Inside the dealer's own UI: full data (their own + comparables stripped of dealer ID, e.g. *"median Camry sale in Melbourne SE was $23,200"*).

Inside `/admin`: founder sees aggregates. **Individual dealer rows surfaced only with explicit consent** (e.g., for support: "dealer X reports a problem, look at their stock") — never for general "spying." If we ever sell data outwards, only aggregates at city-state level minimum. This is both ethical and the actual moat — dealers tolerate the data layer **only because we don't betray them with it**.

## AI per dealer — centralized key, personalized memory

Architectural answer to your question:

- **ONE Anthropic API key** lives in `ANTHROPIC_API_KEY` on Vercel. You pay. Dealers never see it.
- **Per-dealer personality** comes from:
  - `profiles.ai_name` — they can rename MAX to "Karen"
  - `profiles.ai_personality` — direct / friendly / formal tone
  - `profiles.ai_training` — they paste custom instructions ("I do utes only, don't recommend sedans")
- **Per-dealer memory** comes from `chat_history` (RLS-isolated; each dealer sees only their own conversations)
- **Per-dealer context** is injected fresh on every call — system prompt includes their last-90-day sales summary + current stock list

So when dealer types *"how much profit on the Tiguan last month"*, MAX:
1. Receives the question + dealer's `ai_training` + recent stock/sales summary as system prompt
2. Calls the `get_sale_for_vehicle` tool (Claude tool-use / function calling)
3. Tool runs server-side under the dealer's RLS session — returns the matching `sales` row
4. MAX formats the answer

**Tools planned** (T-AI-tool-use task):
- `lookup_vehicle_by_rego(rego)` — search dealer's `vehicles`
- `get_sale_for_vehicle(vehicle_id)` — profit/margin from `sales`
- `stock_summary()` — counts by status / body / aged buckets
- `top_makes_last_n_days(days)` — which brands sold fastest
- `aged_stock_action_plan()` — which 60+ day cars need a price drop

Each tool is a small, safe, read-only function. RLS naturally limits scope — dealer's session means dealer's data only.

## EasyCars analysis (from your screenshots)

**Borrow these:** Quick-quality filters (No Images / No Description / No PPSR), days-in-stock histogram, PPSR ordering UI, Lead Sources field on customers, image watermarking, integration tab idea.

**Leapfrog these:** AI (they have none), modern dark UI, single-page UX, plate scanner, specialist service tier, real-time charts, cross-dealer data engine, AI-generated listings, mobile-first.

**Ignore for v1:** multi-yard, floor plan tracking, commission rates, custom vehicle schemas. Most VIC LMCT targets are owner-operators with one yard and no sales staff — premature features for v1.

## Sequencing

### Week 1 (launch — what's left)
1. Smoke test current state end-to-end (signup → stock → sale → forms) on localhost
2. **T10 — Claude tool-use chat** (you provide `ANTHROPIC_API_KEY`)
3. **T11 — Resend post-sale email** (you set up Resend + domain)
4. Commit + push to Vercel; set env vars in Vercel dashboard
5. Final QA on Vercel production with a real test dealer

### Week 2–4 (post-launch hardening)
1. PWA shell + manifest + service worker
2. Plate API vendor pick + real integration
3. Mobile camera scanner UI
4. EasyCars-inspired quality filters
5. PPSR ordering UI
6. T12 — Stripe self-serve
7. Vehicle image upload + Supabase Storage

### Phase 2 (10+ dealers)
1. Admin dashboard v2 — materialized views
2. Lead Sources, multi-yard option, commission rates (gated to higher-tier dealers)

### Phase 3 (50+ dealers)
1. The "movie style" real-time data engine
2. Cross-dealer benchmarking surfaced in dealer UI
3. Data licensing exploration (insurance companies, OEMs, finance lenders)
