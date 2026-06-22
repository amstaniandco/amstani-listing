// Product data access — brand-scoped. SERVER ONLY (service-role).
// A product spans 3 MAIN tables: product, product_category (M:N), product_images.
// ALL functions take the caller's brandId and enforce it, since portal users
// have no Supabase-Auth JWT for RLS to scope by — scoping lives here in code.
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUsdPerPkr, pkrToUsd } from "@/lib/data/currency";
import {
  computeFinalPrice,
  getTaxSettings,
  listShippingRates,
  resolveRates,
  resolveShippingCost,
} from "@/lib/data/tax";
import type { ApprovalStatus, ProductRow } from "@/types/db";

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
  approvalStatus: ApprovalStatus;
  rejectReason: string | null;
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
  // Free-form attributes keyed by variable name (e.g. width, material). Optional;
  // defaults to {} when absent.
  attributes?: Record<string, string>;
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
// Resolved (read) shape: every field present and normalized to value|null.
export interface ShippingDetail {
  weight: number | null;
  dimensionL: number | null;
  dimensionW: number | null;
  dimensionH: number | null;
  shippingClass: string | null;
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
  // Admin-only per-product overrides (null/undefined => use global / weight lookup).
  profitPct?: number | null;
  tariffPct?: number | null;
  shipmentPct?: number | null; // legacy, ignored
  shippingCostOverride?: number | null;
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
      "id,name,sku,price,isPublished,mainImage,createdAt,totalStock,approvalStatus,rejectReason," +
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
    approvalStatus: p.approvalStatus ?? "APPROVED",
    rejectReason: p.rejectReason ?? null,
  }));
}

// ---- toggle published (enable/disable), brand-scoped --------------------
// A rep can only enable a product the admin has APPROVED. Disabling is always
// allowed (it just hides an already-listed product).
export async function setProductPublished(
  productId: string,
  brandId: string,
  isPublished: boolean,
): Promise<void> {
  const db = createAdminClient();

  if (isPublished) {
    const { data: row, error: sErr } = await db
      .from("product")
      .select("approvalStatus")
      .eq("id", productId)
      .eq("brandId", brandId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!row) throw new Error("Product not found for this brand.");
    if ((row as { approvalStatus: ApprovalStatus }).approvalStatus !== "APPROVED") {
      throw new Error("This product is awaiting admin approval and can't be published yet.");
    }
  }

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
    .select(
      "id,name,sku,price,isPublished,mainImage,createdAt,totalStock,approvalStatus,rejectReason,brandId," +
        "brand(name),product_category(categoryId,category(name))",
    )
    .order("createdAt", { ascending: false })
    .limit(limit);
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
    categoryIds: (p.product_category ?? []).map((c) => c.categoryId),
    categoryNames: (p.product_category ?? []).map((c) => c.category?.name ?? "").filter(Boolean),
    totalStock: p.totalStock ?? 0,
    brandId: p.brandId,
    brandName: p.brand?.name ?? null,
    approvalStatus: p.approvalStatus ?? "APPROVED",
    rejectReason: p.rejectReason ?? null,
  }));
}

// ---- ADMIN: count + list of products awaiting approval ------------------
export async function countPendingProducts(): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db
    .from("product")
    .select("id", { count: "exact", head: true })
    .eq("approvalStatus", "PENDING");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// Full pending-product detail for the admin review queue. Reuses the full
// detail shape (all 6 tables) so the admin sees EVERYTHING before approving.
export interface AdminPendingProduct extends FullProductDetail {
  approvalStatus: ApprovalStatus;
  rejectReason: string | null;
  submittedAt: string | null;
}

export async function listPendingProductsForAdmin(): Promise<AdminPendingProduct[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("product")
    .select(
      "*,brand(name)," +
        "product_category(categoryId,category(name))," +
        "product_images(imageUrl,isMain,sortOrder)," +
        "product_variant(size,color,stockQuantity,skuVariant,priceOverride,isCustomSize,attributes)," +
        "size_chart(size,unit,measurements)," +
        "shipping_info(weight,dimensionL,dimensionW,dimensionH,shippingClass)",
    )
    .eq("approvalStatus", "PENDING")
    .order("submittedAt", { ascending: true });
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((p) => mapFullDetail(p, {
    approvalStatus: p.approvalStatus ?? "PENDING",
    rejectReason: p.rejectReason ?? null,
    submittedAt: p.submittedAt ?? null,
  }));
}

