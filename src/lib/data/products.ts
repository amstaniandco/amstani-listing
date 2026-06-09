// Product data access — brand-scoped. SERVER ONLY (service-role).
// A product spans 3 MAIN tables: product, product_category (M:N), product_images.
// ALL functions take the caller's brandId and enforce it, since portal users
// have no Supabase-Auth JWT for RLS to scope by — scoping lives here in code.
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductRow } from "@/types/db";

export interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  isPublished: boolean;
  mainImage: string | null;
  createdAt: string;
  categoryIds: string[];
  brandName: string | null;
  categoryNames: string[];
  totalStock: number;
}

export interface ProductDetail extends ProductListItem {
  slug: string;
  description: string;
  images: { id: string; imageUrl: string; isMain: boolean; sortOrder: number }[];
  brandId: string;
}

export interface ProductInput {
  name: string;
  description: string;
  sku: string;
  price: number;
  isPublished: boolean;
  categoryIds: string[];
  images: string[]; // image URLs
}

// ---- Full enterprise product payload (matches the main-site form) ----------
export interface VariantInput {
  size: string;
  color: string;
  stockQuantity: number;
  skuVariant: string;
  priceOverride?: number | null;
  isCustomSize?: boolean;
}
export interface SizeChartRowInput {
  size: string;
  unit: "cm" | "in";
  measurements: Record<string, string>; // keyed by variable name
}
export interface ShippingInput {
  weight?: number | null;
  dimensionL?: number | null;
  dimensionW?: number | null;
  dimensionH?: number | null;
  shippingClass?: string | null;
}
export interface FullProductInput {
  name: string;
  sku: string;
  shortDescription: string;
  fullDescription: string;
  brandId?: string; // ignored; brand comes from session
  categoryIds: string[];
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  totalStock: number;
  isFeatured: boolean;
  isPublished: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  images: string[]; // already-uploaded bucket URLs
  variants: VariantInput[];
  sizeCharts: SizeChartRowInput[];
  shipping: ShippingInput;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ---- LIST (brand-scoped) -------------------------------------------------
export async function listProductsForBrand(brandId: string): Promise<ProductListItem[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("product")
    .select(
      "id,name,sku,price,isPublished,mainImage,createdAt,totalStock," +
        "brand(name),product_category(categoryId,category(name))",
    )
    .eq("brandId", brandId)
    .order("createdAt", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    (data as unknown as (ProductRow & {
      brand: { name: string } | null;
      product_category: { categoryId: string; category: { name: string } | null }[];
    })[]) ?? []
  ).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    isPublished: p.isPublished,
    mainImage: p.mainImage,
    createdAt: p.createdAt,
    totalStock: p.totalStock ?? 0,
    brandName: p.brand?.name ?? null,
    categoryIds: (p.product_category ?? []).map((c) => c.categoryId),
    categoryNames: (p.product_category ?? []).map((c) => c.category?.name ?? "").filter(Boolean),
  }));
}

// ---- toggle published (enable/disable), brand-scoped --------------------
export async function setProductPublished(
  productId: string,
  brandId: string,
  isPublished: boolean,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("product")
    .update({ isPublished, updatedAt: new Date().toISOString() } as never)
    .eq("id", productId)
    .eq("brandId", brandId);
  if (error) throw new Error(error.message);
}

// ---- ADMIN COUNT (true total, not capped) --------------------------------
export async function countAllProducts(): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db
    .from("product")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---- ADMIN LIST (all brands) --------------------------------------------
export interface AdminProductItem extends ProductListItem {
  brandId: string;
}

export async function listAllProducts(limit = 200): Promise<AdminProductItem[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("product")
    .select("id,name,sku,price,isPublished,mainImage,createdAt,totalStock,brandId,brand(name)")
    .order("createdAt", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (
    (data as unknown as (ProductRow & { brand: { name: string } | null })[]) ?? []
  ).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    isPublished: p.isPublished,
    mainImage: p.mainImage,
    createdAt: p.createdAt,
    categoryIds: [],
    categoryNames: [],
    totalStock: p.totalStock ?? 0,
    brandId: p.brandId,
    brandName: p.brand?.name ?? null,
  }));
}

