import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";

// Returns the current session (or null). Used by client components that need
// the logged-in user without prop-drilling from a server component.
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ ok: true, user });
}
