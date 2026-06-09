import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/current-user";
import { listCategories } from "@/lib/data/categories";

// All existing categories — for the product form's category picker.
export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  try {
    const categories = await listCategories();
    return NextResponse.json({ ok: true, categories });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
