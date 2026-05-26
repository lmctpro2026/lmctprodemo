# HANDOFF — LMCT PRO

You're a fresh Claude session. Read this + the files named here. Don't re-survey the codebase.

LMCT PRO is a Next.js 15 + Supabase SaaS dealer-management system for Australian Licensed Motor Car Traders. Owner-dev: Sam (sami@studyin.com.au). Target: first paying VIC dealer in 7 days from 2026-05-27. Repo: `github.com/edgematrx/lmctprodemo`. Vercel project: **`v0-lmct-pro-website`** — `lmctprodemo` is legacy, ignore it.

---

## 1. Current task — exact next step

User is **smoke-testing the app** at http://localhost:3000 (dev server is currently running in this session via preview MCP; if it's not, start with `npm run dev`).

The unblocked code-side next move is **T10 (Anthropic Claude tool-use chat)** — blocked on user dropping `ANTHROPIC_API_KEY`. Until then, you should:

1. **Verify dev server**: `curl -sI http://localhost:3000` → 200, or start it with `cd "/Users/mrahman/Desktop/LMCT PRO UPDATE" && npm run dev`
2. **Verify live DB matches code**: `node --env-file=.env.local scripts/probe-schema.mjs` → must print 7× ✓
3. **Ask user**: have you applied `scripts/004_add_admin_roles.sql` and set `role='founder'`? If not, tell them to (instructions in the SQL file header).
4. **Wait for `ANTHROPIC_API_KEY`** OR work on T15/T17 (PWA setup, EasyCars-inspired quality filters) — both are unblocked.

Do NOT start T10 work without the key — the regex stub is functional, just dumb, and writing inert tool-use code now wastes 30 min if their key arrives in the next turn.

---

## 2. Done this session

`npx tsc --noEmit` exit 0. `npm run build` passes. 13 files modified, none reverted.

### Schema reconciliation (T1–T6 done)
SQL is the source of truth. Live Supabase was running an old schema (`dealership_name`/`body_type`/`asking_price`/`gross_profit`); all three layers now agree on the new names.

- `lib/types.ts` — rewritten as 1:1 mirror of `scripts/001_create_schema.sql`. 7 interfaces, 5 status enums, `ProfileRole` added.
- `scripts/000_reset_and_setup.sql` — **the canonical schema paste**. Drops + recreates the 4 mismatched tables (profiles/vehicles/customers/sales), bundles 001+002+003 inline, enhanced trigger reads `dealer_name`/`lmct`/`abn`/`phone` + composes `address` from `suburb`+`state`. **Already applied to live DB this session.**
- `scripts/001_create_schema.sql` — historical (was incomplete; kept for context)
- `scripts/002_add_missing_fields.sql` — historical (added variant/stock_number/features, date_of_birth — bundled into 000)
- `scripts/003_add_sale_fields.sql` — historical (added payment_method/deposit_amount/warranty — bundled into 000)
- `scripts/004_add_admin_roles.sql` — **NOT YET APPLIED**. Adds `profiles.role` for /admin gating. User must paste + set themselves as founder.
- 25+ UI field-name updates: `gross_profit→profit`, `margin_percent→margin`, `body_type→body`, `fuel_type→fuel`, `asking_price→price`, `purchase_date→acquisition_date`, `purchase_source→source`, `dealership_name→dealer_name`, `lmct_number→lmct`, `license_number→license`, `buyer_first/last→buyer_name`, `expenses→other_cost`, `customer.type→customer.hot`, status `"available"→"Available"` (Pascal everywhere).
- `next.config.ts` — `typescript.ignoreBuildErrors:false`, `eslint.ignoreDuringBuilds:false`. **NEVER REVERT.** The 8-week drift this session unwound happened because these were `true`.
- Files swept: `app/dashboard/page.tsx`, `app/auth/sign-up/page.tsx`, `lib/supabase/{middleware,server}.ts`, `components/{dashboard/header,customers/customer-dialog,customers/customers-list,forms/forms-builder,intel/market-intel,listing/listing-builder,settings/settings-form,settings/data-migration,sales/add-sale-button,stock/stock-list,stock/vehicle-dialog,tasks/tasks-board}.tsx`
- **Deleted**: `components/dashboard/dashboard-charts.tsx` + `dashboard-aged.tsx` — circular self-imports, orphan dead code

### T3 — Sale insert hardened
`components/sales/add-sale-button.tsx`: was passing `payment_method`/`deposit_amount`/`warranty_type`/`warranty_months` against a table that didn't have those columns (PGRST204, swallowed). Now writes vehicle snapshot (make/model/year/rego), buyer copied from customer, computes `total_cost = purchase + recon + other`, `profit`, `margin`, flips vehicle to `"Sold"` (Pascal).