// Admin delete: not brand-scoped.
export async function deleteProductAsAdmin(productId: string): Promise<void> {
  const db = createAdminClient();
  await db.from("product_category").delete().eq("productId", productId);
  await db.from("product_images").delete().eq("productId", productId);
  const { error } = await db.from("product").delete().eq("id", productId);
  if (error) throw new Error(error.message);
}

// ---- GET ONE (brand-scoped) ----------------------------------------------
export async function getProductForBrand(
  productId: string,
  brandId: string,
): Promise<ProductDetail | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("product")
    .select(
      "id,name,sku,slug,price,isPublished,mainImage,fullDescription,brandId,createdAt," +
        "product_category(categoryId),product_images(id,imageUrl,isMain,sortOrder)",
    )
    .eq("id", productId)
    .eq("brandId", brandId) // scoping: can't read another brand's product
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const p = data as unknown as ProductRow & {
    fullDescription: string;
    product_category: { categoryId: string }[];
    product_images: { id: string; imageUrl: string; isMain: boolean; sortOrder: number }[];
  };
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    slug: p.slug,
    price: p.price,
    isPublished: p.isPublished,
    mainImage: p.mainImage,
    description: p.fullDescription,
    brandId: p.brandId,
    createdAt: p.createdAt,
    categoryIds: (p.product_category ?? []).map((c) => c.categoryId),
    categoryNames: [],
    totalStock: 0,
    brandName: null,
    images: p.product_images ?? [],
  };
}

// ---- FULL DETAIL (all tables, for edit + view) --------------------------
export interface FullProductDetail {
  id: string;
  name: string;
  sku: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  totalStock: number;
  isFeatured: boolean;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  brandId: string;
  brandName: string | null;
  createdAt: string;
  categoryIds: string[];
  categoryNames: string[];
  images: string[];
  variants: VariantInput[];
  sizeCharts: SizeChartRowInput[];
  shipping: ShippingInput;
}

export async function getFullProductForBrand(
  productId: string,
  brandId: string,
): Promise<FullProductDetail | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("product")
    .select(
      "*,brand(name)," +
        "product_category(categoryId,category(name))," +
        "product_images(imageUrl,isMain,sortOrder)," +
        "product_variant(size,color,stockQuantity,skuVariant,priceOverride,isCustomSize)," +
        "size_chart(size,unit,measurements)," +
        "shipping_info(weight,dimensionL,dimensionW,dimensionH,shippingClass)",
    )
    .eq("id", productId)
    .eq("brandId", brandId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = data as any;
  const images = (p.product_images ?? [])
    .slice()
    .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder)
    .map((i: { imageUrl: string }) => i.imageUrl);
  const shipping = Array.isArray(p.shipping_info) ? p.shipping_info[0] : p.shipping_info;

  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    shortDescription: p.shortDescription ?? "",
    fullDescription: p.fullDescription ?? "",
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    costPrice: p.costPrice ?? null,
    stockStatus: p.stockStatus,
    totalStock: p.totalStock ?? 0,
    isFeatured: p.isFeatured ?? false,
    isPublished: p.isPublished ?? false,
    seoTitle: p.seoTitle ?? null,
    seoDescription: p.seoDescription ?? null,
    brandId: p.brandId,
    brandName: p.brand?.name ?? null,
    createdAt: p.createdAt,
    categoryIds: (p.product_category ?? []).map((c: { categoryId: string }) => c.categoryId),
    categoryNames: (p.product_category ?? [])
      .map((c: { category: { name: string } | null }) => c.category?.name ?? "")
      .filter(Boolean),
    images,
    variants: (p.product_variant ?? []).map((v: VariantInput) => ({
      size: v.size, color: v.color ?? "", stockQuantity: v.stockQuantity ?? 0,
      skuVariant: v.skuVariant, priceOverride: v.priceOverride ?? null, isCustomSize: v.isCustomSize ?? false,
    })),
    sizeCharts: (p.size_chart ?? []).map((s: SizeChartRowInput) => ({
      size: s.size, unit: s.unit, measurements: s.measurements ?? {},
    })),
    shipping: shipping
      ? {
          weight: shipping.weight ?? null, dimensionL: shipping.dimensionL ?? null,
          dimensionW: shipping.dimensionW ?? null, dimensionH: shipping.dimensionH ?? null,
          shippingClass: shipping.shippingClass ?? null,
        }
      : { weight: null, dimensionL: null, dimensionW: null, dimensionH: null, shippingClass: null },
  };
}

