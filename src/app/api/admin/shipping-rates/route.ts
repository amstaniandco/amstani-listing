import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/current-user";
import { listShippingRates, replaceShippingRates } from "@/lib/data/tax";

const bracketSchema = z.object({
  minKg: z.coerce.number().min(0),
  maxKg: z.coerce.number().min(0).nullable(),
  ratePerKg: z.coerce.number().min(0),
});
const bodySchema = z.object({ brackets: z.array(bracketSchema) });

// GET: the weight-based shipping rate brackets.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    const brackets = await listShippingRates();
    return NextResponse.json({ ok: true, brackets });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}

// PUT: replace the full set of brackets.
export async function PUT(request: Request) {
  try {
    await requireAdmin();
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
    return NextResponse.json({ ok: false, message: "Enter valid weight brackets." }, { status: 422 });
  }
  // Reject brackets where maxKg <= minKg (other than open-ended null).
  for (const b of parsed.data.brackets) {
    if (b.maxKg != null && b.maxKg <= b.minKg) {
      return NextResponse.json(
        { ok: false, message: "Each bracket's max weight must be greater than its min." },
        { status: 422 },
      );
    }
  }
  try {
    const brackets = await replaceShippingRates(parsed.data.brackets);
    return NextResponse.json({ ok: true, brackets });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