// ---- ADMIN: approve / reject a product ----------------------------------
// Approving:
//   1. Converts the rep-entered WHOLESALE base (PKR) to USD using the live rate.
//   2. Applies the effective tax rates (per-product overrides, else the global
//      tax_settings) plus shipping — all in USD — to get the final price.
//   3. Stores BOTH the USD wholesale base (wholesalePrice) and the after-tax USD
//      price (product.price), so the live store is fully USD.
// The stored wholesalePrice entering this function is always PKR: a rep edit
// resets it to the freshly-entered PKR amount and re-queues the product, and an
// approved product leaves the queue, so we only ever convert a PKR base here.
export async function approveProduct(productId: string, reviewerId: string): Promise<void> {
  const db = createAdminClient();
  const now = new Date().toISOString();

  const { data: row, error: rErr } = await db
    .from("product")
    .select("price,wholesalePrice,profitPct,tariffPct,shippingCostOverride,shipping_info(weight)")
    .eq("id", productId)
    .maybeSingle();
  if (rErr) throw new Error(rErr.message);
  if (!row) throw new Error("Product not found.");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = row as any;
  const weight = Array.isArray(p.shipping_info)
    ? p.shipping_info[0]?.weight ?? null
    : p.shipping_info?.weight ?? null;

  // Base (PKR) = stored wholesale if present, else the current price (first approval).
  const wholesalePkr = p.wholesalePrice ?? p.price;
  const [global, brackets, fx] = await Promise.all([
    getTaxSettings(),
    listShippingRates(),
    getUsdPerPkr(),
  ]);
  // Convert the wholesale base to USD before any tax/shipping math (shipping
  // rates are already in USD, so everything downstream is consistently USD).
  const wholesaleUsd = pkrToUsd(wholesalePkr, fx.usdPerPkr);
  const rates = resolveRates(global, { profitPct: p.profitPct, tariffPct: p.tariffPct });
  const shippingCost = resolveShippingCost(weight, global.shippingPerKg, brackets, p.shippingCostOverride);
  const finalPrice = computeFinalPrice(wholesaleUsd, rates, shippingCost);

  const { error } = await db
    .from("product")
    .update({
      approvalStatus: "APPROVED",
      rejectReason: null,
      reviewedBy: reviewerId,
      reviewedAt: now,
      wholesalePrice: wholesaleUsd, // lock in the USD base
      price: finalPrice, // live store shows the after-tax USD price
      updatedAt: now,
    } as never)
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

// ---- ADMIN: recompute already-approved prices ----------------------------
// Re-applies the CURRENT tax rates + shipping to every APPROVED product, so a
// later change to the global shipping/tax settings (e.g. adding per-kg rates)
// flows into products that were approved before the change.
//
// FX-SAFE: an approved product's wholesalePrice is ALREADY in USD (locked in at
// approval — see approveProduct), so we do NOT convert PKR -> USD again here.
// We only recompute the after-tax `price` from that USD base.
//
// Scope is deliberately narrow:
//   - touches ONLY rows with approvalStatus === "APPROVED"
//     (PENDING / REJECTED / CHANGES_REQUESTED are left untouched, so nothing
//      moves between the approval queues)
//   - writes ONLY `price` — approvalStatus, isPublished, wholesalePrice, and all
//     review metadata are preserved exactly as they were.
// Returns how many rows were updated vs. left unchanged.
export async function recomputeApprovedPrices(): Promise<{ updated: number; unchanged: number }> {
  const db = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("product")
    .select("id,price,wholesalePrice,profitPct,tariffPct,shippingCostOverride,shipping_info(weight)")
    .eq("approvalStatus", "APPROVED");
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]) ?? [];

  // Global rates + brackets are the same for every product; fetch once.
  const [global, brackets] = await Promise.all([getTaxSettings(), listShippingRates()]);

  let updated = 0;
  let unchanged = 0;
  for (const p of rows) {
    // Base is already USD for approved products (locked at approval). If it's
    // somehow null, skip rather than guess — never re-convert from PKR here.
    const wholesaleUsd = p.wholesalePrice;
    if (wholesaleUsd == null) {
      unchanged++;
      continue;
    }
    const weight = Array.isArray(p.shipping_info)
      ? p.shipping_info[0]?.weight ?? null
      : p.shipping_info?.weight ?? null;
    const rates = resolveRates(global, { profitPct: p.profitPct, tariffPct: p.tariffPct });
    const shippingCost = resolveShippingCost(weight, global.shippingPerKg, brackets, p.shippingCostOverride);
    const finalPrice = computeFinalPrice(wholesaleUsd, rates, shippingCost);

    // Skip the write if nothing changed (cheaper, and keeps updatedAt honest).
    if (finalPrice === Number(p.price)) {
      unchanged++;
      continue;
    }
    const { error: uErr } = await db
      .from("product")
      .update({ price: finalPrice, updatedAt: now } as never)
      .eq("id", p.id)
      .eq("approvalStatus", "APPROVED"); // belt-and-suspenders: never touch a non-approved row
    if (uErr) throw new Error(uErr.message);
    updated++;
  }
  return { updated, unchanged };
}

