-- 002 — Add fields the UI references that 001 doesn't include.
-- Idempotent (IF NOT EXISTS). Apply via Supabase SQL Editor after 001_create_schema.sql.
--
-- Why each field:
--   variant       — vehicle trim (e.g. "GXL AWD"); used by ListingBuilder, VehicleDialog
--   stock_number  — dealer's internal SKU; used by ListingBuilder, VehicleDialog
--   features      — list of selling points; used by ListingBuilder for listing copy
--   date_of_birth — required on VicRoads transfer form (VP151) for buyer ID verification

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS variant      TEXT   DEFAULT '',
  ADD COLUMN IF NOT EXISTS stock_number TEXT   DEFAULT '',
  ADD COLUMN IF NOT EXISTS features     TEXT[] DEFAULT '{}';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;
