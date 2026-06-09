// Build the ShellUser passed to DashboardShell from the current session.
import "server-only";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getBrandById } from "@/lib/auth/user";
import type { ShellUser } from "@/components/shared/dashboard-shell";
import type { SessionPayload } from "@/lib/auth/session";

export async function getShellUser(): Promise<{ session: SessionPayload; shell: ShellUser } | null> {
  const session = await getCurrentUser();
  if (!session) return null;

  let brandName: string | null = null;
  if (session.brandId) {
    const brand = await getBrandById(session.brandId);
    brandName = brand?.name ?? null;
  }

  return {
    session,
    shell: {
      name: session.name,
      email: session.email,
      role: session.role === "ADMIN" ? "ADMIN" : "BRAND_REP",
      brandName,
    },
  };
}
