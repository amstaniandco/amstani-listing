import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/auth/user";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Enter a valid email and password." }, { status: 422 });
  }
  const { email, password } = parsed.data;

  try {
    const user = await findUserByEmail(email);
    // Generic message — don't reveal whether the email exists.
    if (!user || !(await verifyPassword(password, user.password))) {
      return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    }

    // Only portal roles may sign in here. Regular eCommerce customers (USER)
    // are not part of the portal.
    if (user.role !== "ADMIN" && user.role !== "BRAND_REP") {
      return NextResponse.json(
        { ok: false, message: "This account doesn't have portal access." },
        { status: 403 },
      );
    }

    // Gate by account status (only APPROVED may log in).
    if (user.status === "PENDING") {
      return NextResponse.json(
        { ok: false, message: "Your account is pending admin approval." },
        { status: 403 },
      );
    }
    if (user.status === "BLOCKED") {
      return NextResponse.json(
        { ok: false, message: "This account has been suspended. Contact support." },
        { status: 403 },
      );
    }

    // A brand rep must have a brand assigned, or the brand area can't load.
    if (user.role === "BRAND_REP" && !user.brandId) {
      return NextResponse.json(
        { ok: false, message: "Your account has no brand assigned. Contact an admin." },
        { status: 403 },
      );
    }

    const token = await signSession({
      sub: user.id,
      email: user.email,
      role: user.role,
      brandId: user.brandId,
      name: user.name,
    });

    const redirectTo =
      user.role === "ADMIN" ? "/admin/dashboard" : "/brand/dashboard";

    const res = NextResponse.json({ ok: true, redirectTo, role: user.role });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
