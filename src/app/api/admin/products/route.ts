import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/current-user";
import { ADMIN_PRODUCTS_PAGE_SIZE, listAllProductsPaged } from "@/lib/data/products";

// Paginated admin catalog: GET /api/admin/products?page=2&brand=<id>&category=<id>
// Returns one page (default 100) plus the total count so the UI can render page
// controls. brand/category are filtered in the DB, across all pages.
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const pageRaw = Number(searchParams.get("page"));
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const brandId = searchParams.get("brand") || null;
    const categoryId = searchParams.get("category") || null;

    const result = await listAllProductsPaged({
      page,
      pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
      brandId,
      categoryId,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
