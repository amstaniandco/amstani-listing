import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/current-user";
import { recomputeApprovedPrices } from "@/lib/data/products";

// Admin-triggered: re-apply the CURRENT tax + shipping settings to the final
// price of every already-APPROVED product. Used after changing global rates
// (e.g. adding per-kg shipping) so previously-approved products pick up the new
// shipping cost. Only the `price` is updated; approval status / listing state
// are never changed (see recomputeApprovedPrices).
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    const { updated, unchanged } = await recomputeApprovedPrices();
    return NextResponse.json({ ok: true, updated, unchanged });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
