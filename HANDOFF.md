# HANDOFF — LMCT PRO

You're a fresh Claude. Read this top-to-bottom — it covers everything you need. Don't re-survey the codebase.

LMCT PRO is a Next.js 15 + Supabase dealer management platform for Australian Licensed Motor Car Traders. The brand is premium-automotive editorial — Fraunces serif, cream/ink/gold/emerald, Australian voice, S-Class energy. The user (Mushfiqur Rahman / `m.rahman746301@gmail.com`) is the developer building this for Sam (`sami@studyin.com.au`).

- **Live:** https://lmctpro.com.au
- **Repo:** https://github.com/lmctpro2026/lmctprodemo (the old `edgematrx/lmctprodemo` URL is dead — push to the new one)
- **Vercel project:** `v0-lmct-pro-website` (canonical). `lmctprodemo` is legacy, ignore.
- **Target:** first paying VIC dealer in 7 days from 2026-05-27.

---

## 1. State right now

### Branch
- `main` clean (no uncommitted changes as of last push).
- Latest commit: `32fbac1 V1 hero: centered like /v2, editorial fonts kept`.

### Pages live in production
| URL | What it is |
|---|---|
| `/` | Centered editorial landing — cream bg, Fraunces 900 with italic gold "tighter", announcement pill, full-width dashboard mockup below |
| `/v2` | Same composition on dark `#000` — for A/B comparison. User is deciding between `/` and `/v2`. |
| `/demo` | Demo booking form → posts to `/api/demo` → Resend email to Sam (logs to console if Resend not configured) |
| `/auth/login`, `/auth/sign-up` | Supabase auth |
| `/dashboard/*` | Dealer dashboard: stock, sales, customers, scanner, listing, forms, tasks, reports, intel, assistant, settings |
| `/admin` | Founder-only platform aggregates (role-gated) |

### Founder account (already provisioned)
```
Email:     m.rahman746301@gmail.com
Password:  Admin@LMCTpro2026
Role:      founder
User id:   c292597e-30df-4c8f-91a3-8e728acff390
```
Login at `lmctpro.com.au/auth/login`. `/admin` will load for this account.

To reset or re-provision (idempotent):
```bash
node --env-file=.env.local scripts/create-founder.mjs
```

### What's hardcoded vs env var

Public Supabase URL + anon key are **hardcoded as fallbacks** in `lib/supabase/config.ts`. Both are public-by-design (anon key has zero permissions beyond RLS). So login works regardless of Vercel env vars.

These still need Vercel env vars to function:
| Var | What it powers | Status |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Stripe webhook, admin overrides | Not in Vercel yet |
| `ANTHROPIC_API_KEY` | `/api/chat` (MAX assistant). Returns clean 503 without it. | Not set |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Sale receipts, demo lead emails. Queues to console without. | Not set |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + 2 price IDs | Billing. Returns 503 without. | Not set |
| `NEXT_PUBLIC_SITE_URL` | Stripe redirects, email links | Should be `https://lmctpro.com.au` |

All values are in user's local `.env.local` (and `.env.local.save` backup). The user just needs to copy them into Vercel → `v0-lmct-pro-website` → Settings → Environment Variables → Production + Preview + Development.

---

## 2. Open decision the user is mid-making

**`/` (cream) vs `/v2` (dark) — which becomes the canonical landing?**

Both now share the same compositional spine:
- Centered hero
- Announcement pill at top
- Mono kicker "FOR AUSTRALIAN LMCT DEALERS"
- Fraunces 900 headline with italic gold "*tighter*"
- Centered CTAs ("Book a demo" + "Or start a 14-day trial")
- DM Mono trust line
- Dashboard mockup centered below

The difference is **palette only** — `/` cream/ink, `/v2` ink/cream. Same brand voice, same fonts, same copy.

Don't change this without an explicit instruction. If the user picks one:

