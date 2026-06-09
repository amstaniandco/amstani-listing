import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBrandRep } from "@/lib/auth/current-user";
import { setProductPublished } from "@/lib/data/products";

const bodySchema = z.object({ isPublished: z.boolean() });

// Enable/disable a product (toggle isPublished), brand-scoped.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireBrandRep();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid body." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid payload." }, { status: 422 });
  }
  try {
    await setProductPublished(id, user.brandId!, parsed.data.isPublished);
    return NextResponse.json({ ok: true, isPublished: parsed.data.isPublished });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
