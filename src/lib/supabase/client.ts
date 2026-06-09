// Browser Supabase client (PORTAL project) — anon key only.
// Use in Client Components. Cookies are read/written from document via @supabase/ssr.
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/db";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
