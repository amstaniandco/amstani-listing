-- =========================================================
-- MAIN PROJECT — "changes requested" product approval state
-- Run in MAIN's SQL Editor AFTER the earlier migrations.
--
-- Adds a softer middle state between APPROVED and REJECTED: the admin can send a
-- pending product BACK to the brand rep with a note ("request changes") instead
-- of rejecting it outright. The rep edits and resubmits the SAME product (no
-- delete/recreate), exactly like the rejected flow.
--
--   PENDING            -> awaiting first review
--   CHANGES_REQUESTED  -> admin asked for edits; rep must edit & resubmit
--   APPROVED           -> live-eligible
--   REJECTED           -> declined
--
-- The admin's note is stored in the existing product.rejectReason column (reused
-- as the "what to change" message) — no new column needed.
--
-- NON-BREAKING: only widens the approvalStatus CHECK constraint. Existing rows
-- are unaffected. Add this value to the main app's schema.prisma enum on its next
-- migration so Prisma won't fight it.
-- ⚠ Review before running against your LIVE database.
-- =========================================================

-- Drop whatever CHECK constraint currently guards approvalStatus (the inline
-- constraint from main_0005 is auto-named product_approvalStatus_check, but this
-- block finds it by definition in case the name differs on your DB).
do $$
declare
  c text;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'product'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%approvalStatus%'
  loop
    execute format('alter table public.product drop constraint %I', c);
  end loop;
end $$;

alter table public.product
  add constraint product_approvalStatus_check
    check ("approvalStatus" in ('PENDING','APPROVED','REJECTED','CHANGES_REQUESTED'));