// ---- FULL UPDATE (all tables; price is NOT changed) ---------------------
export async function updateFullProductForBrand(
  productId: string,
  brandId: string,
  input: FullProductInput,
): Promise<void> {
  const db = createAdminClient();
  const now = new Date().toISOString();

  // Ownership check.
  const { data: owned, error: oErr } = await db
    .from("product").select("id").eq("id", productId).eq("brandId", brandId).maybeSingle();
  if (oErr) throw new Error(oErr.message);
  if (!owned) throw new Error("Product not found for this brand.");

  // NOTE: price and compareAtPrice/costPrice are intentionally omitted from the
  // update — reps cannot change pricing on edit.
  const { error } = await db
    .from("product")
    .update({
      name: input.name,
      sku: input.sku,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      stockStatus: input.stockStatus,
      totalStock: input.totalStock,
      isFeatured: input.isFeatured,
      isPublished: input.isPublished,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      mainImage: input.images[0] ?? null,
      updatedAt: now,
    } as never)
    .eq("id", productId)
    .eq("brandId", brandId);
  if (error) throw new Error(error.message);

  await replaceCategories(productId, input.categoryIds, now);
  await replaceImages(productId, input.images, now);
  await replaceVariants(productId, input.variants);
  await replaceSizeCharts(productId, input.sizeCharts);
  await replaceShipping(productId, input.shipping);
}

// ---- CREATE --------------------------------------------------------------
export async function createProductForBrand(
  brandId: string,
  input: ProductInput,
): Promise<string> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();
  const mainImage = input.images[0] ?? null;

  const { error: pErr } = await db.from("product").insert({
    id: productId,
    name: input.name,
    sku: input.sku,
    slug: `${slugify(input.name)}-${productId.slice(0, 6)}`,
    shortDescription: input.description.slice(0, 160),
    fullDescription: input.description,
    price: input.price,
    stockStatus: "IN_STOCK",
    totalStock: 0,
    isFeatured: false,
    isPublished: input.isPublished,
    mainImage,
    brandId,
    createdAt: now,
    updatedAt: now,
  } as never);
  if (pErr) throw new Error(pErr.message);

  await replaceCategories(productId, input.categoryIds, now);
  await replaceImages(productId, input.images, now);
  return productId;
}

// ---- FULL CREATE (all tables) -------------------------------------------
export async function createFullProductForBrand(
  brandId: string,
  input: FullProductInput,
): Promise<string> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const productId = crypto.randomUUID();

  const { error: pErr } = await db.from("product").insert({
    id: productId,
    name: input.name,
    sku: input.sku,
    slug: `${slugify(input.name)}-${productId.slice(0, 6)}`,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    costPrice: input.costPrice ?? null,
    stockStatus: input.stockStatus,
    totalStock: input.totalStock,
    isFeatured: input.isFeatured,
    isPublished: input.isPublished,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    mainImage: input.images[0] ?? null,
    brandId,
    createdAt: now,
    updatedAt: now,
  } as never);
  if (pErr) throw new Error(pErr.message);

  await replaceCategories(productId, input.categoryIds, now);
  await replaceImages(productId, input.images, now);
  await replaceVariants(productId, input.variants);
  await replaceSizeCharts(productId, input.sizeCharts);
  await replaceShipping(productId, input.shipping);
  return productId;
}

// ---- child writers (full) -----------------------------------------------
async function replaceVariants(productId: string, variants: VariantInput[]) {
  const db = createAdminClient();
  await db.from("product_variant").delete().eq("productId", productId);
  if (!variants.length) return;
  const rows = variants.map((v) => ({
    id: crypto.randomUUID(),
    productId,
    size: v.size,
    color: v.color || null,
    stockQuantity: v.stockQuantity ?? 0,
    skuVariant: v.skuVariant,
    priceOverride: v.priceOverride ?? null,
    isCustomSize: v.isCustomSize ?? false,
  }));
  const { error } = await db.from("product_variant").insert(rows as never);
  if (error) throw new Error(error.message);
}

