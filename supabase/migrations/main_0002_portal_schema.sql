-- =========================================================
-- MAIN PROJECT — portal schema additions (single-project model)
-- Run in MAIN's SQL Editor AFTER main_0001_enable_data_api.sql.
--
-- Adds the minimum needed to run the Brand Product Listing Portal on top of the
-- existing eCommerce DB:
--   * link a brand rep to exactly one brand           -> users.brandId
--   * a brand-rep role value                          -> Role.BRAND_REP
--   * the new-category request workflow                -> category_request table
--
-- All changes are NON-BREAKING: a nullable column, a new enum value, a new
-- table. Nothing existing is dropped or altered in place. Prisma-managed tables
-- get new columns Prisma doesn't know about yet — add them to schema.prisma on
-- the main app's next migration so Prisma won't try to drop them. (They are
-- additive, so the live store keeps working regardless.)
-- ⚠ Review before running against your LIVE database.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Brand-rep role. Existing Role enum = (USER, ADMIN).
--    Add BRAND_REP so we can distinguish portal brand reps from customers/admins.
-- ---------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'Role' and e.enumlabel = 'BRAND_REP'
  ) then
    alter type public."Role" add value 'BRAND_REP';
  end if;
end $$;

-- ---------------------------------------------------------
-- 2) Link a user to exactly one brand. NULL for admins/customers.
--    text to match brand.id (cuid). FK keeps it referentially valid.
-- ---------------------------------------------------------
alter table public.users
  add column if not exists "brandId" text references public.brand(id);

create index if not exists idx_users_brandid on public.users ("brandId");

-- A brand rep MUST have a brand; others must not. Enforced as a soft check so it
-- can't break existing rows (validated only on new/updated rows that opt in).
-- (Run a data backfill first if you flip this to NOT VALID -> VALIDATE later.)
-- alter table public.users add constraint brand_rep_has_brand
--   check (role <> 'BRAND_REP' or "brandId" is not null) not valid;

-- ---------------------------------------------------------
-- 3) Category request workflow (reps request -> admin approves -> becomes a
--    real category). Lives only in the portal flow; approved requests create a
--    row in the existing public.category table (done in app/route, not here).
-- ---------------------------------------------------------
create table if not exists public.category_request (
  id            text primary key default gen_random_uuid()::text,
  "requestedBy" text not null references public.users(id),
  "brandId"     text not null references public.brand(id),
  name          text not null,
  slug          text not null,
  status        text not null default 'PENDING'
                  check (status in ('PENDING','APPROVED','REJECTED')),
  "reviewedBy"  text references public.users(id),
  "reviewedAt"  timestamp without time zone,
  "rejectReason" text,
  "categoryId"  text references public.category(id),  -- set when approved
  "createdAt"   timestamp without time zone not null default now(),
  "updatedAt"   timestamp without time zone not null default now()
);
create index if not exists idx_catreq_status on public.category_request (status);
create index if not exists idx_catreq_brand  on public.category_request ("brandId");
-- block duplicate pending requests for the same slug
create unique index if not exists uq_catreq_pending_slug
  on public.category_request (slug) where status = 'PENDING';

alter table public.category_request enable row level security;

-- ---------------------------------------------------------
-- NOTE on auth: this project uses the existing Prisma `users` table with a
-- `password` column (NOT Supabase Auth). RLS here cannot use auth.uid()/JWT
-- claims, because portal users don't have Supabase Auth JWTs. Therefore:
--   * The portal authenticates users itself (verify password against users,
--     check status='APPROVED') in Next.js server code, and performs all DB
--     access through the SERVICE ROLE client, enforcing brand scoping in the
--     server (route handlers / server actions).
--   * RLS stays ENABLED as a safety net so the anon key can never read/write
--     these tables directly from the browser. No permissive anon/authenticated
--     policies are added — service_role (server-only) is the sole writer.
-- The next migration (main_0003) documents this and (optionally) adds narrow
-- read policies if we later choose to expose any data to the anon key.
-- ---------------------------------------------------------
