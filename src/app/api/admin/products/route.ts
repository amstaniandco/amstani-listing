import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/current-user";
import { listAllProducts } from "@/lib/data/products";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    const products = await listAllProducts();
    return NextResponse.json({ ok: true, products });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
