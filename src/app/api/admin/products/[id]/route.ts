import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/current-user";
import { deleteProductAsAdmin } from "@/lib/data/products";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteProductAsAdmin(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
