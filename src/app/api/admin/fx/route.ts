import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/current-user";
import { getUsdPerPkr } from "@/lib/data/currency";

// Live PKR -> USD rate for the admin UI (preview math + displayed prices).
// Cached server-side; safe to poll.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  const fx = await getUsdPerPkr();
  return NextResponse.json({ ok: true, usdPerPkr: fx.usdPerPkr, fetchedAt: fx.fetchedAt, live: fx.live });
}
