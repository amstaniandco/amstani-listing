// Service-role Supabase client (MAIN project) — SERVER ONLY.
// Bypasses RLS. NEVER import this into a Client Component or expose the key.
// This is the portal's PRIMARY data path: all reads/writes go through here from
// the server, with brand scoping enforced in code (portal users have no
// Supabase-Auth JWT, so RLS only locks out the anon key).
import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/db";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only secret
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
