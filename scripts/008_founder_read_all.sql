-- 008_founder_read_all.sql
-- Founder-bypass SELECT policies so /admin can aggregate cross-dealer data.
-- Without these, the founder's authed Supabase client hits dealer-RLS and
-- only sees its own rows, silently breaking every aggregate on /admin.
--
-- Security: the EXISTS subquery itself runs under the existing
-- "select own only" policy on profiles — so a user can only check whether
-- *they themselves* are the founder. No privilege escalation.
--
-- Apply after 004_add_admin_roles.sql.

drop policy if exists "founder reads all profiles" on profiles;
create policy "founder reads all profiles" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'founder')
  );

drop policy if exists "founder reads all vehicles" on vehicles;
create policy "founder reads all vehicles" on vehicles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'founder')
  );

drop policy if exists "founder reads all sales" on sales;
create policy "founder reads all sales" on sales
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'founder')
  );

drop policy if exists "founder reads all customers" on customers;
create policy "founder reads all customers" on customers
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'founder')
  );

-- ─── Realtime publication ─────────────────────────────────────────
-- The Live Feed tab subscribes to vehicles + sales INSERTs. Realtime
-- delivers only rows the listening user has SELECT permission on, so the
-- founder-read-all policies above act as the gate. Dealers still only see
-- their own inserts via their existing user_id-scoped policies.
do $$
begin
  alter publication supabase_realtime add table vehicles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table sales;
exception when duplicate_object then null;
end $$;
