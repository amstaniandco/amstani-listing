-- =========================================================
-- MAIN PROJECT — per-kg shipping model (general rate + special per-kg brackets)
-- Run in MAIN's SQL Editor AFTER main_0007_shipping_rates.sql.
--
-- Shipping is now PER-KG, not a flat per-bracket cost:
--   * tax_settings.shippingPerKg = the GENERAL rate ($ per kg).
--   * shipping_rate brackets now hold a PER-KG rate in the existing `cost`
--     column (reused as $/kg). A weight in a bracket uses that bracket's per-kg
--     rate instead of the general rate.
--
--   shippingCost =
--     product override (flat)                       if set, else
--     weight × bracketRatePerKg(weight)             if weight is in a bracket, else
--     weight × generalRatePerKg
--
-- Non-breaking: one new column with a default. The `shipping_rate.cost` column
-- is reinterpreted as $/kg by the app (existing rows, if any, are treated as
-- per-kg rates — re-enter them on the Shipping & Taxes page if needed).
-- ⚠ Review before running against your LIVE database.
-- =========================================================

alter table public.tax_settings
  add column if not exists "shippingPerKg" numeric not null default 0;
