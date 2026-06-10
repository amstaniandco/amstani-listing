import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/current-user";
import { getTaxSettings, updateTaxSettings } from "@/lib/data/tax";

const bodySchema = z.object({
  profitPct: z.coerce.number().min(0).max(1000),
  tariffPct: z.coerce.number().min(0).max(1000),
  shippingPerKg: z.coerce.number().min(0),
});

// GET: the global tax/shipping percentages.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    const settings = await getTaxSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}

// PUT: update the global percentages.
export async function PUT(request: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid body." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter valid percentages." }, { status: 422 });
  }
  try {
    const settings = await updateTaxSettings(parsed.data, admin.sub);
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