**If user picks `/v2` as main:**
1. Move current `/` to `/v1` (rename `app/page.tsx` content into `app/v1/page.tsx`)
2. Move `app/v2/page.tsx` content to `app/page.tsx` (or update the route)
3. Update internal nav links if any reference `/v2`

**If user picks `/` as main:**
1. Delete `app/v2/` and `components/ui/saa-s-template.tsx`
2. One-liner commit: "Drop /v2 comparison route"

---

## 3. What shipped this session (commit log)

Read commit messages with `git log --oneline` — they're detailed.

```
32fbac1  V1 hero: centered like /v2, editorial fonts kept
c86246f  /v2 hero: editorial typography on dark — not AI-generic
83f1e22  Alt landing — /v2 SaaS-template direction for comparison
cc6bc86  Fix: hardcode public Supabase URL + anon key as fallbacks
865cb6c  Brand: ultra-premium logo — sedan silhouette + Fraunces × DM Mono wordmark
024b898  Landing: full editorial rebuild with the five moments
b9cfc73  Landing: animated showcase + emerald money hook + /demo flow
51c0f5f  Brand: editorial landing page + violet dashboard tokens
e87a6d7  Reports: framework + 8 live reports with PDF + CSV export
c4d34fc  Dashboard polish: density and information design
7670d7a  Launch sprint: schema reconcile, PWA, AI chat, Stripe, Resend, images
```

### Highlights from each

- **7670d7a — Launch sprint** — Schema reconciliation (`000_reset_and_setup.sql` applied to live Supabase), PWA (manifest + service worker + iOS meta + bottom-tab nav), Anthropic Claude tool-use chat scaffold (5 tools, prompt-cached), Resend post-sale receipt, Stripe checkout/portal/webhook + trial banner, vehicle image upload to Supabase Storage, quality filters + days-in-stock + Lead Source on customer.

- **c4d34fc — Dashboard polish** — Stock list rebuilt as dense sortable data table with localStorage view preference (table vs grid). Dashboard home rewrote from inline-style hex soup to Tailwind tokens with lucide icons. Sidebar grouped into WORKSPACE / TOOLS / INSIGHTS sections.

- **e87a6d7 — Reports** — Framework + 8 live reports (stock list, sales summary, profit by make, days-in-stock histogram, GST summary, aged stock action plan, etc.) with PDF + CSV export. Lives at `/dashboard/reports`. Print stylesheet.

- **51c0f5f — Editorial brand** — First full editorial landing rewrite. Loaded Fraunces + Plus Jakarta + DM Mono globally in `app/layout.tsx`. Dashboard tokens shifted from green to violet (`#8b5cf6`) per the dealer-platform design system.

- **b9cfc73 — Animated showcase + /demo** — Slack-style centered HeroShowcase with 4 auto-cycling tabs (stock/add/form/MAX). Each tab has CSS keyframe choreography. Emerald `#10b981` added as money hook color. `/demo` route + form + Resend API.

- **024b898 — Five moments rebuild** — Studied Stripe × Slack × Monday before writing a single line. The five designed moments: hero ambient glow + boundary-breaking badges, diagonal-flip dark showcase with auto-cycling tabs, bento grid with tilted VP151 mockup overflowing card boundary, "Not a chatbot." in green italic Fraunces, staggered testimonials with 180px ghost quote marks as visual containers.

- **865cb6c — Logo** — Replaced lucide car-in-violet-square with custom mark: premium sedan side-profile silhouette inside a thin gold heraldic ring on ink ground. Long bonnet, generous roof, short rear deck — S-Class proportions, not muscle car. `<LogoMark>`, `<Wordmark>`, `<Logo>` exports from `components/brand/logo.tsx`. Used across nav, footer, demo, sidebar, mobile drawer, favicon, PWA icon.

