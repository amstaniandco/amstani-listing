import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/current-user";
import { listPendingProductsForAdmin } from "@/lib/data/products";

// Admin: the current product-approval queue (full detail). Used to refresh the
// dashboard's pending list after an edit/approve/reject without a full reload.
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    const pending = await listPendingProductsForAdmin();
    const products = pending.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      brandName: p.brandName,
      submittedAt: p.submittedAt,
      rejectReason: p.rejectReason,
      isPublished: p.isPublished,
      categoryIds: p.categoryIds,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      costPrice: p.costPrice,
      shortDescription: p.shortDescription,
      fullDescription: p.fullDescription,
      stockStatus: p.stockStatus,
      totalStock: p.totalStock,
      isFeatured: p.isFeatured,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      categoryNames: p.categoryNames,
      images: p.images,
      variants: p.variants.map((v) => ({
        size: v.size,
        color: v.color ?? "",
        stockQuantity: v.stockQuantity,
        skuVariant: v.skuVariant,
        priceOverride: v.priceOverride ?? null,
        isCustomSize: v.isCustomSize ?? false,
        attributes: v.attributes ?? {},
      })),
      sizeCharts: p.sizeCharts,
      shipping: p.shipping,
      profitPct: p.profitPct,
      tariffPct: p.tariffPct,
      shippingCostOverride: p.shippingCostOverride,
      wholesalePrice: p.wholesalePrice,
    }));
    return NextResponse.json({ ok: true, products });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
