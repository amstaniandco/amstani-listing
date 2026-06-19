-- =========================================================
-- MAIN PROJECT — make new products default to PENDING approval
-- Run in MAIN's SQL Editor AFTER the earlier migrations.
--
-- Background: main_0005 added product."approvalStatus" with a column DEFAULT of
-- 'APPROVED'. That default was chosen so PRE-EXISTING / main-site rows stayed
-- live, and the portal was expected to ALWAYS set 'PENDING' explicitly on insert.
--
-- The problem: the default fails UNSAFE. Any insert that reaches public.product
-- without an explicit "approvalStatus" (a seed, a direct SQL insert, or the main
-- app's own product-create code which doesn't know the portal convention) gets
-- 'APPROVED' silently — the product skips the admin review queue and goes live
-- with no approval. That is why a few products auto-approve while the rest sit
-- PENDING as intended.
--
-- Fix: flip the column DEFAULT to 'PENDING' so a forgotten field fails SAFE
-- (lands in the review queue) instead of going live. The portal insert code
-- still sets 'PENDING' explicitly; this only changes what happens when nobody
-- sets it at all.
--
-- NON-BREAKING: only changes the DEFAULT for FUTURE inserts. Existing rows are
-- untouched (rows already backfilled to APPROVED by main_0005 stay APPROVED).
-- The CHECK constraint from main_0010 already permits 'PENDING'.
-- ⚠ Review before running against your LIVE database.
-- =========================================================

alter table public.product
  alter column "approvalStatus" set default 'PENDING';
