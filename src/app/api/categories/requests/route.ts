import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBrandRep, requireUser } from "@/lib/auth/current-user";
import { createCategoryRequest, listCategoryRequests } from "@/lib/data/categories";

const requestSchema = z.object({ name: z.string().min(2) });

// GET: a rep sees their brand's requests; an admin sees all.
export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  try {
    const requests = await listCategoryRequests(
      user.role === "ADMIN" ? undefined : user.brandId ?? "",
    );
    return NextResponse.json({ ok: true, requests });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}

// POST: a brand rep requests a new category.
export async function POST(request: Request) {
  let user;
  try {
    user = await requireBrandRep();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid body." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a category name." }, { status: 422 });
  }
  try {
    await createCategoryRequest({
      requestedBy: user.sub,
      brandId: user.brandId!,
      name: parsed.data.name,
    });
    return NextResponse.json({ ok: true, message: "Category request submitted for admin review." });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