- **cc6bc86 — Auth fix** — Vercel env vars weren't being set → "Failed to fetch" on login. Inlined the public Supabase URL + anon key as fallbacks in `lib/supabase/config.ts`. Login now works regardless of env state. `lib/supabase/{client,server,middleware}.ts` updated to read from config.

- **83f1e22 / c86246f / 32fbac1 — /v2 + V1 centering** — Built `/v2` as a dark-SaaS-template comparison (per the user's request). User then asked to apply the V2 centered layout to V1 (`/`) while keeping the cream editorial fonts. Result: both pages share the same compositional spine, different palette.

### Founder account provisioned mid-session
Via `scripts/create-founder.mjs` against the Supabase Admin API using `SUPABASE_SERVICE_ROLE_KEY`. The 004 SQL (role column) was already applied at the time. The user account is ready to log in.

---

## 4. The exact next move

Three parallel tracks. Do them in any order; ask the user which is the priority.

### Track A — user decision: which landing?
Ask the user: "Did you pick `/` (cream) or `/v2` (dark) as the canonical landing, or both?" Wait for the answer.

### Track B — Vercel env vars (5 minutes for the user; unblocks everything paid)
The user pastes these in Vercel → `v0-lmct-pro-website` → Settings → Environment Variables (tick Production / Preview / Development for each):

```
SUPABASE_SERVICE_ROLE_KEY        eyJ...                  (from .env.local — the service-role one)
NEXT_PUBLIC_SITE_URL             https://lmctpro.com.au
ANTHROPIC_API_KEY                sk-ant-…                (when they get one)
RESEND_API_KEY                   re_…                    (when they verify lmctpro.com.au)
RESEND_FROM_EMAIL                sales@lmctpro.com.au    (after Resend domain verify)
STRIPE_SECRET_KEY                sk_live_…               (after Stripe products + webhook)
STRIPE_WEBHOOK_SECRET            whsec_…
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY pk_live_…
STRIPE_PRICE_SOFTWARE_AI         price_…                 ($249/mo)
STRIPE_PRICE_DONE_FOR_YOU        price_…                 ($799/mo)
```

After paste → Deployments tab → ⋯ on latest → **Redeploy**.

### Track C — Apply 005 SQL
Not yet applied. Without it:
- Billing columns (`stripe_customer_id`, `subscription_status`, `plan`, `trial_ends_at`) don't exist → trial banner reads as if everyone's expired
- Vehicle image upload bucket doesn't exist → uploads will 403
- `vehicles.ppsr_checked` + `customers.lead_source` missing → quality filters + Lead Source dropdown silently no-op

Tell the user to paste `scripts/005_launch_features.sql` into Supabase SQL Editor.

---

## 5. Roadmap still on the board

### Now-ish (next session)
1. User picks `/` vs `/v2`
2. Vercel env vars
3. Apply `005_launch_features.sql`
4. Stripe products + webhook in Stripe dashboard
5. Resend domain verification for `lmctpro.com.au`
6. Generate a real PNG `apple-touch-icon.png` at 180×180 in `/public` (iOS prefers PNG over SVG for home-screen install)

### Soon
7. **T14** — Replace AutoGrab stub in `lib/vehicle-lookup.ts` with real API (10-line vendor swap)
8. Supabase Pro upgrade ($25/mo) before any paying dealer signs up
9. KILL: `components/settings/data-migration.tsx` (legacy HTML localStorage backward-compat — delete 6 months post-launch)

### Phase 2 (10+ dealers)
10. Admin v2 — materialized views, nightly refresh
11. Cross-dealer benchmarking surfaced into dealer UI

### Phase 3 (50+ dealers)
12. Real-time activity feed via Supabase Realtime — "movie-style" live ops view

---

## 6. Architectural decisions baked in — don't undo

1. **SQL is source of truth.** When SQL ≠ `lib/types.ts` ≠ UI, SQL wins. The 8 weeks of drift before `7670d7a` is the cost of forgetting this.
2. **ONE Anthropic key for the platform, NOT per-dealer.** Dealers never sign up for Anthropic. Per-dealer personalisation = `profiles.ai_name + ai_personality + ai_training` + `chat_history` (RLS-isolated) + system-prompt injection of stock/sales at call time. Cost baked into subscription.
3. **PWA over React Native for mobile v1.** One codebase, camera via `getUserMedia`, no app store review.
4. **AutoGrab as preferred plate API vendor.** `lib/vehicle-lookup.ts` abstraction = 10-line vendor swap when T14 unblocks.
5. **SHA-256 + per-user UUID salt for PIN, NOT bcrypt.** Edge runtime forbids Node `bcrypt`. UUID isn't secret (in JWT) — fine for an authenticated edit-gate.
6. **`sonner` for toasts.** ~2KB, dark-themed, mounted globally in `app/layout.tsx`. Don't write custom.
7. **`next.config.ts` strict mode locked.** `typescript.ignoreBuildErrors: false`, `eslint.ignoreDuringBuilds: false`. **NEVER REVERT** — this is the schema-drift detector.
8. **Dropped `customer.type` enum** — use `customer.hot` boolean for "interested buyer". Drops add complexity for tiny gain.
9. **Dropped `vehicle.engine` / `doors` / `seats` / `floor_price` from UI** — defer to Phase 2.
10. **Vehicle status is Pascal: `Available` / `Reserved` / `Sold` / `Pending`.** SQL DEFAULT `'Available'`. Lowercase comparisons silently fail.
11. **`recon_cost` + `other_cost` split, not single `expenses`.** Dealers distinguish refurb from transport/ads.
12. **`/admin` gated in `app/admin/layout.tsx`, not middleware.** Layout reads `profile.role` server-side and redirects. Middleware just handles `/dashboard` auth.
13. **Data engine anonymisation non-negotiable** — dealer UI shows comparables stripped of dealer ID, `/admin` is aggregates only, outward licensing never below city-state level. See `docs/STRATEGY.md`.
14. **Editorial typography is the brand.** Fraunces (headlines), Plus Jakarta Sans (body), DM Mono (kickers + numbers). Italic gold word per headline is the signature. Don't replace with generic sans without an explicit instruction.
15. **Logo is the sedan silhouette in `components/brand/logo.tsx`.** Don't change it unless the user asks.
16. **Public Supabase URL + anon key in `lib/supabase/config.ts`.** They're public by design. Don't move them back into env-only.
17. **Marketing `app/page.tsx` is a "use client" page with a single inline `<style>` block.** Single self-contained file by design (per a directive earlier this session). Don't split it into per-section component files without an explicit instruction.

---

## 7. Gotchas — read these or you'll lose 30 minutes

1. **Supabase free tier auto-pauses after ~7 idle days.** Bit us mid-session. Upgrade to Pro ($25/mo) before any paying dealer signs up.
2. **Repo URL is `lmctpro2026/lmctprodemo`, NOT `edgematrx/lmctprodemo`.** GitHub kept the redirect for pulls but eventually rejected pushes through it. The remote is now updated; future pushes work directly.
3. **`next dev` and `next build` share `.next/`.** Running `npm run build` while the dev server is up wipes the dev's `.next` directory and the dev server starts throwing ENOENT errors on every request. Always:
   ```bash
   rm -rf .next && pkill -f "next dev" 2>/dev/null
   # then start dev again
   ```
4. **Vercel deploys: GitHub repo move broke webhook silently.** If a push goes through but Vercel doesn't redeploy in 2 minutes, the user may need to disconnect + reconnect Vercel to `lmctpro2026/lmctprodemo` (Vercel → Project → Settings → Git → reconnect).
5. **`.env.local.save`** at repo root is a user-managed backup of secrets. Don't read it, don't touch it, don't commit it (it's gitignored via `.env*`).
6. **`shell-init: error retrieving current directory`** in `npm run dev` logs = harmless. Bash subshell quirk; Next.js still starts.
7. **Dashboard pages have `(v: any)` casts** (e.g. `app/dashboard/page.tsx`). They hide schema drift from `tsc`. Don't add new ones; remove existing when convenient. Don't try to fix them all at once.
8. **`<img>` instead of `<Image>` everywhere.** Generates the "1 Issue" dev-mode badge. Cosmetic. Vehicle image URLs are Supabase Storage, which isn't in `next.config.ts`'s `images.remotePatterns`, so plain `<img>` is correct here.
9. **`lib/supabase/{server,middleware}.ts`** cookie handlers use `options?: Record<string, unknown>` + `as any` — minimal hack against `@supabase/ssr` cookie signature.
10. **Migration order on a fresh Supabase project:** paste `000_reset_and_setup.sql`, then `004_add_admin_roles.sql`, then `005_launch_features.sql`. The first bundles `001+002+003` inline.
11. **Anonymous Supabase fetch returns untyped `any[]`** — no typed DB client generated. `.select("*")` data needs manual typing or runtime guards.
12. **Vercel auto-deploys on push to `main`.** Be deliberate. Last push: `32fbac1`.
13. **`components/dashboard/mobile-bottom-nav.tsx` + `components/dashboard/sidebar.tsx`** have user edits (e.g., the Reports nav item, the FileBarChart icon). Don't revert their changes.
14. **The repo uses pnpm.** `package-lock.json` is gone; `pnpm-lock.yaml` is canonical. If pnpm isn't installed locally: `npx pnpm@latest install --lockfile-only` regenerates the lockfile, `npx pnpm@latest install` does a full install.
15. **GitHub Actions / CI:** none. CI is "Vercel built it successfully or it didn't."
16. **Legacy `lmctprodemo` Vercel project** still exists. Ignore it. Canonical project is `v0-lmct-pro-website`.

