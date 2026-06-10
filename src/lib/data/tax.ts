// Shipping & taxes: global percentage settings (profit, tariff), weight-based
// shipping rate brackets, per-product overrides, and the final-price math.
// SERVER ONLY (service-role).
//
//   shippingCost = product override ?? bracketLookup(weight)
//   final = wholesale × (1 + (profitPct + tariffPct) / 100) + shippingCost
//
// Percentages come from the single global tax_settings row unless the product
// overrides them (non-null product.profitPct / tariffPct).
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ShippingRateRow, TaxSettingsRow } from "@/types/db";

export interface TaxRates {
  profitPct: number;
  tariffPct: number;
  shippingPerKg: number; // general $/kg rate
}

// Special bracket: weight in [minKg, maxKg] is charged at `ratePerKg` $/kg,
// overriding the general per-kg rate. maxKg null => open-ended top tier.
export interface ShippingBracket {
  id: string;
  minKg: number;
  maxKg: number | null;
  ratePerKg: number;
}

const SETTINGS_ID = "default";

// ---- global percentages + general shipping rate ---------------------------
export async function getTaxSettings(): Promise<TaxRates> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("tax_settings")
    .select("profitPct,tariffPct,shippingPerKg")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as unknown as Pick<TaxSettingsRow, "profitPct" | "tariffPct" | "shippingPerKg"> | null;
  return {
    profitPct: Number(row?.profitPct ?? 0),
    tariffPct: Number(row?.tariffPct ?? 0),
    shippingPerKg: Number(row?.shippingPerKg ?? 0),
  };
}

export async function updateTaxSettings(rates: TaxRates, updatedBy: string): Promise<TaxRates> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("tax_settings")
    .upsert(
      {
        id: SETTINGS_ID,
        profitPct: rates.profitPct,
        tariffPct: rates.tariffPct,
        shippingPerKg: rates.shippingPerKg,
        updatedBy,
        updatedAt: new Date().toISOString(),
      } as never,
      { onConflict: "id" },
    )
    .select("profitPct,tariffPct,shippingPerKg")
    .single();
  if (error) throw new Error(error.message);
  const row = data as unknown as TaxRates;
  return {
    profitPct: Number(row.profitPct),
    tariffPct: Number(row.tariffPct),
    shippingPerKg: Number(row.shippingPerKg),
  };
}

// ---- special per-kg shipping brackets -------------------------------------
export async function listShippingRates(): Promise<ShippingBracket[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("shipping_rate")
    .select("id,minKg,maxKg,cost")
    .order("minKg", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data as unknown as ShippingRateRow[]) ?? []).map((r) => ({
    id: r.id,
    minKg: Number(r.minKg),
    maxKg: r.maxKg == null ? null : Number(r.maxKg),
    ratePerKg: Number(r.cost), // `cost` column reused as $/kg
  }));
}

// Replace the whole bracket set in one shot (the editor sends the full list).
export async function replaceShippingRates(
  brackets: { minKg: number; maxKg: number | null; ratePerKg: number }[],
): Promise<ShippingBracket[]> {
  const db = createAdminClient();
  // Clear then insert. (Small table; full replace keeps the editor simple.)
  const { error: dErr } = await db.from("shipping_rate").delete().neq("id", "");
  if (dErr) throw new Error(dErr.message);
  if (brackets.length) {
    const rows = brackets.map((b) => ({
      id: crypto.randomUUID(),
      minKg: b.minKg,
      maxKg: b.maxKg,
      cost: b.ratePerKg, // store $/kg in the `cost` column
      createdAt: new Date().toISOString(),
    }));
    const { error: iErr } = await db.from("shipping_rate").insert(rows as never);
    if (iErr) throw new Error(iErr.message);
  }
  return listShippingRates();
}

// Resolve a product's shipping cost (PER-KG model):
//   1. explicit product flat override wins, else
//   2. if the weight falls in a special bracket -> weight × bracket.ratePerKg, else
//   3. weight × general $/kg rate.
// Bracket match is upper-bound INCLUSIVE (1kg matches a 0–1 bracket).
export function resolveShippingCost(
  weight: number | null,
  generalPerKg: number,
  brackets: ShippingBracket[],
  override?: number | null,
): number {
  if (override != null) return override;
  const w = weight ?? 0;
  const match = brackets.find((b) => w >= b.minKg && (b.maxKg == null || w <= b.maxKg));
  const rate = match ? match.ratePerKg : generalPerKg;
  return Math.round(w * rate * 100) / 100;
}

// ---- effective rates + final price ----------------------------------------
export function resolveRates(
  global: TaxRates,
  override: Partial<{ profitPct: number | null; tariffPct: number | null }>,
): TaxRates {
  return {
    profitPct: override.profitPct ?? global.profitPct,
    tariffPct: override.tariffPct ?? global.tariffPct,
    shippingPerKg: global.shippingPerKg,
  };
}

// final = wholesale × (1 + (profit + tariff)/100) + flat shipping cost.
export function computeFinalPrice(
  wholesale: number,
  rates: TaxRates,
  shippingCost: number,
): number {
  const totalPct = (rates.profitPct ?? 0) + (rates.tariffPct ?? 0);
  const final = wholesale * (1 + totalPct / 100) + (shippingCost ?? 0);
  return Math.round(final * 100) / 100;
}
