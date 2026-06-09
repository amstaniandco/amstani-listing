import { NextResponse } from "next/server";
import { z } from "zod";

import { requireBrandRep } from "@/lib/auth/current-user";
import {
  deleteProductForBrand,
  getFullProductForBrand,
  updateFullProductForBrand,
} from "@/lib/data/products";

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stockQuantity: z.coerce.number().min(0),
  skuVariant: z.string().min(1),
  priceOverride: z.coerce.number().min(0).nullable().optional(),
  isCustomSize: z.boolean().optional(),
});
const sizeChartSchema = z.object({
  size: z.string().min(1),
  unit: z.enum(["cm", "in"]),
  measurements: z.record(z.string(), z.string()),
});
// price/compareAtPrice/costPrice are accepted but ignored by the update (reps
// cannot change pricing). They're optional here so the client can send them.
const updateSchema = z.object({
  name: z.string().min(3),
  sku: z.string().min(2),
  shortDescription: z.string().min(1),
  fullDescription: z.string().min(10),
  categoryIds: z.array(z.string()).min(1),
  price: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  costPrice: z.coerce.number().min(0).nullable().optional(),
  stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]),
  totalStock: z.coerce.number().min(0),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  images: z.array(z.string()).min(1),
  variants: z.array(variantSchema).min(1),
  sizeCharts: z.array(sizeChartSchema).min(1),
  shipping: z.object({
    weight: z.coerce.number().min(0).nullable().optional(),
    dimensionL: z.coerce.number().min(0).nullable().optional(),
    dimensionW: z.coerce.number().min(0).nullable().optional(),
    dimensionH: z.coerce.number().min(0).nullable().optional(),
    shippingClass: z.string().nullable().optional(),
  }),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireBrandRep();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  const { id } = await params;
  try {
    const product = await getFullProductForBrand(id, user.brandId!);
    if (!product) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true, product });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Check the product fields.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  try {
    // price-related fields are dropped server-side; pass 0 placeholders.
    await updateFullProductForBrand(id, user.brandId!, {
      ...parsed.data,
      price: 0,
      compareAtPrice: null,
      costPrice: null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireBrandRep();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteProductForBrand(id, user.brandId!);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
