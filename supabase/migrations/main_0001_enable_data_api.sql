-- =========================================================
-- MAIN PROJECT — enable Supabase Data API (PostgREST) access
-- Run in MAIN's SQL Editor (project: psdkgevtfjnskupvifer).
--
-- WHY: This Prisma-managed project never granted the Supabase API roles
-- (anon / authenticated / service_role) access to the public schema, so every
-- REST read returns "permission denied for schema public" (42501) even with a
-- valid service_role key. This script grants that access.
--
-- SAFETY: We pair the grants with RLS ENABLED on every portal-relevant table in
-- the SAME script, so opening the Data API does NOT expose rows to the public
-- `anon` role. With RLS on and no permissive policy, anon/authenticated see
-- nothing until we add explicit policies (next migration). service_role bypasses
-- RLS (that's expected — it's a server-only secret).
--
-- ⚠ Review every line. This touches your LIVE store database. It does NOT alter
-- any data, drop anything, or change existing columns — grants + RLS only.
-- =========================================================

-- 1) Let the API roles reach the schema at all.
grant usage on schema public to anon, authenticated, service_role;

-- 2) Table privileges. service_role + authenticated get full CRUD (RLS still
--    gates authenticated); anon gets SELECT only (and RLS will gate it).
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- 3) Sequences (for any serial/identity columns) and functions.
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- 4) Make the grants apply to FUTURE tables too (so new tables aren't locked out).
--    NOTE: default privileges only apply to objects created by the role that runs
--    this. If Prisma creates tables as a different owner, re-run steps 2-3 after
--    migrations, or set default privileges for the Prisma owner role explicitly.
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- 5) Enable RLS on the tables the portal will touch, so the grants above do NOT
--    expose data to anon/authenticated. No policies yet => those roles see
--    nothing until the next migration adds scoped policies. service_role bypasses.
--    (Add/remove tables here to match what the portal reads or writes.)
alter table public.users            enable row level security;
alter table public.brand            enable row level security;
alter table public.category         enable row level security;
alter table public.product          enable row level security;
alter table public.product_category enable row level security;
alter table public.product_images   enable row level security;

-- After running this, verify from the app: a service_role REST read of
-- public.brand should return 200 (not 42501). anon reads should return [] until
-- policies exist.
