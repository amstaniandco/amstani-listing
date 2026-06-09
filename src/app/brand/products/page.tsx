import { redirect } from "next/navigation";

import { getShellUser } from "@/lib/auth/shell-user";
import { listProductsForBrand } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";
import { BrandProductsClient } from "./products-client";

export default async function BrandProductsPage() {
  const ctx = await getShellUser();
  if (!ctx) redirect("/login");
  if (ctx.session.role !== "BRAND_REP" || !ctx.session.brandId) redirect("/login");

  const [products, categories] = await Promise.all([
    listProductsForBrand(ctx.session.brandId),
    listCategories(),
  ]);

  return (
    <BrandProductsClient
      shell={ctx.shell}
      brandName={ctx.shell.brandName ?? ctx.shell.name}
      initialProducts={products}
      categories={categories}
    />
  );
}
