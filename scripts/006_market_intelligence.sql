-- 006_market_intelligence.sql
-- Founder-only cache of aggregated market intelligence across all dealers.
-- Populated by supabase/functions/market-intelligence (nightly + manual trigger).
-- RLS: only profiles.role='founder' can read. Service role bypasses RLS for inserts.
-- Apply after 004_add_admin_roles.sql (requires profiles.role column).

create table if not exists market_intelligence_cache (
  id                       uuid primary key default gen_random_uuid(),
  generated_at             timestamptz not null default now(),
  dealer_count             integer not null default 0,
  transaction_count        integer not null default 0,
  top_makes                jsonb not null default '[]'::jsonb,
  avg_days_by_body         jsonb not null default '[]'::jsonb,
  avg_margin_by_state      jsonb not null default '[]'::jsonb,
  source_roi               jsonb not null default '[]'::jsonb,
  fastest_sellers          jsonb not null default '[]'::jsonb,
  price_reduction_patterns jsonb not null default '[]'::jsonb,
  notes                    text
);

create index if not exists market_intelligence_cache_generated_at_idx
  on market_intelligence_cache (generated_at desc);

alter table market_intelligence_cache enable row level security;

drop policy if exists "founder reads market intelligence" on market_intelligence_cache;
create policy "founder reads market intelligence" on market_intelligence_cache
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'founder')
  );

-- No insert/update/delete policies — only service role writes (bypasses RLS).
-- Dealers must never see this table; never expose via public PostgREST.

comment on table market_intelligence_cache is
  'Founder-only aggregated market intelligence. Populated by edge function. Never exposed to dealers.';
