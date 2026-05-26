-- LMCT PRO — Canonical schema reset & setup
--
-- WHEN TO RUN: once, to align a Supabase project that has the pre-rewrite
-- table shapes (dealership_name / body_type / asking_price / gross_profit /
-- buyer_first|last / etc.) with the current `lib/types.ts` + UI code.
--
-- WHAT IT DOES:
--   1. Drops the 4 tables whose columns diverged from the current SQL:
--      profiles, vehicles, customers, sales. CASCADE removes any FKs.
--   2. Recreates them with the correct columns (combines 001 + 002 + 003).
--   3. Reinstalls RLS policies (user_id-scoped).
--   4. Reinstalls the on_auth_user_created trigger, now picking up
--      dealer_name / lmct / abn / phone + suburb+state from signup metadata.
--   5. Recreates indexes.
--
-- LEAVES ALONE: tasks, chat_history, email_settings — already correct.
--
-- DATA LOSS: profiles/vehicles/customers/sales are wiped. As of 2026-05-27
-- all four had 0 rows so nothing material is lost.
--
-- Idempotent: safe to re-run (drops are IF EXISTS; trigger uses REPLACE).

-- ─── 1. Drop mismatched tables ──────────────────────────────────────────
DROP TABLE IF EXISTS public.profiles  CASCADE;
DROP TABLE IF EXISTS public.vehicles  CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.sales     CASCADE;

-- ─── 2. profiles ─────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dealer_name     TEXT NOT NULL DEFAULT 'My Dealership',
  lmct            TEXT          DEFAULT '',
  abn             TEXT          DEFAULT '',
  acn             TEXT          DEFAULT '',
  address         TEXT          DEFAULT '',
  phone           TEXT          DEFAULT '',
  email           TEXT          DEFAULT '',
  website         TEXT          DEFAULT '',
  manager_pin     TEXT          DEFAULT '1234',
  warn_margin     INTEGER       DEFAULT 5,
  min_margin      INTEGER       DEFAULT 10,
  target_margin   INTEGER       DEFAULT 18,
  ai_name         TEXT          DEFAULT 'MAX',
  ai_personality  TEXT          DEFAULT 'direct',
  ai_training     TEXT          DEFAULT '',
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- ─── 3. vehicles (001 + 002 fields merged) ──────────────────────────────
CREATE TABLE public.vehicles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make              TEXT NOT NULL,
  model             TEXT NOT NULL,
  year              INTEGER NOT NULL,
  variant           TEXT          DEFAULT '',
  stock_number      TEXT          DEFAULT '',
  colour            TEXT          DEFAULT '',
  body              TEXT          DEFAULT 'Sedan',
  transmission      TEXT          DEFAULT 'Auto',
  fuel              TEXT          DEFAULT 'Petrol',
  odometer          INTEGER       DEFAULT 0,
  rego              TEXT          DEFAULT '',
  rego_expiry       DATE,
  vin               TEXT          DEFAULT '',
  price             DECIMAL(12,2) DEFAULT 0,
  purchase_price    DECIMAL(12,2) DEFAULT 0,
  recon_cost        DECIMAL(12,2) DEFAULT 0,
  other_cost        DECIMAL(12,2) DEFAULT 0,
  source            TEXT          DEFAULT 'Auction',
  acquisition_date  DATE          DEFAULT CURRENT_DATE,
  status            TEXT          DEFAULT 'Available',
  score             INTEGER       DEFAULT 50,
  notes             TEXT          DEFAULT '',
  features          TEXT[]        DEFAULT '{}',
  images            TEXT[]        DEFAULT '{}',
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_select_own" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vehicles_insert_own" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vehicles_update_own" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vehicles_delete_own" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);

-- ─── 4. customers (001 + 002 fields merged) ─────────────────────────────
CREATE TABLE public.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT          DEFAULT '',
  email           TEXT          DEFAULT '',
  address         TEXT          DEFAULT '',
  license         TEXT          DEFAULT '',
  date_of_birth   DATE,
  interests       TEXT          DEFAULT '',
  notes           TEXT          DEFAULT '',
  hot             BOOLEAN       DEFAULT false,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_select_own" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers_insert_own" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers_update_own" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "customers_delete_own" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- ─── 5. sales (001 + 003 fields merged) ─────────────────────────────────
CREATE TABLE public.sales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id        UUID REFERENCES public.vehicles(id)  ON DELETE SET NULL,
  customer_id       UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  -- Vehicle snapshot — survives vehicle deletion
  make              TEXT NOT NULL,
  model             TEXT NOT NULL,
  year              INTEGER NOT NULL,
  rego              TEXT          DEFAULT '',
  -- Financials
  sale_price        DECIMAL(12,2) NOT NULL,
  total_cost        DECIMAL(12,2) DEFAULT 0,
  profit            DECIMAL(12,2) DEFAULT 0,
  margin            DECIMAL(5,2)  DEFAULT 0,
  -- Buyer copy
  buyer_name        TEXT NOT NULL,
  buyer_email       TEXT          DEFAULT '',
  buyer_phone       TEXT          DEFAULT '',
  buyer_address     TEXT          DEFAULT '',
  buyer_license     TEXT          DEFAULT '',
  -- Dates / status / notes
  sale_date         DATE          DEFAULT CURRENT_DATE,
  settlement_date   DATE,
  status            TEXT          DEFAULT 'Completed',
  notes             TEXT          DEFAULT '',
  -- Payment + warranty
  payment_method    TEXT          DEFAULT '',
  deposit_amount    DECIMAL(12,2) DEFAULT 0,
  warranty_type     TEXT          DEFAULT '',
  warranty_months   INTEGER       DEFAULT 0,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_select_own" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sales_insert_own" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_update_own" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sales_delete_own" ON public.sales FOR DELETE USING (auth.uid() = user_id);

-- ─── 6. Signup trigger: copy metadata into profile ──────────────────────
-- Reads dealer_name / lmct / abn / phone directly from user_metadata, and
-- composes address from suburb+state. CREATE OR REPLACE so it's safe to
-- re-run; DROP TRIGGER IF EXISTS handles previous installs.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_address TEXT;
BEGIN
  v_address := COALESCE(NEW.raw_user_meta_data ->> 'suburb', '');
  IF NEW.raw_user_meta_data ->> 'state' IS NOT NULL
     AND NEW.raw_user_meta_data ->> 'state' <> '' THEN
    v_address := v_address ||
                 (CASE WHEN v_address <> '' THEN ', ' ELSE '' END) ||
                 (NEW.raw_user_meta_data ->> 'state');
  END IF;

  INSERT INTO public.profiles (id, dealer_name, lmct, abn, phone, address, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'dealer_name', 'My Dealership'),
    COALESCE(NEW.raw_user_meta_data ->> 'lmct',        ''),
    COALESCE(NEW.raw_user_meta_data ->> 'abn',         ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone',       ''),
    v_address,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.email_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── 7. Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id  ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status   ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id     ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date   ON public.sales(sale_date);

-- ─── Done ───────────────────────────────────────────────────────────────
-- After running this, re-run scripts/probe-schema.mjs to confirm:
--   node --env-file=.env.local scripts/probe-schema.mjs
-- It should print "✓" for all seven tables.
