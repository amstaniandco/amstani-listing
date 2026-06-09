// User + brand data access for the auth flows. SERVER ONLY (service-role).
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandRow, UserRow } from "@/types/db";

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as UserRow | null) ?? null;
}

export interface NewBrandRep {
  email: string;
  name: string;
  passwordHash: string;
  brandId: string;
}

// Creates a PENDING BRAND_REP. Account is NOT active until an admin approves.
export async function createBrandRep(input: NewBrandRep): Promise<UserRow> {
  const db = createAdminClient();
  // Prisma generates id/createdAt/updatedAt in the app layer (the DB columns
  // have no defaults), so we must supply them on insert.
  const nowIso = new Date().toISOString();
  const payload = {
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    password: input.passwordHash,
    role: "BRAND_REP" as const,
    status: "PENDING" as const,
    brandId: input.brandId,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const { data, error } = await db
    .from("users")
    .insert(payload as never)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as UserRow;
}

// Brands for the signup dropdown. Reps SELECT one existing brand; they cannot
// create brands. (The 29 real brands from MAIN.)
export async function listBrands(): Promise<Pick<BrandRow, "id" | "name">[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("brand")
    .select("id,name")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as Pick<BrandRow, "id" | "name">[]) ?? [];
}

export async function getBrandById(id: string): Promise<BrandRow | null> {
  const db = createAdminClient();
  const { data, error } = await db.from("brand").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as BrandRow | null) ?? null;
}
