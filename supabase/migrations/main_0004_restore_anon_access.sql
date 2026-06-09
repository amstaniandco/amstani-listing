-- =========================================================
-- MAIN PROJECT — RESTORE the catalog tables to their ORIGINAL state.
-- Run in MAIN's SQL Editor IMMEDIATELY.
--
-- WHY: main_0001 enabled RLS on product/brand/category/etc. The assumption was
-- that the main site reads via Prisma (bypasses RLS). In reality the main
-- website's ADMIN panel reads/writes via the Supabase ANON key, which RLS
-- blocks (RLS-on + no policy = deny-all). Before the portal work these tables
-- had NO RLS at all, so the cleanest fix is to turn RLS back OFF on them —
-- a true revert to the original behavior.
--
-- The portal does NOT need RLS on these tables: it uses the service_role key
-- (which bypasses RLS anyway) and enforces brand scoping in server code.
-- =========================================================

alter table public.product          disable row level security;
alter table public.brand            disable row level security;
alter table public.category         disable row level security;
alter table public.product_category disable row level security;
alter table public.product_images   disable row level security;
alter table public.users            disable row level security;

-- Keep RLS ON only for the portal-owned table (it has no main-site consumers).
-- category_request stays locked; service_role (portal server) manages it.
-- (no change needed here — left enabled by main_0002.)

-- After running: your main website's product/brand/category/users admin works
-- exactly as it did before. Verify: anon read of product returns rows again.
