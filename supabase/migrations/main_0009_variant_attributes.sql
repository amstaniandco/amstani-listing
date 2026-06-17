-- =========================================================
-- MAIN PROJECT — free-form per-variant attributes
-- Run in MAIN's SQL Editor AFTER the earlier migrations.
--
-- Variants used to carry only fixed fields (size, color, stock, SKU). Some
-- products need extra per-variant attributes that vary by category — e.g. shoes
-- want width / material / heel height, not just a color. Rather than add a
-- column per attribute, store them as a JSON map keyed by variable name, exactly
-- like size_chart.measurements already does.
--
--   product_variant.attributes = { "width": "D", "material": "Leather" }
--
-- The portal's "Manage Variant Variables" UI decides which keys appear (per
-- product), seeding from the selected categories' size variables.
--
-- NON-BREAKING: one new column with a default. Existing rows (and main-site
-- variants) get '{}'. Add this column to the main app's schema.prisma on its next
-- migration so Prisma won't try to drop it.
-- ⚠ Review before running against your LIVE database.
-- =========================================================

alter table public.product_variant
  add column if not exists "attributes" jsonb not null default '{}'::jsonb;
