import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

// Single source of truth for route access. Runs on the edge.
// - no session            -> /login
// - role not ADMIN/BRAND_REP (or rep w/o brand) -> clear cookie, /login
// - admin in brand area    -> /admin/dashboard
// - brand rep in admin area -> /brand/dashboard
const ADMIN_PREFIX = "/admin";
const BRAND_PREFIXES = ["/brand", "/profile"];

function redirectTo(request: NextRequest, pathname: string, clearCookie = false) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const res = NextResponse.redirect(url);
  if (clearCookie) res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith(ADMIN_PREFIX);
  const isBrandArea = BRAND_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isAdminArea && !isBrandArea) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) return redirectTo(request, "/login");

  const isAdmin = session.role === "ADMIN";
  const isRep = session.role === "BRAND_REP" && Boolean(session.brandId);

  // Any session that is neither a valid admin nor a valid brand rep is invalid
  // for the portal — clear it and bounce to login (prevents redirect loops).
  if (!isAdmin && !isRep) return redirectTo(request, "/login", true);

  if (isAdminArea && !isAdmin) return redirectTo(request, "/brand/dashboard");
  if (isBrandArea && isAdmin) return redirectTo(request, "/admin/dashboard");

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/brand/:path*", "/profile/:path*"],
};