---

## 8. File map (what matters)

### Source of truth
- `lib/types.ts` — every DB row type, mirrors SQL exactly
- `scripts/000_reset_and_setup.sql` — canonical schema (APPLIED)
- `scripts/004_add_admin_roles.sql` — role column (APPLIED)
- `scripts/005_launch_features.sql` — billing + storage (**NOT YET APPLIED**)
- `scripts/create-founder.mjs` — idempotent founder provisioning (safe to re-run for password reset)
- `scripts/probe-schema.mjs` — `node --env-file=.env.local scripts/probe-schema.mjs` → 7× ✓ expected
- `scripts/probe-columns.mjs` — deeper schema diff if drift suspected
- `docs/STRATEGY.md` — architectural roadmap (mobile/PWA, plate API, data engine, AI sequencing, EasyCars analysis)
- `CLAUDE.md` — legacy notes from earlier sessions; mostly superseded by this file

### App shell
- `app/layout.tsx` — fonts loaded globally (Fraunces + Plus Jakarta + DM Mono), Toaster, ServiceWorkerRegister, PWA meta
- `app/page.tsx` — `/` centered editorial cream landing (latest, `use client`, single `<style>` block)
- `app/v2/page.tsx` — `/v2` dark variant (wraps `components/ui/saa-s-template.tsx`)
- `app/demo/page.tsx` + `components/marketing/demo-form.tsx` + `app/api/demo/route.ts` — demo booking flow
- `middleware.ts` + `lib/supabase/middleware.ts` — auth gate for `/dashboard/*`

