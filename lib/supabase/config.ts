/**
 * Public Supabase config — URL + anon key.
 *
 * Both values are designed to be public. The anon key has zero permissions
 * beyond what RLS policies allow — it's intended to be shipped to every
 * browser as part of the JS bundle.
 *
 * The values are hardcoded as fallbacks so the live site keeps working
 * when Vercel env vars aren't set. In any environment that DOES have env
 * vars (local dev, properly-configured Vercel deploys), the env var wins.
 *
 * DO NOT put the service-role key here. That one IS sensitive and must
 * stay in server-only env vars.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lfrtdrptisusswqsivop.supabase.co"

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcnRkcnB0aXN1c3N3cXNpdm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Mzk5MjYsImV4cCI6MjA5MDUxNTkyNn0.sOLA0i4IprzR3C2MfUkjMUVZIK2eFDyrmP_MSuaQjuY"
