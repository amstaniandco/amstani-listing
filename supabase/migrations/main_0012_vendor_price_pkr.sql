-- =========================================================
-- MAIN PROJECT — preserve the vendor's original PKR price
-- Run in MAIN's SQL Editor AFTER the earlier migrations.
--
-- Background: when the admin APPROVES a product, approveProduct() overwrites
-- both wholesalePrice (-> USD base) and price (-> after-tax USD final). After
-- that, NOTHING in the row still holds the Rs amount the brand rep originally
-- typed in — so the rep's own product view/edit shows admin/USD numbers instead
-- of the rupee price they entered.
--
-- Fix: store the rep's original PKR price in a dedicated column that approval
-- NEVER touches. The portal writes it on rep create/edit (from the rep's PKR
-- input); the rep-facing views read it back so the vendor always sees the Rs
-- price they submitted, regardless of what the admin changed on approval.
--
-- NON-BREAKING: one new nullable column. Existing rows get NULL and the app
-- falls back to wholesalePrice for them. Add this column to the main app's
-- schema.prisma on its next migration so Prisma won't try to drop it.
-- ⚠ Review before running against your LIVE database.
--
-- If this script HANGS: it is a lock wait, not slow work — the table is tiny.
-- ADD COLUMN needs an ACCESS EXCLUSIVE lock, so an open transaction or a live
-- app connection mid-write on public.product will block it. The lock_timeout
-- below makes it fail fast (after 5s) instead of hanging forever. To find the
-- blocker, run in a separate tab:
--   select pid, state, wait_event, now() - query_start as running_for,
--          left(query, 80) as query
--   from pg_stat_activity
--   where datname = current_database() and pid <> pg_backend_pid()
--   order by query_start;
-- End the offending session, then re-run this file.
-- =========================================================

-- Fail fast instead of hanging if the table is locked by another session.
set lock_timeout = '5s';

alter table public.product
  add column if not exists "vendorPricePkr" numeric;

-- Backfill best-effort for pre-existing rows that have NOT yet been approved
-- (i.e. wholesalePrice is still the rep's PKR amount). Approved rows already hold
-- a USD wholesalePrice, so we deliberately skip them — there is no PKR to recover.
update public.product
  set "vendorPricePkr" = "wholesalePrice"
  where "vendorPricePkr" is null
    and "approvalStatus" in ('PENDING','CHANGES_REQUESTED','REJECTED')
    and "wholesalePrice" is not null;
