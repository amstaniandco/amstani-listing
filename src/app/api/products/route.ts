import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBrandRep } from "@/lib/auth/current-user";
import { createFullProductForBrand, listProductsForBrand } from "@/lib/data/products";

// Only the variant SKU is required; size/color/stock are optional (a product can
// be color-only or have no size at all).
const variantSchema = z.object({
  size: z.string().optional().default(""),
  color: z.string().optional().default(""),
  stockQuantity: z.coerce.number().min(0).optional().default(0),
  skuVariant: z.string().min(1),
  priceOverride: z.coerce.number().min(0).nullable().optional(),
  isCustomSize: z.boolean().optional(),
  // Free-form per-variant attributes keyed by variable name.
  attributes: z.record(z.string(), z.string()).optional(),
});

const sizeChartSchema = z.object({
  size: z.string().min(1),
  unit: z.enum(["cm", "in"]),
  measurements: z.record(z.string(), z.string()),
});

const fullProductSchema = z.object({
  name: z.string().min(3),
  sku: z.string().min(2),
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(10),
  categoryIds: z.array(z.string()).min(1),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  costPrice: z.coerce.number().min(0).nullable().optional(),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]),
  totalStock: z.coerce.number().min(0),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  images: z.array(z.string()).min(1, "At least one image is required."),
  variants: z.array(variantSchema).min(1, "Add at least one variant."),
  sizeCharts: z.array(sizeChartSchema).min(1, "Add at least one size row."),
  shipping: z.object({
    weight: z.coerce.number().min(0).nullable().optional(),
    dimensionL: z.coerce.number().min(0).nullable().optional(),
    dimensionW: z.coerce.number().min(0).nullable().optional(),
    dimensionH: z.coerce.number().min(0).nullable().optional(),
    shippingClass: z.string().nullable().optional(),
  }),
});

export async function GET() {
  let user;
  try {
    user = await requireBrandRep();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  try {
    const products = await listProductsForBrand(user.brandId!);
    return NextResponse.json({ ok: true, products });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}

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
  const parsed = fullProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Check the product fields.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    // brandId comes from the SESSION, never from the client.
    const id = await createFullProductForBrand(user.brandId!, parsed.data);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
