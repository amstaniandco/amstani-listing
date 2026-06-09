import { redirect } from "next/navigation";

import { getShellUser } from "@/lib/auth/shell-user";
import { listBrandReps } from "@/lib/data/admin-users";
import { countBrands, countCategories, listCategoryRequests } from "@/lib/data/categories";
import { countAllProducts, listAllProducts } from "@/lib/data/products";
import { AdminDashboardClient } from "./admin-client";

export default async function AdminDashboardPage() {
  const ctx = await getShellUser();
  if (!ctx) redirect("/login");
  if (ctx.session.role !== "ADMIN") redirect("/login");

  const [reps, requests, products, totalProducts, totalBrands, totalCategories] =
    await Promise.all([
      listBrandReps(),
      listCategoryRequests(),
      listAllProducts(),
      countAllProducts(),
      countBrands(),
      countCategories(),
    ]);

  return (
    <AdminDashboardClient
      shell={ctx.shell}
      counts={{ products: totalProducts, brands: totalBrands, categories: totalCategories }}
      initialUsers={reps.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        status: r.status,
        brandName: r.brandName,
        createdAt: r.createdAt,
      }))}
      initialRequests={requests.map((r) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        brandName: r.brandName,
        createdAt: r.createdAt,
      }))}
      initialProducts={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        isPublished: p.isPublished,
        brandName: p.brandName,
      }))}
    />
  );
}
