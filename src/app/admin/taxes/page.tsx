import { redirect } from "next/navigation";

import { getShellUser } from "@/lib/auth/shell-user";
import { getTaxSettings, listShippingRates } from "@/lib/data/tax";
import { TaxSettingsClient } from "./taxes-client";

export default async function AdminTaxesPage() {
  const ctx = await getShellUser();
  if (!ctx) redirect("/login");
  if (ctx.session.role !== "ADMIN") redirect("/login");

  const [settings, brackets] = await Promise.all([getTaxSettings(), listShippingRates()]);

  return <TaxSettingsClient shell={ctx.shell} initialSettings={settings} initialBrackets={brackets} />;
}