// Rejecting also force-unpublishes, so a rejected product can never be live.
export async function rejectProduct(
  productId: string,
  reviewerId: string,
  reason?: string,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("product")
    .update({
      approvalStatus: "REJECTED",
      rejectReason: reason ?? null,
      isPublished: false,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as never)
    .eq("id", productId);
  if (error) throw new Error(error.message);
}

// "Request changes": send the product back to the rep with a note (reused
// rejectReason column) instead of rejecting it. Force-unpublishes so it can't be
// live while awaiting the rep's edits. The rep edits & resubmits the same row,
// which flips it back to PENDING (see updateFullProductForBrand).
export async function requestProductChanges(
  productId: string,
  reviewerId: string,
  note?: string,
): Promise<void> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from("product")
    .update({
      approvalStatus: "CHANGES_REQUESTED",
      rejectReason: note ?? null, // reused as the "what to change" message
      isPublished: false,
      reviewedBy: reviewerId,
      reviewedAt: now,
      updatedAt: now,
    } as never)
    .eq("id", productId);
  if (error) throw new Error(error.message);
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
      "id,name,sku,slug,price,isPublished,mainImage,fullDescription,brandId,createdAt,approvalStatus,rejectReason," +
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
    approvalStatus: p.approvalStatus ?? "APPROVED",
    rejectReason: p.rejectReason ?? null,
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
  shipping: ShippingDetail;
  // Per-product tax overrides (null => use global tax_settings) + wholesale base.
  profitPct: number | null;
  tariffPct: number | null;
  shipmentPct: number | null; // legacy
  shippingCostOverride: number | null; // null => weight-bracket lookup
  wholesalePrice: number | null;
  // The rep's original PKR price, untouched by admin approval. Null for legacy
  // rows that predate this column (callers fall back to wholesalePrice).
  vendorPricePkr: number | null;
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
        "product_variant(size,color,stockQuantity,skuVariant,priceOverride,isCustomSize,attributes)," +
        "size_chart(size,unit,measurements)," +
        "shipping_info(weight,dimensionL,dimensionW,dimensionH,shippingClass)",
    )
    .eq("id", productId)
    .eq("brandId", brandId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapFullDetail(data);
}

