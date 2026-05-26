-- 003 — Add payment/warranty fields the UI passes that 001 doesn't include in sales.
-- Idempotent (IF NOT EXISTS). Apply via Supabase SQL Editor after 001 + 002.
--
-- These were originally being passed by add-sale-button.tsx but didn't exist
-- in the schema, so every sale insert was throwing PGRST204.

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_method  TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS deposit_amount  DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warranty_type   TEXT          DEFAULT '',
  ADD COLUMN IF NOT EXISTS warranty_months INTEGER       DEFAULT 0;
