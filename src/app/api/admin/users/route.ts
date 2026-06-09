import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/current-user";
import { listBrandReps } from "@/lib/data/admin-users";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as "PENDING" | "APPROVED" | "BLOCKED" | null;
  try {
    const reps = await listBrandReps(status ?? undefined);
    // Never leak password hashes to the client.
    const safe = reps.map((rep) => {
      const copy: Record<string, unknown> = { ...rep };
      delete copy.password;
      return copy;
    });
    return NextResponse.json({ ok: true, users: safe });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
