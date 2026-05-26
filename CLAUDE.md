# LMCT PRO — Claude Handover

Dealer Management System SaaS for Australian Licensed Motor Car Traders. Single-tenant per dealer with Supabase RLS. Founder & sole dev: Sam (MDMR Motors brand). Target: first paying Victorian LMCT dealer in 7 days from the session of 2026-05-27.

Repo: `github.com/edgematrx/lmctprodemo` · Deploy: Vercel project `v0-lmct-pro-website` · Domain: `lmctpro.com.au`.

## Stack (locked — don't replace)

- Next.js 15 App Router, React 19, TypeScript 5
- Tailwind 4 + shadcn/ui (Radix primitives)
- Supabase (`@supabase/ssr`): auth, Postgres + RLS, planned Storage for vehicle images
- Groq was the original AI plan (`api/ai.js` proxy in the pre-migration HTML app). The Next.js port has a stub at `app/api/chat/route.ts`; plan is to wire to Anthropic (`claude-haiku-4-5` + prompt caching) — see T10.
- Recharts is in `package.json` but the components draw native SVG/CSS charts — safe to keep or drop.

## Source of truth: the SQL schema

**`scripts/001_create_schema.sql` is authoritative.** Seven tables: `profiles`, `vehicles`, `customers`, `sales`, `tasks`, `chat_history`, `email_settings`. RLS enabled on all; policies are `user_id`-scoped. There is also an `on_auth_user_created` trigger that inserts a `profiles` row from `raw_user_meta_data->>'dealer_name'` (and an `email_settings` row).

`lib/types.ts` was rewritten on 2026-05-27 to mirror this SQL exactly. **Keep them in lockstep**: change a SQL column, update `types.ts` in the same commit, then run `npx tsc --noEmit` to find every UI reference that broke. The cause of every weird bug in the audit was 8 weeks of drift between these two files.

## Brand & design rules

- Marketing site (`app/page.tsx`): cream `#FAF8F3`, navy `#0D1F3C`, gold `#E8A020`. Fonts Fraunces (serif) + Plus Jakarta Sans (body). **No emojis. SVG icons only.**
- Dashboard (`app/dashboard/*`): near-black `#080D1A`, violet `#7C3AED`, gold `#E8A020`. Inter / system fallback.
- Logo is text-only: `LMCT` (ink) + `PRO` (gold) in Fraunces. No icon mark.
- Testimonials: first name + last initial + suburb only. Never business names.

## Open punch list (12 tasks — see TaskList tool for live status)

### Done
- **T1** — `lib/types.ts` rewritten as 1:1 mirror of `001_create_schema.sql`.

### In progress
- **T2** — Signup metadata keys are wrong. Trigger reads `dealer_name`/`lmct`; signup page stores `dealership_name`/`lmct_number`. Every new dealer profile defaults to "My Dealership". Stash was popped on 2026-05-27 to restore the better 2-step UI (cream/gold/navy design); still needs the key rename and the trigger needs updating to absorb `lmct`/`abn`/`phone`/`address` from metadata.

### Unblocked
- **T3** — `components/sales/add-sale-button.tsx` inserts `payment_method` / `deposit_amount` / `warranty_type` / `warranty_months` — **none of which exist in the `sales` table**. Insert will throw `PGRST204`. Missing: vehicle snapshot (`make`/`model`/`year`/`rego`), `buyer_name` from customer, `total_cost = purchase_price + recon_cost + other_cost`, `profit = sale_price − total_cost`, `margin = (profit/sale_price)*100`.
- **T4** — UI sweep. Run `npx tsc --noEmit` for the exact file/line list. Common renames:
  - `gross_profit` → `profit`
  - `margin_percent` → `margin`
  - `date_acquired` / `purchase_date` → `acquisition_date`
  - `body_type` → `body`, `fuel_type` → `fuel`
  - `asking_price` / `floor_price` → `price`
  - `purchase_source` → `source`, `expenses` → `other_cost`
  - `license_number` → `license`
  - `dealership_name` → `dealer_name`, `lmct_number` → `lmct`
  - Customer `status` enum → `hot` boolean
  - Sale `buyer_first` / `buyer_last` → `buyer_name`
  - Vehicle status `"available"` → `"Available"` (Pascal case for all statuses)
