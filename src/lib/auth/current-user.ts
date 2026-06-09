// Read the current portal session from the request cookies (server-side).
import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session";

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function requireBrandRep(): Promise<SessionPayload> {
  const user = await requireUser();
  if (user.role !== "BRAND_REP" || !user.brandId) throw new Error("FORBIDDEN");
  return user;
}
