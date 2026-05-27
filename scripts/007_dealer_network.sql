-- 007_dealer_network.sql
-- Foundation tables for the dealer-to-dealer network (Phase 5).
-- Tables are live; UI ships behind a "Coming soon, activates at 20 dealers" gate.
-- FKs reference profiles(id) — there is no separate dealers table in this schema.
-- Apply after 004_add_admin_roles.sql.

-- ─── dealer_profiles ───────────────────────────────────────────────
-- Opt-in public directory. Each row is a dealer who has chosen visibility.
create table if not exists dealer_profiles (
  id                uuid primary key references profiles(id) on delete cascade,
  is_public         boolean not null default false,
  display_name      text,                       -- first name or business nickname
  suburb            text,
  state             text not null default 'VIC',
  typically_stocks  text[] not null default '{}',
  bio              text,
  updated_at        timestamptz not null default now()
);

create index if not exists dealer_profiles_is_public_idx
  on dealer_profiles (is_public) where is_public = true;
create index if not exists dealer_profiles_state_idx
  on dealer_profiles (state) where is_public = true;

alter table dealer_profiles enable row level security;

drop policy if exists "anyone reads public dealer profiles" on dealer_profiles;
create policy "anyone reads public dealer profiles" on dealer_profiles
  for select using (is_public = true or id = auth.uid());

drop policy if exists "own dealer profile insert" on dealer_profiles;
create policy "own dealer profile insert" on dealer_profiles
  for insert with check (id = auth.uid());

drop policy if exists "own dealer profile update" on dealer_profiles;
create policy "own dealer profile update" on dealer_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own dealer profile delete" on dealer_profiles;
create policy "own dealer profile delete" on dealer_profiles
  for delete using (id = auth.uid());

-- ─── dealer_messages ───────────────────────────────────────────────
-- 1:1 chat between two dealers. Both sender and recipient can read.
create table if not exists dealer_messages (
  id              uuid primary key default gen_random_uuid(),
  from_dealer_id  uuid not null references profiles(id) on delete cascade,
  to_dealer_id    uuid not null references profiles(id) on delete cascade,
  body            text not null check (length(body) between 1 and 4000),
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists dealer_messages_conversation_idx
  on dealer_messages (from_dealer_id, to_dealer_id, created_at desc);
create index if not exists dealer_messages_inbox_idx
  on dealer_messages (to_dealer_id, read, created_at desc);

alter table dealer_messages enable row level security;

drop policy if exists "participants read messages" on dealer_messages;
create policy "participants read messages" on dealer_messages
  for select using (auth.uid() in (from_dealer_id, to_dealer_id));

drop policy if exists "sender writes message" on dealer_messages;
create policy "sender writes message" on dealer_messages
  for insert with check (from_dealer_id = auth.uid());

drop policy if exists "recipient marks read" on dealer_messages;
create policy "recipient marks read" on dealer_messages
  for update using (to_dealer_id = auth.uid()) with check (to_dealer_id = auth.uid());

-- ─── stock_enquiries ───────────────────────────────────────────────
-- Broadcast "anyone got a 2019 RAV4 under 80k km?" — visible to all dealers in same state.
create table if not exists stock_enquiries (
  id          uuid primary key default gen_random_uuid(),
  dealer_id   uuid not null references profiles(id) on delete cascade,
  query       text not null check (length(query) between 3 and 500),
  state       text not null default 'VIC',
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

create index if not exists stock_enquiries_state_active_idx
  on stock_enquiries (state, expires_at desc) where expires_at > now();

alter table stock_enquiries enable row level security;

drop policy if exists "any dealer reads active enquiries" on stock_enquiries;
create policy "any dealer reads active enquiries" on stock_enquiries
  for select using (expires_at > now());

drop policy if exists "own dealer writes enquiry" on stock_enquiries;
create policy "own dealer writes enquiry" on stock_enquiries
  for insert with check (dealer_id = auth.uid());

drop policy if exists "own dealer deletes enquiry" on stock_enquiries;
create policy "own dealer deletes enquiry" on stock_enquiries
  for delete using (dealer_id = auth.uid());

comment on table dealer_profiles is
  'Opt-in public dealer directory for the D2D network. Phase 5.';
comment on table dealer_messages is
  '1:1 chat between dealers. RLS-scoped to participants.';
comment on table stock_enquiries is
  'Broadcast stock requests visible to all dealers in same state. 24h TTL.';
