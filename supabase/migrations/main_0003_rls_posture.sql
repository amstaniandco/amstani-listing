-- =========================================================
-- MAIN PROJECT — RLS posture for the portal (server-enforced model)
-- Run AFTER main_0001 and main_0002.
--
-- SECURITY MODEL (decided): the portal authenticates users against the existing
-- Prisma `users` table (bcrypt passwords), issues its OWN session, and performs
-- ALL database access from the Next.js server using the SERVICE ROLE key.
-- service_role BYPASSES RLS. Brand scoping (a rep only touches their brand's
-- products) is enforced in SERVER CODE (route handlers / server actions), not in
-- RLS — because portal users have no Supabase-Auth JWT for RLS to read.
--
-- THEREFORE this migration's job is to make RLS a HARD LOCK on the public
-- (anon) and logged-in-via-supabase (authenticated) roles, so the browser anon
-- key can NEVER read or write these tables directly. We add NO permissive
-- policies for anon/authenticated. RLS-on + no-policy = deny-all for those
-- roles; service_role still has full access.
--
-- Your live storefront uses Prisma over a direct Postgres connection (table
-- owner), which bypasses RLS entirely — so none of this affects the live site.
-- ⚠ Review before running against your LIVE database.
-- =========================================================

-- RLS is already enabled on these in main_0001 / main_0002; assert it here too
-- (idempotent) so this file is self-contained and the posture is explicit.
alter table public.users            enable row level security;
alter table public.brand            enable row level security;
alter table public.category         enable row level security;
alter table public.product          enable row level security;
alter table public.product_category enable row level security;
alter table public.product_images   enable row level security;
alter table public.category_request enable row level security;

-- Deliberately NO policies for anon / authenticated on any of the above.
-- (RLS enabled + zero policies => those roles are denied all rows.)
-- service_role bypasses RLS and remains the single trusted writer/reader,
-- used only from the portal's server side.
--
-- If you LATER want to expose a read-only slice to the browser anon key
-- (e.g. the public list of brands for the signup dropdown WITHOUT going through
-- a server route), uncomment a narrow policy like:
--
--   create policy brand_public_read on public.brand
--     for select to anon using (true);
--
-- For now we keep everything server-side, so we leave anon fully locked.

-- =========================================================
-- Verification after running:
--   * service_role REST read of public.product  -> 200 with rows
--   * anon REST read of public.product           -> 200 with []  (locked)
--   * anon REST insert into public.product       -> 401/403       (locked)
-- =========================================================
