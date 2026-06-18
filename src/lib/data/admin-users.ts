// Admin user-management data access. SERVER ONLY (service-role).
// Admin approves/rejects/suspends/reactivates brand reps by flipping
// users.status. Only BRAND_REP accounts are managed here (not customers/admins).
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRow } from "@/types/db";

export interface BrandRepRow extends UserRow {
  brandName: string | null;
}

// List brand reps (optionally filter by status), joined with their brand name.
export async function listBrandReps(
  status?: "PENDING" | "APPROVED" | "BLOCKED",
): Promise<BrandRepRow[]> {
  const db = createAdminClient();
  let query = db
    .from("users")
    .select("id,email,name,role,status,brandId,createdAt,updatedAt,password,brand(name)")
    .eq("role", "BRAND_REP")
    .order("createdAt", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data as unknown as (UserRow & { brand: { name: string } | null })[]) ?? []).map(
    (row) => ({ ...row, brandName: row.brand?.name ?? null }),
  );
}

export async function countPendingReps(): Promise<number> {
  const db = createAdminClient();
  const { count, error } = await db
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "BRAND_REP")
    .eq("status", "PENDING");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type StatusAction = "approve" | "reject" | "suspend" | "reactivate";

const ACTION_TO_STATUS: Record<StatusAction, "APPROVED" | "REJECTED" | "BLOCKED"> = {
  approve: "APPROVED",
  reactivate: "APPROVED",
  suspend: "BLOCKED",
  // there's no REJECTED in UserStatus enum (PENDING|APPROVED|BLOCKED); reject =
  // block a pending account. We still surface it as a distinct admin action.
  reject: "BLOCKED",
};

export async function setUserStatus(userId: string, action: StatusAction): Promise<UserRow> {
  const db = createAdminClient();
  const status = ACTION_TO_STATUS[action];
  const { data, error } = await db
    .from("users")
    .update({ status, updatedAt: new Date().toISOString() } as never)
    .eq("id", userId)
    .eq("role", "BRAND_REP") // never let admin flip non-reps here
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as UserRow;
}

// Permanently delete a brand rep account. Scoped to BRAND_REP so the admin can
// never delete an admin or a customer through this path.
export async function deleteBrandRep(userId: string): Promise<void> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("users")
    .delete()
    .eq("id", userId)
    .eq("role", "BRAND_REP")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Brand rep not found.");
}