async function replaceSizeCharts(productId: string, rows: SizeChartRowInput[]) {
  const db = createAdminClient();
  await db.from("size_chart").delete().eq("productId", productId);
  if (!rows.length) return;
  const out = rows.map((r) => ({
    id: crypto.randomUUID(),
    productId,
    size: r.size,
    unit: r.unit,
    measurements: r.measurements ?? {},
  }));
  const { error } = await db.from("size_chart").insert(out as never);
  if (error) throw new Error(error.message);
}

async function replaceShipping(productId: string, s: ShippingInput) {
  const db = createAdminClient();
  await db.from("shipping_info").delete().eq("productId", productId);
  const { error } = await db.from("shipping_info").insert({
    productId,
    weight: s.weight ?? null,
    dimensionL: s.dimensionL ?? null,
    dimensionW: s.dimensionW ?? null,
    dimensionH: s.dimensionH ?? null,
    shippingClass: s.shippingClass ?? null,
  } as never);
  if (error) throw new Error(error.message);
}

// ---- UPDATE (brand-scoped) ----------------------------------------------
export async function updateProductForBrand(
  productId: string,
  brandId: string,
  input: ProductInput,
): Promise<void> {
  const db = createAdminClient();
  const now = new Date().toISOString();

  // Verify ownership first (scoping).
  const existing = await getProductForBrand(productId, brandId);
  if (!existing) throw new Error("Product not found for this brand.");

  const { error } = await db
    .from("product")
    .update({
      name: input.name,
      sku: input.sku,
      shortDescription: input.description.slice(0, 160),
      fullDescription: input.description,
      price: input.price,
      isPublished: input.isPublished,
      mainImage: input.images[0] ?? null,
      updatedAt: now,
    } as never)
    .eq("id", productId)
    .eq("brandId", brandId);
  if (error) throw new Error(error.message);

  await replaceCategories(productId, input.categoryIds, now);
  await replaceImages(productId, input.images, now);
}

// ---- DELETE (brand-scoped) ----------------------------------------------
export async function deleteProductForBrand(productId: string, brandId: string): Promise<void> {
  const db = createAdminClient();
  // Verify ownership before deleting anything.
  const { data: owned, error: oErr } = await db
    .from("product").select("id").eq("id", productId).eq("brandId", brandId).maybeSingle();
  if (oErr) throw new Error(oErr.message);
  if (!owned) throw new Error("Product not found for this brand.");

  // Remove all children first (no ON DELETE CASCADE assumed).
  await db.from("product_category").delete().eq("productId", productId);
  await db.from("product_images").delete().eq("productId", productId);
  await db.from("product_variant").delete().eq("productId", productId);
  await db.from("size_chart").delete().eq("productId", productId);
  await db.from("shipping_info").delete().eq("productId", productId);
  const { error } = await db.from("product").delete().eq("id", productId).eq("brandId", brandId);
  if (error) throw new Error(error.message);
}

// ---- helpers: replace join rows -----------------------------------------
async function replaceCategories(productId: string, categoryIds: string[], now: string) {
  const db = createAdminClient();
  await db.from("product_category").delete().eq("productId", productId);
  if (!categoryIds.length) return;
  const rows = categoryIds.map((categoryId, i) => ({
    id: crypto.randomUUID(),
    productId,
    categoryId,
    isPrimary: i === 0,
    createdAt: now,
  }));
  const { error } = await db.from("product_category").insert(rows as never);
  if (error) throw new Error(error.message);
}

async function replaceImages(productId: string, images: string[], now: string) {
  const db = createAdminClient();
  await db.from("product_images").delete().eq("productId", productId);
  if (!images.length) return;
  const rows = images.map((imageUrl, i) => ({
    id: crypto.randomUUID(),
    productId,
    imageUrl,
    alt: null,
    isMain: i === 0,
    sortOrder: i,
    createdAt: now,
  }));
  const { error } = await db.from("product_images").insert(rows as never);
  if (error) throw new Error(error.message);
}
