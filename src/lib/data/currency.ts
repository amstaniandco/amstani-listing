// Live PKR -> USD conversion. SERVER ONLY.
//
// Brand reps enter wholesale prices in Pakistani Rupees (PKR). The admin side —
// and the live store — works in US Dollars (USD), so we convert at approval time
// using a live exchange rate. The rate moves daily, so we fetch it fresh and
// cache it briefly in-memory; if the provider is unreachable we fall back to a
// fixed rate so approvals never hard-fail.
import "server-only";

// open.er-api.com is a free, key-less endpoint (base currency in the path).
// Returns { result: "success", rates: { USD: <usd per 1 PKR>, ... }, ... }.
const FX_ENDPOINT = "https://open.er-api.com/v6/latest/PKR";

// Fallback used only when the live fetch fails (≈ mid-2026 ballpark). Kept
// conservative; a stale rate is far better than a crash on approve.
const FALLBACK_USD_PER_PKR = 0.0036;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Module-level cache. Survives across requests in a warm serverless instance.
let cached: { rate: number; fetchedAt: number } | null = null;

export interface FxRate {
  usdPerPkr: number; // multiply a PKR amount by this to get USD
  fetchedAt: number; // epoch ms when the rate was obtained
  live: boolean; // false => served from the hardcoded fallback
}

// Live USD-per-PKR rate, cached for CACHE_TTL_MS. Never throws — on any failure
// it returns the last good cached value, else the fallback.
export async function getUsdPerPkr(): Promise<FxRate> {
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { usdPerPkr: cached.rate, fetchedAt: cached.fetchedAt, live: true };
  }

  try {
    const res = await fetch(FX_ENDPOINT, {
      // Let Next cache the upstream response for an hour too.
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const usd = data?.rates?.USD;
    if (data?.result !== "success" || typeof usd !== "number" || !(usd > 0)) {
      throw new Error("FX payload missing USD rate");
    }
    cached = { rate: usd, fetchedAt: now };
    return { usdPerPkr: usd, fetchedAt: now, live: true };
  } catch {
    // Reuse the last good rate if we have one, otherwise the fallback.
    if (cached) return { usdPerPkr: cached.rate, fetchedAt: cached.fetchedAt, live: true };
    return { usdPerPkr: FALLBACK_USD_PER_PKR, fetchedAt: now, live: false };
  }
}

// Convert a PKR amount to USD, rounded to cents.
export function pkrToUsd(amountPkr: number, usdPerPkr: number): number {
  return Math.round(amountPkr * usdPerPkr * 100) / 100;
}