- **T5** — Flip `next.config.ts`: `typescript.ignoreBuildErrors: false` and `eslint.ignoreDuringBuilds: false`. **Do this AFTER T4** or the build won't pass.
- **T7** — `app/dashboard/scanner/page.tsx:222-227`: "Add to Stock" button has no `onClick`. Also no image upload UI for `vehicles.images TEXT[]`. Use Supabase Storage bucket `vehicle-images`.
- **T8** — Zero error handling on Supabase mutations across the app (silent failure on RLS / missing column / network). Add `sonner` (~2kb) and wrap every insert/update/delete.
- **T9** — `profiles.manager_pin` stored plaintext. Hash via `app/api/pin/route.ts` using Web Crypto `subtle.digest('SHA-256')` + per-user salt (edge-runtime compatible; no bcrypt).

### Blocked
- **T6** — Verify SQL was applied to live Supabase. Run `node --env-file=.env.local scripts/probe-schema.mjs`. As of 2026-05-27 the project URL was `NXDOMAIN` because Supabase paused the project; user has triggered a restore.
- **T10** — Replace `/api/chat` keyword-regex stub with Anthropic Claude. **BLOCKED on `ANTHROPIC_API_KEY`** in Vercel env. Model: `claude-haiku-4-5` for cost/speed, prompt-cache the system prompt (dealer profile + last-90-days sales summary + current stock). Persist conversation in `chat_history` table. Honor `profiles.ai_name` (default `MAX`) and `ai_personality`.
- **T11** — Resend transactional email after sale. **BLOCKED on `RESEND_API_KEY` + verified sending domain.** Send buyer a confirmation with sale summary; attach rendered compliance forms as PDF (server-side via `puppeteer` or `react-pdf`).
- **T12** — Stripe self-serve. **BLOCKED on `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` + product/price IDs.** Three plans (Software+AI $249/mo, Done For You $799/mo, Grow For You = contact form for v1). New columns needed: `profiles.plan`, `profiles.stripe_customer_id`.

## Conventions

- `next.config.ts` currently disables TS + ESLint build errors. That is **how the schema drift went undetected**. Re-enable in T5 and never disable again.
- No `console.log` in production.
- Every async op gets try/catch — T8 will systematize this.
- Vehicle status capitalization is Pascal: `Available` / `Reserved` / `Sold` / `Pending`. Don't lowercase.
- The Babel-CDN HTML rules from the original master prompt ("ALL strings in app.html must be single-line", "exactly ONE `<style>` block in `index.html`") are **OBSOLETE** — those files were deleted in the April migration.

## Useful commands

```bash
npm run dev                                                 # local dev server
node --env-file=.env.local scripts/probe-schema.mjs         # verify Supabase tables/columns
npx tsc --noEmit                                            # finds every UI ref against current types.ts (T4 punch list)
```

## Local state to know about

- `.env.local` holds Supabase URL + anon key. Treat as secret.
- `.env.local.save` is a manual backup — leave it alone. Untracked, won't be committed (`.gitignore` covers `.env.local*`... actually it only covers `.env`, `.env.local`, etc. — `.save` is not gitignored, but it's been sitting untracked since April and that's fine).
- `package-lock.json` is untracked despite `pnpm-lock.yaml` being committed — pick one. If you keep pnpm, delete `package-lock.json`; if you switch to npm, delete `pnpm-lock.yaml`.

## Upgrade Supabase to Pro before launch

Free tier auto-pauses projects after ~7 days of no requests. For a paid SaaS, that's an embarrassing first-impression bug waiting to happen the first time a dealer logs in after a quiet weekend. Pro is $25/mo, removes the pause behavior entirely, and adds daily backups.
