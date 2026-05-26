-- 005 — Launch feature columns + storage bucket.
--
-- Adds:
--   • profiles.stripe_customer_id        — Stripe billing link
--   • profiles.subscription_status       — trialing | active | past_due | canceled
--   • profiles.plan                      — software_ai | done_for_you | grow_for_you | null
--   • profiles.trial_ends_at             — set by trigger to NOW() + 7d on signup
--   • vehicles.ppsr_checked              — quality filter on stock list
--   • customers.lead_source              — Facebook | Carsales | Walk-in | Referral | Other
--   • storage.buckets row "vehicle-images" (public read, dealer-scoped writes)
--   • storage.objects RLS for that bucket
--
-- Idempotent. Run AFTER 000_reset_and_setup.sql and 004_add_admin_roles.sql.

-- ─── profiles ──────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id   TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status  TEXT NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS plan                 TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at        TIMESTAMPTZ;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_status_chk') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_subscription_status_chk
      CHECK (subscription_status IN ('trialing','active','past_due','canceled','incomplete','paused'));
  END IF;
END $$;

-- Backfill trial_ends_at for existing rows so the trial banner has data to show.
UPDATE public.profiles
SET trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '7 days')
WHERE trial_ends_at IS NULL;

-- ─── vehicles ──────────────────────────────────────────────────────────
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS ppsr_checked BOOLEAN NOT NULL DEFAULT false;

-- ─── customers ─────────────────────────────────────────────────────────
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT '';

-- ─── Trigger update: set trial_ends_at on new signups ──────────────────
-- Re-issue handle_new_user so new dealers start a 7-day trial automatically.
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

  INSERT INTO public.profiles (
    id, dealer_name, lmct, abn, phone, address, email,
    subscription_status, trial_ends_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'dealer_name', 'My Dealership'),
    COALESCE(NEW.raw_user_meta_data ->> 'lmct',        ''),
    COALESCE(NEW.raw_user_meta_data ->> 'abn',         ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone',       ''),
    v_address,
    NEW.email,
    'trialing',
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.email_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ─── storage: vehicle-images bucket ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: dealers can upload/replace/delete only in their own user_id folder.
-- Convention: file paths are `{auth.uid()}/{vehicle_id}/{filename}`.
-- Reads are public so the dashboard can render thumbnails without signed URLs.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vehicle_images_public_read') THEN
    CREATE POLICY "vehicle_images_public_read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'vehicle-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vehicle_images_dealer_write') THEN
    CREATE POLICY "vehicle_images_dealer_write"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'vehicle-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vehicle_images_dealer_update') THEN
    CREATE POLICY "vehicle_images_dealer_update"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'vehicle-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vehicle_images_dealer_delete') THEN
    CREATE POLICY "vehicle_images_dealer_delete"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'vehicle-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ─── Done ──────────────────────────────────────────────────────────────
-- After applying, verify by running:
--   node --env-file=.env.local scripts/probe-schema.mjs
-- (probe doesn't yet check the new columns; visual confirmation in Table
-- Editor or psql is fine.)
