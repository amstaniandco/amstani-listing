// Category data access + category_request workflow. SERVER ONLY (service-role).
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { CategoryRequestRow, CategoryRow } from "@/types/db";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

// Default size variables, by category. The product form seeds its "size
// variables" from the selected categories' variables (name/label).
export async function listSizeVariablesForCategories(
  categoryIds: string[],
): Promise<{ name: string; label: string; sortOrder: number }[]> {
  if (!categoryIds.length) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("category_size_variable")
    .select("name,label,sortOrder")
    .in("categoryId", categoryIds)
    .order("sortOrder", { ascending: true });
  if (error) throw new Error(error.message);
  // de-dup by name (a variable can appear across multiple selected categories)
  const seen = new Map<string, { name: string; label: string; sortOrder: number }>();
  for (const v of (data as unknown as { name: string; label: string; sortOrder: number }[]) ?? []) {
    if (!seen.has(v.name)) seen.set(v.name, v);
  }
  return [...seen.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function countCategories(): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db.from("category").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function countBrands(): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db.from("brand").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// All existing categories (reps select from these in the product form).
export async function listCategories(): Promise<Pick<CategoryRow, "id" | "name">[]> {
  const db = createAdminClient();
  const { data, error } = await db.from("category").select("id,name").order("name");
  if (error) throw new Error(error.message);
  return (data as unknown as Pick<CategoryRow, "id" | "name">[]) ?? [];
}

// ---- Category requests ----------------------------------------------------
export async function createCategoryRequest(input: {
  requestedBy: string;
  brandId: string;
  name: string;
}): Promise<void> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await db.from("category_request").insert({
    id: crypto.randomUUID(),
    requestedBy: input.requestedBy,
    brandId: input.brandId,
    name: input.name,
    slug: slugify(input.name),
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  } as never);
  if (error) throw new Error(error.message);
}

export interface CategoryRequestItem extends CategoryRequestRow {
  brandName: string | null;
}

// Admin: all requests (newest first). Rep: pass brandId to scope to own.
export async function listCategoryRequests(brandId?: string): Promise<CategoryRequestItem[]> {
  const db = createAdminClient();
  let q = db
    .from("category_request")
    .select("*,brand(name)")
    .order("createdAt", { ascending: false });
  if (brandId) q = q.eq("brandId", brandId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data as unknown as (CategoryRequestRow & { brand: { name: string } | null })[]) ?? []).map(
    (r) => ({ ...r, brandName: r.brand?.name ?? null }),
  );
}

export async function countPendingCategoryRequests(): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db
    .from("category_request")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// Admin approve: create a real category, link it back, mark approved.
export async function approveCategoryRequest(requestId: string, reviewerId: string): Promise<string> {
  const db = createAdminClient();
  const now = new Date().toISOString();

  const { data: req, error: rErr } = await db
    .from("category_request")
    .select("*")
    .eq("id", requestId)
    .single();
  if (rErr) throw new Error(rErr.message);
  const request = req as unknown as CategoryRequestRow;

  // Create the real category (idempotent-ish: reuse if slug already exists).
  const { data: existing } = await db
    .from("category")
    .select("id")
    .eq("slug", request.slug)
    .maybeSingle();

  let categoryId: string;
  if (existing) {
    categoryId = (existing as { id: string }).id;
  } else {
    categoryId = crypto.randomUUID();
    const { error: cErr } = await db.from("category").insert({
      id: categoryId,
      name: request.name,
      slug: request.slug,
      createdAt: now,
      updatedAt: now,
    } as never);
    if (cErr) throw new Error(cErr.message);
  }

  const { error: uErr } = await db
    .from("category_request")
    .update({
      status: "APPROVED",
      reviewedBy: reviewerId,
      reviewedAt: now,
      categoryId,
      updatedAt: now,
    } as never)
    .eq("id", requestId);
  if (uErr) throw new Error(uErr.message);
  return categoryId;
}

export async function rejectCategoryRequest(
  requestId: string,
  reviewerId: string,
  reason?: string,
): Promise<void> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await db
    .from("category_request")
    .update({
      status: "REJECTED",
      reviewedBy: reviewerId,
      reviewedAt: now,
      rejectReason: reason ?? null,
      updatedAt: now,
    } as never)
    .eq("id", requestId);
  if (error) throw new Error(error.message);
}
