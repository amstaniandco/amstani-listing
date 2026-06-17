import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/current-user";
import { approveProduct, rejectProduct, requestProductChanges } from "@/lib/data/products";

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "request_changes"]),
  reason: z.string().optional(),
});

// Admin approves, rejects, or requests changes on a brand rep's pending product.
// Approve         -> APPROVED (eligible to be listed on the live store).
// Reject          -> REJECTED + reason, force-unpublished.
// Request changes -> CHANGES_REQUESTED + note, force-unpublished (rep edits & resubmits).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid body." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid action." }, { status: 422 });
  }

  try {
    if (parsed.data.action === "approve") {
      await approveProduct(id, admin.sub);
      return NextResponse.json({ ok: true, approvalStatus: "APPROVED" });
    }
    if (parsed.data.action === "request_changes") {
      await requestProductChanges(id, admin.sub, parsed.data.reason);
      return NextResponse.json({ ok: true, approvalStatus: "CHANGES_REQUESTED" });
    }
    await rejectProduct(id, admin.sub, parsed.data.reason);
    return NextResponse.json({ ok: true, approvalStatus: "REJECTED" });
  } catch (e) {
    return NextResponse.json({ ok: false, message: String((e as Error).message) }, { status: 500 });
  }
}