### T8 — Toast errors everywhere
`sonner` installed. `<Toaster richColors position="top-center" theme="dark" />` mounted in `app/layout.tsx`. Every mutation in 7 forms wrapped in `const { error } = await supabase...; if (error) { toast.error(...); return }`.

### T9 — PIN hashing
`app/api/pin/route.ts` (edge runtime) — Web Crypto SHA-256 + per-user UUID salt. `settings-form.tsx` posts to it. Field starts empty (never preloads the hash).

### T7 partial — Scanner Add-to-Stock
`app/dashboard/scanner/page.tsx` button wired to `vehicles.insert`. Per-row loading + "Added" state. Image upload still TODO.

### T13 partial — /admin foundation
- `app/admin/layout.tsx` — role-gated to `founder`. Non-founders redirected to `/dashboard`.
- `app/admin/page.tsx` — Phase 1 aggregates: dealer count, vehicle count, sale count, total revenue, top makes, body mix.

### Strategic artifacts (NEW)
- `docs/STRATEGY.md` — full architectural roadmap (mobile/PWA, plate API, data engine, AI tools, EasyCars analysis, sequencing). **Read this before any Phase 2 work.**
- `lib/vehicle-lookup.ts` — plate→vehicle data abstraction. **STUB** — returns deterministic synthetic data from rego hash. Replace stub body with AutoGrab fetch when T14 unblocks.
- `scripts/probe-schema.mjs` — verifies live tables/columns (used for T6)
- `scripts/probe-columns.mjs` — deeper column-by-column probe (used to diagnose the drift)

---

## 3. Left to do — priority