### Auth
- `app/auth/{login,sign-up,error,sign-up-success}/page.tsx` — uses Supabase auth via `lib/supabase/client.ts`
- `lib/supabase/{client,server,middleware,config}.ts` — `config.ts` has hardcoded public fallbacks

### Dealer dashboard
- `app/dashboard/layout.tsx` — sidebar + mobile bottom-nav + trial banner
- `app/dashboard/page.tsx` — KPI strip + age bars + sales trend + aged stock detail + recent stock/sales (Tailwind, lucide)
- `app/dashboard/{stock,sales,customers,listing,scanner,intel,tasks,forms,reports,assistant,settings}/page.tsx`
- `components/{dashboard,stock,sales,customers,listing,intel,tasks,forms,reports,settings}/*`
- `components/stock/stock-table.tsx` — dense sortable data table (default view)
- `components/stock/vehicle-image-uploader.tsx` — Supabase Storage upload UI
- `components/billing/trial-banner.tsx` — trial countdown / past_due / expired states

### Founder admin
- `app/admin/layout.tsx` — `profile.role === 'founder'` gate
- `app/admin/page.tsx` — Phase 1 aggregates

### Brand + marketing
- `components/brand/logo.tsx` — `<LogoMark>`, `<Wordmark>`, `<Logo>`
- `components/marketing/hero-showcase.tsx` — client component with 4 cycling tabs (legacy from `b9cfc73`; the editorial `/` rebuild inlines the same logic)
- `components/marketing/demo-form.tsx` — demo form, client component
- `components/ui/saa-s-template.tsx` — `/v2` page contents

