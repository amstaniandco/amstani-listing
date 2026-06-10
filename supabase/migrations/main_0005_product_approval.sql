-- =========================================================
-- MAIN PROJECT — product approval workflow (single-project model)
-- Run in MAIN's SQL Editor AFTER the earlier migrations.
--
-- Mirrors the category-request workflow, but for products: a brand rep submits
-- a product, it sits PENDING with full details visible to the admin, and only
-- when the admin APPROVES does it become eligible to appear on the live store.
--
-- Implemented as STATUS COLUMNS on the existing public.product table (not a
-- separate request table) so the rep can keep editing the real row and all the
-- existing 6-table product code (variants, images, size charts, shipping) keeps
-- working unchanged.
--
-- All changes are NON-BREAKING: new nullable/defaulted columns only. Existing
-- rows (created before this migration / by the main site) default to APPROVED
-- so the live store is unaffected. Add these columns to the main app's
-- schema.prisma on its next migration so Prisma won't try to drop them.
-- ⚠ Review before running against your LIVE database.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Approval status. New products from the portal start PENDING; everything
--    that already exists is treated as APPROVED (backfilled by the DEFAULT +
--    the explicit UPDATE below) so the live catalog is never hidden.
-- ---------------------------------------------------------
alter table public.product
  add column if not exists "approvalStatus" text not null default 'APPROVED'
    check ("approvalStatus" in ('PENDING','APPROVED','REJECTED'));

alter table public.product add column if not exists "rejectReason" text;
alter table public.product add column if not exists "reviewedBy"  text references public.users(id);
alter table public.product add column if not exists "reviewedAt"  timestamp without time zone;
alter table public.product add column if not exists "submittedAt" timestamp without time zone;

-- Existing rows: leave APPROVED (the DEFAULT already set them). New rows the
-- DEFAULT would also make APPROVED, so the portal must set PENDING explicitly on
-- insert (done in app code) — the column DEFAULT only protects pre-existing and
-- main-site-created rows.

create index if not exists idx_product_approval on public.product ("approvalStatus");