### Blocker on user
1. Apply `scripts/004_add_admin_roles.sql` in Supabase SQL Editor
2. Set `role='founder'` for themselves (SQL in 004's header)
3. Smoke test path: signup → add vehicle → add customer → record sale → print form → set PIN → /admin

### Code-side, in order
1. **T10 — Claude tool-use chat** — `ANTHROPIC_API_KEY` needed. Replace regex stub in `app/api/chat/route.ts`. Model: `claude-haiku-4-5`. Prompt-cache the system block (dealer profile + last-90-day sales + current stock). Stream via SSE. Persist in `chat_history`. Tools to define: `lookup_vehicle_by_rego`, `get_sale_for_vehicle`, `stock_summary`, `top_makes_last_n_days`, `aged_stock_action_plan`. Each tool runs server-side under dealer's session → RLS does the security.
2. **T11 — Resend post-sale email** — `RESEND_API_KEY` + verified domain. Trigger after sale insert succeeds. Send buyer summary + compliance forms as attached PDF (use `react-pdf` server-side or render forms-builder via `puppeteer-core`).
3. **Commit + push** — nothing pushed since `975ca86` (2026-04-03). All ~28 file changes uncommitted. Vercel auto-deploys on push.
4. **Vercel env vars** — copy `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + new keys into Vercel dashboard before push.

### Week 2–4
5. **T12 — Stripe self-serve** — 3 price IDs for plans (Software+AI $249, Done For You $799, Grow For You contact)
6. **T15 — PWA** — `next-pwa`, `public/manifest.json`, iOS meta tags, bottom-tab nav <md
7. **T14 — Real plate API** — sign up AutoGrab, swap the stub body in `lib/vehicle-lookup.ts` (10 lines)
8. **T7b — Image upload** — Supabase Storage bucket `vehicle-images`, multi-file UI in `VehicleDialog`, thumbnails in `stock-list`
9. **T17 — EasyCars parity** — Quick-quality filters on stock list (No Photos/Description/PPSR), days-in-stock histogram, Lead Sources field on Customer, photo watermarking

### Phase 2 (10+ dealers)
10. Admin v2: materialized views, nightly refresh
11. Cross-dealer benchmarking surfaced into dealer UI

### Phase 3 (50+ dealers)
12. T13 v3: real-time activity feed via Supabase Realtime; "movie-style" live ops

### KILL (do not extend)
- `components/settings/data-migration.tsx` — backward-compat for legacy HTML localStorage. Delete 6 months post-launch.
- `package-lock.json` (untracked) OR `pnpm-lock.yaml` (committed) — repo mixes both. Pick pnpm (it's committed). Delete `package-lock.json`.
- Vercel project `lmctprodemo` — legacy. Canonical is `v0-lmct-pro-website`.
- Old HTML files (`app.html`/`forms.html`/etc.) — already deleted in April migration. Master prompt's Babel multiline-string rule is OBSOLETE.

---

## 4. Key decisions + WHY

1. **SQL is source of truth.** When SQL ≠ types.ts ≠ UI, SQL wins. Change SQL → change `lib/types.ts` in same commit → run `npx tsc --noEmit` to find every UI ref that broke. The 8 weeks of drift unwound this session is the cost of forgetting this.

2. **ONE Anthropic key for the whole platform, NOT per-dealer.** Dealers never sign up for Anthropic. Per-dealer personalization = `profiles.ai_name` + `ai_personality` + `ai_training` + `chat_history` (RLS-isolated) + system-prompt injection of their stock/sales at call time. Cost baked into subscription.

3. **PWA over React Native for mobile v1.** One codebase, camera via `getUserMedia`, no app-store review. RN only if push notifications / biometrics force the issue.

4. **AutoGrab as preferred plate API vendor.** Best AU coverage. `lib/vehicle-lookup.ts` abstraction = vendor is a 10-line swap.

5. **SHA-256 + per-user UUID salt for PIN, NOT bcrypt.** Edge runtime forbids Node `bcrypt`. UUID isn't secret (in JWT) — fine for an authenticated edit-gate.

6. **`sonner` for toasts.** ~2kb. Dark theme matches. Mounted globally in `app/layout.tsx`. Do not write custom.

7. **`next.config.ts` strict mode stays.** Both flags `false`. NEVER REVERT.

8. **Dropped `customer.type` enum** — use `customer.hot` boolean for "interested buyer". Drops add complexity for tiny gain.

9. **Dropped `vehicle.engine`/`doors`/`seats`/`floor_price` from UI** — defer to Phase 2.

10. **Vehicle status is Pascal: `Available` / `Reserved` / `Sold` / `Pending`.** SQL DEFAULT 'Available'. Lowercase comparisons silently fail.

11. **`recon_cost` + `other_cost` split, NOT single `expenses`.** Dealers distinguish refurb from transport/ads.

12. **`/admin` gated in layout, not middleware.** Layout reads `profiles.role` server-side → redirect. Middleware just handles `/dashboard` auth.

13. **Data engine anonymization is non-negotiable** (see STRATEGY.md):
    - Dealer UI: their own full + comparables stripped of dealer ID
    - `/admin`: aggregates only; individual rows only with explicit support need
    - Outward licensing: never below city-state level

14. **Marketing `app/page.tsx` keeps inline `<style>` block** (cream/gold/navy hand-tuned). Don't refactor to Tailwind without strong reason.

---

## 5. Gotchas

1. **Supabase free tier auto-pauses after ~7 days idle.** Bit us this session — project went NXDOMAIN. **Upgrade to Pro ($25/mo) before any paying dealer signs up.**

2. **Harness CWD ≠ project location.** The Claude Code session was running from `/Users/mrahman/Desktop/Project 1` (a separate PEP project). LMCT PRO code is at `/Users/mrahman/Desktop/LMCT PRO UPDATE`. Always `cd` before `npm run dev`, or use absolute paths.

3. **`.env.local.save`** in repo root is a manual user backup of secrets. Untracked. Don't read it. Don't delete it.

4. **`shell-init: error retrieving current directory`** in `npm run dev` logs = harmless. Bash subshell can't read parent CWD; Next.js starts fine after.

5. **Dashboard pages have `(v: any)` casts** (e.g. `app/dashboard/page.tsx`). These hide schema drift from tsc. Don't add new ones. Remove existing when convenient.

6. **`<img>` instead of `<Image>` in `stock-list.tsx`/`customers-list.tsx`** = the "1 Issue" dev-mode badge. Cosmetic.

7. **`lib/supabase/{middleware,server}.ts` cookie handlers** use `options?: Record<string, unknown>` + `as any`. Minimal hack against `@supabase/ssr` cookie signature.

8. **Sign-up was stashed-then-popped this session.** The popped version is the 2-step cream/gold/navy UI with abn/state/suburb/phone. Don't revert.

9. **Migration ordering on a fresh Supabase project**: paste `000_reset_and_setup.sql`, then `004_add_admin_roles.sql`. (000 already bundles 001+002+003.)

10. **Anonymous Supabase fetch returns untyped `any[]`** — no typed DB client generated. Treat `data` from `.select("*")` as needing manual typing or runtime guards.

11. **Vercel auto-deploys on push to `main`.** Be deliberate. Last remote commit is from 2026-04-03; all this session's work is uncommitted and would deploy immediately on push.

12. **Mobile responsiveness is partial.** Marketing site grid is OK. Dashboard sidebar collapses via existing CSS but no bottom-tab nav yet (T15).

---

## 6. State

### Branch
- `main`, ~28 file changes uncommitted
- Last remote commit: `975ca86 Update page.tsx` (2026-04-03)
- Stash list: empty

### Environments

`.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL` (live, supabase-rose-door restored)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (live)

Missing (blocks tasks noted):
- `ANTHROPIC_API_KEY` → T10, T16
- `RESEND_API_KEY` + verified sender domain → T11
- `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET` + 3 price IDs → T12
- `AUTOGRAB_API_KEY` (later) → T14

### Supabase
- Project: `supabase-rose-door`
- URL: `https://lfrtdrptisusswqsivop.supabase.co`
- Tier: Free (UPGRADE before launch)
- Confirm-email: user should toggle OFF for smoke testing; ON before launch
- Schema state: `scripts/000_reset_and_setup.sql` already applied; `scripts/004_add_admin_roles.sql` NOT yet applied

### Vercel
- Project: `v0-lmct-pro-website` (canonical)
- Domain: `lmctpro.com.au` + `lmctprodemo.vercel.app`
- Status: still serving April code; nothing pushed since

### Commands

```bash
# Move to project
cd "/Users/mrahman/Desktop/LMCT PRO UPDATE"

# Dev
npm run dev                                          # http://localhost:3000

# Verify
npx tsc --noEmit                                     # must be exit 0
npm run build                                        # full prod build, ~20s
node --env-file=.env.local scripts/probe-schema.mjs  # 7× ✓ expected

# Git
git status
git log --oneline -5
```

### Smoke test path (for user)
1. http://localhost:3000 → "Start Free Trial"
2. Sign up — fill all fields, submit
3. Land on /dashboard
4. Supabase Dashboard → Table Editor → `profiles` → new row with `dealer_name` populated (proves trigger works)
5. Add vehicle → toast "Vehicle added"
6. Add customer (tick "Hot lead")
7. Record sale → toast "Sale recorded — profit ±$X (Y% margin)" — vehicle flips to Sold
8. Forms → pick vehicle/customer → print preview
9. Scanner → paste example → Add to Stock → toast Added
10. Settings → Security → set PIN → Supabase profiles.manager_pin should be 64-char hex

---

## 7. File map (relevant only)

### Source of truth
- `lib/types.ts` — all DB row types
- `scripts/000_reset_and_setup.sql` — canonical schema, already applied
- `scripts/004_add_admin_roles.sql` — adds `role`, NOT YET APPLIED
- `docs/STRATEGY.md` — architectural roadmap

### App shell
- `app/layout.tsx` — root, mounts `<Toaster>`
- `app/page.tsx` — marketing landing (cream/gold/navy, inline style)
- `middleware.ts` — auth gate for `/dashboard/*`

### Auth
- `app/auth/sign-up/page.tsx` — 2-step, stores metadata for trigger
- `app/auth/login/page.tsx`
- `lib/supabase/{client,server,middleware}.ts`

### Dealer dashboard
- `app/dashboard/page.tsx` — main (inline SVG donut + bar)
- `app/dashboard/{stock,sales,customers,listing,scanner,intel,tasks,forms,assistant,settings}/page.tsx`
- `components/{dashboard,stock,sales,customers,listing,intel,tasks,forms,settings}/...tsx`

### Founder admin
- `app/admin/layout.tsx` — role-gated
- `app/admin/page.tsx` — Phase 1 aggregates

### APIs
- `app/api/pin/route.ts` — DONE (SHA-256 hashing)
- `app/api/chat/route.ts` — STUB (T10 replaces)

### Libraries
- `lib/utils.ts` — `formatCurrency`, `generateVehicleTitle`, `cn`
- `lib/vehicle-lookup.ts` — STUB (T14 replaces stub body)

### Scripts
- `scripts/probe-schema.mjs` — quick schema health-check
- `scripts/probe-columns.mjs` — debug schema drift

### Config
- `next.config.ts` — strict
- `tsconfig.json` — strict
- `.env.local` — secrets (do not read)
- `.env.local.save` — user backup, do not touch

### Ignore
- `.next/`, `node_modules/`, `package-lock.json` (delete it), legacy lmctprodemo Vercel project, deleted HTML files

---

## Project rules (must enforce in every session)

- Canonical Vercel project: **`v0-lmct-pro-website`**. `lmctprodemo` is legacy.
- Legacy HTML files (`app.html`, `forms.html`, `index.html`, etc.) are **DELETED** as of April migration. Their Babel multiline-string rule is obsolete and inapplicable. This session did NOT touch any legacy HTML files because they no longer exist.
- No emojis in marketing site.
- No `console.log` in production code.
- Vehicle status capitalization is Pascal.
- Every Supabase mutation wrapped in try/catch + `toast.error`.
- `.env.local` is never committed.
- `next.config.ts` strict mode never reverted.
