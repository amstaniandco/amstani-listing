import { redirect } from "next/navigation";

import { getShellUser } from "@/lib/auth/shell-user";
import { listCategories, listCategoryRequests } from "@/lib/data/categories";
import { BrandCategoriesClient } from "./categories-client";

export default async function BrandCategoriesPage() {
  const ctx = await getShellUser();
  if (!ctx) redirect("/login");
  if (ctx.session.role !== "BRAND_REP" || !ctx.session.brandId) redirect("/login");

  const [categories, requests] = await Promise.all([
    listCategories(),
    listCategoryRequests(ctx.session.brandId),
  ]);

  return (
    <BrandCategoriesClient
      shell={ctx.shell}
      categories={categories}
      initialRequests={requests.map((r) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        createdAt: r.createdAt,
      }))}
    />
  );
}
