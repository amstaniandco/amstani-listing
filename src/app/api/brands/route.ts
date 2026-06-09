import { NextResponse } from "next/server";

import { listBrands } from "@/lib/auth/user";

// Public list of brands for the signup dropdown (id + name only).
export async function GET() {
  try {
    const brands = await listBrands();
    return NextResponse.json({ ok: true, brands });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
