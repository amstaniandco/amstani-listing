import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";
import { createBrandRep, findUserByEmail, getBrandById } from "@/lib/auth/user";

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(5),
  password: z.string().min(8),
  brandId: z.string().min(1), // selected from existing brands
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please check the form fields.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const { fullName, email, password, brandId } = parsed.data;

  try {
    // Email must be unique.
    if (await findUserByEmail(email)) {
      return NextResponse.json(
        { ok: false, message: "An account with that email already exists." },
        { status: 409 },
      );
    }

    // Brand must exist (reps select; they never create brands).
    if (!(await getBrandById(brandId))) {
      return NextResponse.json({ ok: false, message: "Selected brand not found." }, { status: 422 });
    }

    const passwordHash = await hashPassword(password);
    await createBrandRep({ email, name: fullName, passwordHash, brandId });

    // No session: account is PENDING until an admin approves.
    return NextResponse.json({
      ok: true,
      message: "Request submitted. An admin will review your account before you can log in.",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
