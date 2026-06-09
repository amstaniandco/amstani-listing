// Portal session = a signed JWT in an httpOnly cookie.
// jose is edge-runtime compatible, so these helpers work in both route handlers
// (Node) and middleware (Edge). No Supabase Auth involved.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "amstani_session";
const ALG = "HS256";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8h

export interface SessionPayload {
  sub: string; // user id
  email: string;
  role: "USER" | "ADMIN" | "BRAND_REP";
  brandId: string | null;
  name: string;
}

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role: payload.role as SessionPayload["role"],
      brandId: (payload.brandId as string | null) ?? null,
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
