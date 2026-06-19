-- =========================================================
-- MAIN PROJECT — reconstruct vendorPricePkr for OLD approved products
-- Run in MAIN's SQL Editor AFTER main_0012.
--
-- Background: products approved BEFORE main_0012 lost the rep's original Rs
-- price — approveProduct() had overwritten wholesalePrice with the USD value and
-- there was no vendorPricePkr column to preserve the rupee amount. main_0012
-- only backfilled UN-approved rows (whose wholesalePrice was still PKR), so these
-- approved rows still show their tiny USD wholesale (e.g. "Rs 0.94") in the rep's
-- form. The true rupee value is GONE from the DB and cannot be recovered exactly.
--
-- Fix (approximation): reverse the approval conversion. approveProduct stores
--   wholesalePriceUsd = round(originalPkr * usdPerPkr, 2)
-- so we estimate
--   originalPkr ≈ wholesalePriceUsd / usdPerPkr
-- using the app's documented fallback rate (see src/lib/data/currency.ts
-- FALLBACK_USD_PER_PKR = 0.0036, ≈ the live mid-2026 rate). This is NOT exact —
-- it ignores cent-rounding at approval and any FX drift since — but it yields a
-- sensible rupee figure instead of a misleading sub-dollar number.
--
-- SCOPE — only touches rows that genuinely lost their PKR:
--   * vendorPricePkr IS NULL  (not already set by 0012 or by a rep save)
--   * approvalStatus = 'APPROVED'  (un-approved rows already hold real PKR)
--   * wholesalePrice > 0
-- Going forward, the moment a rep edits & saves one of these, the form-entered
-- PKR overwrites this estimate with the real value.
--
-- ⚠ Review before running against your LIVE database. This UPDATES live rows.
--   To preview first, run the SELECT in the comment below instead.
-- =========================================================

set lock_timeout = '30s';

-- Preview (optional) — see what the estimate would be before writing:
--   select id, name, "wholesalePrice" as usd,
--          round(("wholesalePrice" / 0.0036)::numeric, 2) as est_pkr
--   from public.product
--   where "vendorPricePkr" is null
--     and "approvalStatus" = 'APPROVED'
--     and "wholesalePrice" > 0;

update public.product
  set "vendorPricePkr" = round(("wholesalePrice" / 0.0036)::numeric, 2)
  where "vendorPricePkr" is null
    and "approvalStatus" = 'APPROVED'
    and "wholesalePrice" is not null
    and "wholesalePrice" > 0;
