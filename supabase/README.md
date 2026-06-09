# Supabase backend — Brand Product Listing Portal (single-project model)

**One project = your existing MAIN eCommerce DB** (`psdkgevtfjnskupvifer`).
There is NO separate portal project, no cross-project sync, no Edge Functions.
The portal runs on top of MAIN's real tables (`brand`, `category`, `product`,
`product_category`, `product_images`, `users`).

## Security model

- Auth uses the existing Prisma **`users`** table (bcrypt passwords) — NOT
  Supabase Auth. The portal verifies credentials, checks `status='APPROVED'`,
  and issues its own session.
- All DB access happens from the **Next.js server using the service-role key**.
  Brand scoping (a rep only touches their brand's products) is enforced in
  **server code**, not RLS — portal users have no Supabase-Auth JWT.
- **RLS is enabled as a hard lock**: the browser `anon` key can't read/write
  these tables directly (RLS on + no anon policy = deny-all). `service_role`
  bypasses RLS and is the sole trusted accessor, used server-side only.
- The live storefront uses **Prisma over direct Postgres** (table owner), which
  bypasses RLS — so none of this affects the live site.

## Migrations (run in MAIN's SQL Editor, in order)

`https://supabase.com/dashboard/project/psdkgevtfjnskupvifer/sql/new`

1. **`main_0001_enable_data_api.sql`** — grants the Supabase API roles access to
   `public` (Prisma projects ship without these) + enables RLS. ✅ already run.
2. **`main_0002_portal_schema.sql`** — adds `users.brandId`, the `BRAND_REP` role
   value, and the `category_request` table. Non-breaking (nullable col + new
   enum value + new table).
3. **`main_0003_rls_posture.sql`** — asserts RLS-on / no-anon-policy on all
   portal tables (server-enforced model).

## Prisma note

`main_0002` adds columns/tables Prisma doesn't know about. They're additive, so
the live store keeps working. Add them to the main app's `schema.prisma` on its
next migration so Prisma won't try to drop them.

## App env (`.env.local`) — MAIN keys

```bash
NEXT_PUBLIC_SUPABASE_URL=https://psdkgevtfjnskupvifer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<main publishable key>   # browser; RLS locks it out
SUPABASE_SERVICE_ROLE_KEY=<main secret key>            # server only, never NEXT_PUBLIC
```

The earlier-created standalone "Amstani-listing" Supabase project is unused and
can be deleted.

## Regenerate DB types (optional, recommended)

```bash
supabase gen types typescript --project-id psdkgevtfjnskupvifer --schema public > src/types/db.ts
```
