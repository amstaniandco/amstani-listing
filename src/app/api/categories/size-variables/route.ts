import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/current-user";
import { listSizeVariablesForCategories } from "@/lib/data/categories";

// GET /api/categories/size-variables?ids=cat1,cat2
// Returns the default size variables for the selected categories.
export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    const variables = await listSizeVariablesForCategories(ids);
    return NextResponse.json({ ok: true, variables });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