### APIs
- `app/api/chat/route.ts` — Anthropic Claude tool-use (`claude-haiku-4-5`, 5 tools, prompt-cached system). Returns 503 if no key.
- `app/api/pin/route.ts` — SHA-256 + UUID salt for `profiles.manager_pin` (edge runtime)
- `app/api/sales/send-receipt/route.ts` — Resend transactional email
- `app/api/stripe/{checkout,portal,webhook}/route.ts` — billing
- `app/api/demo/route.ts` — demo lead → Resend (queues to console if not configured)

### Libraries
- `lib/utils.ts` — `formatCurrency`, `generateVehicleTitle`, `cn`
- `lib/vehicle-lookup.ts` — **STUB.** Replace stub body with AutoGrab fetch (T14, ~10 lines)
- `lib/ai/{tools.ts, system-prompt.ts}` — Claude tools + cached system block
- `lib/stripe.ts` — Stripe client factory + plan→price_id resolver

### Config
- `next.config.ts` — strict (**NEVER REVERT**)
- `tsconfig.json` — strict
- `pnpm-lock.yaml` — canonical lockfile
- `.env.local` — secrets (DO NOT READ unless needed; user manages)
- `.env.local.save` — user backup (DO NOT TOUCH)
- `public/{icon.svg, icon-maskable.svg, manifest.json, sw.js}` — PWA assets
- `public/icon.svg` is the sedan silhouette in gold on ink with thin gold ring

---

## 9. Commands (paste-ready)

```bash
# Project root
cd "/Users/mrahman/Desktop/LMCT PRO UPDATE"

# Dev (Turbopack)
npm run dev                                          # http://localhost:3000

# Type check (must exit 0)
npx tsc --noEmit

# Production build (~25s, exits 0 if clean)
npm run build

# Schema health
node --env-file=.env.local scripts/probe-schema.mjs  # 7× ✓ expected

# Re-provision founder (idempotent)
node --env-file=.env.local scripts/create-founder.mjs

# Git
git status
git log --oneline -10
git remote -v                                        # should show lmctpro2026/lmctprodemo

# Clean dev cache (when build wiped .next mid-dev)
rm -rf .next && pkill -f "next dev"

# Push (remote already updated)
git push origin main
```

---

## 10. Smoke test path (for the user)