// Shared mapper: a joined product row (all 6 tables) -> FullProductDetail.
// `extra` lets callers graft on additional fields (e.g. admin approval status).
function mapFullDetail<T extends object = object>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: any,
  extra?: T,
): FullProductDetail & T {
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
      attributes: v.attributes ?? {},
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
    profitPct: p.profitPct ?? null,
    tariffPct: p.tariffPct ?? null,
    shipmentPct: p.shipmentPct ?? null,
    shippingCostOverride: p.shippingCostOverride ?? null,
    wholesalePrice: p.wholesalePrice ?? null,
    vendorPricePkr: p.vendorPricePkr ?? null,
    ...(extra ?? ({} as T)),
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

  // The rep's price input is the WHOLESALE (pre-tax) base. We store it in both
  // price and wholesalePrice; the after-tax final is recomputed from the
  // wholesale base when the admin re-approves (see approveProduct).
  // compareAtPrice/costPrice remain admin-only and are not touched here.
  //
  // Any edit by a rep re-enters the approval queue (re-moderation) and is pulled
  // off the live store until re-approved — the admin must see the new details.
  const { error } = await db
    .from("product")
    .update({
      name: input.name,
      sku: input.sku,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      price: input.price,
      wholesalePrice: input.price,
      // Keep the preserved vendor PKR in sync with the rep's latest input.
      vendorPricePkr: input.price,
      stockStatus: input.stockStatus,
      totalStock: input.totalStock,
      isFeatured: input.isFeatured,
      isPublished: false,
      approvalStatus: "PENDING",
      rejectReason: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: now,
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

// ---- ADMIN FULL UPDATE (all tables, all brands) -------------------------
// The admin can correct/complete a product while reviewing it: any field,
// including PRICE, plus variants / size charts / images / shipping. Unlike the
// rep path this is NOT brand-scoped and it does NOT change approvalStatus or
// unpublish — the admin's edits are part of the review, so the product stays in
// whatever state it was in (typically PENDING) until the admin clicks Approve.
export async function updateFullProductAsAdmin(
  productId: string,
  input: FullProductInput,
): Promise<void> {
  const db = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: eErr } = await db
    .from("product").select("id").eq("id", productId).maybeSingle();
  if (eErr) throw new Error(eErr.message);
  if (!existing) throw new Error("Product not found.");

  const { error } = await db
    .from("product")
    .update({
      name: input.name,
      sku: input.sku,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      // The admin's price input is the WHOLESALE base (pre-tax). The after-tax
      // final is applied to `price` only on approve, so keep both in sync here.
      price: input.price,
      wholesalePrice: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      costPrice: input.costPrice ?? null,
      stockStatus: input.stockStatus,
      totalStock: input.totalStock,
      isFeatured: input.isFeatured,
      isPublished: input.isPublished,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      mainImage: input.images[0] ?? null,
      // Per-product overrides (null => use global rates / weight-bracket lookup).
      profitPct: input.profitPct ?? null,
      tariffPct: input.tariffPct ?? null,
      shippingCostOverride: input.shippingCostOverride ?? null,
      updatedAt: now,
      // approvalStatus / reviewedBy / submittedAt deliberately untouched.
    } as never)
    .eq("id", productId);
  if (error) throw new Error(error.message);

  await replaceCategories(productId, input.categoryIds, now);
  await replaceImages(productId, input.images, now);
  await replaceVariants(productId, input.variants);
  await replaceSizeCharts(productId, input.sizeCharts);
  await replaceShipping(productId, input.shipping);
}

// Admin: full detail for ANY product (not brand-scoped) — used to load a
// pending product into the editor.
export async function getFullProductAsAdmin(
  productId: string,
): Promise<FullProductDetail | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("product")
    .select(
      "*,brand(name)," +
        "product_category(categoryId,category(name))," +
        "product_images(imageUrl,isMain,sortOrder)," +
        "product_variant(size,color,stockQuantity,skuVariant,priceOverride,isCustomSize,attributes)," +
        "size_chart(size,unit,measurements)," +
        "shipping_info(weight,dimensionL,dimensionW,dimensionH,shippingClass)",
    )
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapFullDetail(data);
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
    wholesalePrice: input.price,
    stockStatus: "IN_STOCK",
    totalStock: 0,
    isFeatured: false,
    isPublished: input.isPublished,
    mainImage,
    brandId,
    // New portal products await admin approval before they can go live.
    approvalStatus: "PENDING",
    rejectReason: null,
    submittedAt: now,
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
    wholesalePrice: input.price,
    // The rep's original PKR price — preserved as-is so admin approval (which
    // converts wholesalePrice/price to USD) never hides what the vendor entered.
    vendorPricePkr: input.price,
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
    // New portal products await admin approval before they can go live.
    approvalStatus: "PENDING",
    rejectReason: null,
    submittedAt: now,
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
    attributes: v.attributes ?? {},
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

  // Any edit re-enters the approval queue (see updateFullProductForBrand).
  const { error } = await db
    .from("product")
    .update({
      name: input.name,
      sku: input.sku,
      shortDescription: input.description.slice(0, 160),
      fullDescription: input.description,
      price: input.price,
      wholesalePrice: input.price,
      isPublished: false,
      approvalStatus: "PENDING",
      rejectReason: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: now,
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
