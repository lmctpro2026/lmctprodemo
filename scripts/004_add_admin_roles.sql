-- 004 — Add `role` column to profiles for /admin gating.
--
-- After applying, set yourself (Sam) as founder so /admin works:
--
--   UPDATE public.profiles
--   SET role = 'founder'
--   WHERE id = (SELECT id FROM auth.users WHERE email = '<your-email>');
--
-- Roles:
--   'dealer'   — default. Sees only their own /dashboard, RLS-isolated.
--   'founder'  — platform owner. Can access /admin. Read-only across all
--                dealers, anonymized in the UI.
--   (future)  'support', 'analyst' — staff with scoped views.
--
-- Idempotent.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'dealer';

-- Optional sanity check: there's exactly one possible role per profile.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_chk
      CHECK (role IN ('dealer', 'founder', 'support', 'analyst'));
  END IF;
END $$;
