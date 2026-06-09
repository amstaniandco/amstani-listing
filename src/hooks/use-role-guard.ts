"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { portalSelectors, usePortalStore } from "@/store/portal-store";
import type { Role } from "@/types/portal";

function useRoleGuard(role: Role, redirectTo = "/login") {
  const router = useRouter();
  const hydrated = usePortalStore((state) => state.hydrated);
  const account = usePortalStore(portalSelectors.currentAccount);

  useEffect(() => {
    if (!hydrated) return;

    if (!account || account.role !== role) {
      router.replace(redirectTo);
    }
  }, [account, hydrated, redirectTo, role, router]);

  return {
    hydrated,
    account,
    ready: hydrated && Boolean(account) && account.role === role,
  };
}

export { useRoleGuard };
