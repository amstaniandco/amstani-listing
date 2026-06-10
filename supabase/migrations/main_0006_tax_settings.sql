-- =========================================================
-- MAIN PROJECT — shipping & taxes (profit / tariff / shipment %) settings
-- Run in MAIN's SQL Editor AFTER the earlier migrations.
--
-- Adds a global percentage configuration plus optional per-product overrides
-- used by the portal at approval time to compute a product's FINAL price:
--
--   final = wholesale × (1 + (profitPct + tariffPct + shipmentPct) / 100)
--
-- The percentages come from tax_settings (one global row) unless the product
-- has its own override (a non-null product.profitPct / tariffPct / shipmentPct).
--
-- All changes are NON-BREAKING: a new table + new nullable columns. Existing
-- rows are untouched; add the columns to the main app's schema.prisma on its
-- next migration so Prisma won't drop them.
-- ⚠ Review before running against your LIVE database.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Global percentage settings — a single row (id = 'default').
-- ---------------------------------------------------------
create table if not exists public.tax_settings (
  id            text primary key default 'default',
  "profitPct"   numeric not null default 0,
  "tariffPct"   numeric not null default 0,
  "shipmentPct" numeric not null default 0,
  "updatedBy"   text references public.users(id),
  "updatedAt"   timestamp without time zone not null default now()
);

-- Seed the single global row if it doesn't exist yet.
insert into public.tax_settings (id, "profitPct", "tariffPct", "shipmentPct")
values ('default', 0, 0, 0)
on conflict (id) do nothing;

alter table public.tax_settings enable row level security;
-- service_role (portal server) is the sole accessor; no anon policy = deny-all.

-- ---------------------------------------------------------
-- 2) Per-product overrides. NULL => fall back to the global tax_settings value.
-- ---------------------------------------------------------
alter table public.product add column if not exists "profitPct"   numeric;
alter table public.product add column if not exists "tariffPct"   numeric;
alter table public.product add column if not exists "shipmentPct" numeric;

-- 3) Wholesale base. On approve the portal overwrites product.price with the
--    final (after-tax) price; we keep the original wholesale here so re-approval
--    recomputes from the base instead of double-taxing. Backfill existing rows
--    from their current price (treated as already-final / wholesale-equal).
alter table public.product add column if not exists "wholesalePrice" numeric;
update public.product set "wholesalePrice" = price where "wholesalePrice" is null;
