import { NextResponse } from "next/server";

import { requireBrandRep } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "products";
const FOLDER = "product-images";
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Uploads an image to the same Storage bucket the main site uses, returning its
// public URL. Matches the existing path scheme: products/product-images/<ts>-<rand>.<ext>
export async function POST(request: Request) {
  try {
    await requireBrandRep();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ ok: false, message: "Only image files are allowed." }, { status: 415 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ ok: false, message: "Image must be under 10MB." }, { status: 413 });
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${FOLDER}/${Date.now()}-${rand}.${ext}`;

  const db = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