1. `https://lmctpro.com.au/` — centered cream editorial landing renders. Look for: announcement pill, gold mono kicker, italic-gold "tighter", centered CTAs, mono trust line, dashboard mockup centered below
2. `https://lmctpro.com.au/v2` — dark variant for A/B
3. `https://lmctpro.com.au/demo` — form renders, submits successfully (200 with `{ok:true,queued:true}` if Resend unset)
4. `https://lmctpro.com.au/auth/login` → email `m.rahman746301@gmail.com` + password `Admin@LMCTpro2026` → lands on `/dashboard`
5. `/dashboard/stock` — empty state, add a vehicle, table refreshes
6. `/dashboard/sales` — record a sale (vehicle flips to Sold, profit + margin computed, receipt toast)
7. `/dashboard/forms` — pick vehicle + customer, print preview
8. `/dashboard/reports` — 8 reports, each PDF + CSV export
9. `/dashboard/settings` → Security → set PIN → check `profiles.manager_pin` in Supabase is 64-char hex
10. `/admin` — founder aggregates render (dealer count, vehicle count, sales, revenue, top makes, body mix)

---

## 11. Project rules (must enforce)

- Canonical Vercel project: **`v0-lmct-pro-website`**.
- Canonical GitHub repo: **`lmctpro2026/lmctprodemo`**.
- Legacy HTML files (`app.html`, `forms.html`, `index.html`) are DELETED as of the April migration. The master prompt's Babel multiline-string rule is OBSOLETE.
- **No emojis** in marketing site or anywhere user-facing — SVG icons or Lucide only.
- No `console.log` in production code.
- Vehicle status capitalisation is Pascal.
- Every Supabase mutation wrapped in try/catch + `toast.error`.
- `.env.local` is never committed (gitignored via `.env*` pattern).
- `next.config.ts` strict mode never reverted.
- New `*.md` files only when the user asks. This file replaces previous handoffs.
- When the user types "ultrathink", they want depth. Don't skim.
- When the user types "fire" they mean "great" (Australian slang) — not literal fire.

---

## 12. If you get stuck

The most common causes of weirdness:

| Symptom | Likely cause | Fix |
|---|---|---|
| "Failed to fetch" on login | `lib/supabase/config.ts` got reverted | Restore hardcoded URL + anon key fallbacks |
| API 503 "AI/billing/email not configured" | Expected — env vars not in Vercel | Have user paste keys in Vercel |
| "column 'role' does not exist" | 004 SQL not applied | Paste `scripts/004_add_admin_roles.sql` |
| "column 'ppsr_checked' / 'lead_source' / 'subscription_status' does not exist" | 005 SQL not applied | Paste `scripts/005_launch_features.sql` |
| Vercel not deploying after push | Webhook broken by repo move | User reconnects Vercel → Settings → Git |
| `npm run dev` 500s on every page after a `npm run build` | `.next/` got wiped | `rm -rf .next && pkill -f "next dev"`, restart |
| Push rejected by origin | Old `edgematrx` URL still in remote | `git remote set-url origin https://github.com/lmctpro2026/lmctprodemo.git` |
| Build fails on Vercel only | pnpm vs npm mismatch | Confirm `pnpm-lock.yaml` is committed and matches `package.json` |
| Anthropic 401 | `ANTHROPIC_API_KEY` wrong or scope | Verify in Anthropic console |

If something else is wrong, run `node --env-file=.env.local scripts/probe-schema.mjs` to confirm the DB is alive and the schema matches, then `npx tsc --noEmit && npm run build` to confirm the code is clean.

---

## 13. Ready signal

When the user lands in the next session, your first response should be terse:

> Read HANDOFF.md. Last commit `32fbac1`. State: cream `/` and dark `/v2` both live with centered editorial heroes. Founder login `m.rahman746301@gmail.com / Admin@LMCTpro2026` is provisioned. Three open tracks: (A) which landing wins, (B) Vercel env vars, (C) apply 005 SQL. What's the priority?

Don't re-read everything. Don't re-survey. Don't restart. Pick up from `32fbac1`.

---

*Handoff written 2026-05-27 at the end of a session that took LMCT PRO from a working-but-template-grade demo to an editorial premium platform with a real brand. The next session continues from commit `32fbac1`.*
