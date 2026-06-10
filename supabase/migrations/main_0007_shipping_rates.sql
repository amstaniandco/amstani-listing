-- =========================================================
-- MAIN PROJECT — weight-based shipping rates (replaces the shipment %)
-- Run in MAIN's SQL Editor AFTER main_0006_tax_settings.sql.
--
-- Shipping cost is now WEIGHT-BASED instead of a flat percentage:
--   * shipping_rate holds weight brackets (minKg .. maxKg => flat cost).
--   * a product's shipping_info.weight selects a bracket -> that flat cost.
--   * product.shippingCostOverride (nullable) overrides the lookup per product.
--
-- New final-price math (applied on approve):
--   final = wholesale × (1 + (profitPct + tariffPct)/100) + shippingCost
--   where shippingCost = override ?? bracketLookup(weight)
--
-- The old tax_settings.shipmentPct column is now UNUSED (left in place so this
-- migration is non-breaking; the app ignores it). All changes are additive.
-- ⚠ Review before running against your LIVE database.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Weight brackets. A product weighing >= minKg and < maxKg (maxKg NULL =
--    open-ended top tier) costs `cost`. Brackets should not overlap; the app
--    picks the first matching bracket ordered by minKg.
-- ---------------------------------------------------------
create table if not exists public.shipping_rate (
  id          text primary key default gen_random_uuid()::text,
  "minKg"     numeric not null default 0,
  "maxKg"     numeric,                       -- NULL => no upper bound
  cost        numeric not null default 0,
  "createdAt" timestamp without time zone not null default now()
);
create index if not exists idx_shipping_rate_min on public.shipping_rate ("minKg");

alter table public.shipping_rate enable row level security;
-- service_role (portal server) is the sole accessor; no anon policy = deny-all.

-- ---------------------------------------------------------
-- 2) Per-product shipping-cost override. NULL => use the weight-bracket lookup.
-- ---------------------------------------------------------
alter table public.product
  add column if not exists "shippingCostOverride" numeric;
