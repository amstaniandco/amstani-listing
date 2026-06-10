import { redirect } from "next/navigation";

import { getShellUser } from "@/lib/auth/shell-user";
import { listBrandReps } from "@/lib/data/admin-users";
import { countBrands, countCategories, listCategories, listCategoryRequests } from "@/lib/data/categories";
import {
  countAllProducts,
  listAllProducts,
  listPendingProductsForAdmin,
} from "@/lib/data/products";
import { getTaxSettings, listShippingRates } from "@/lib/data/tax";
import { AdminDashboardClient } from "./admin-client";

export default async function AdminDashboardPage() {
  const ctx = await getShellUser();
  if (!ctx) redirect("/login");
  if (ctx.session.role !== "ADMIN") redirect("/login");

  const [reps, requests, products, pendingProducts, categories, taxRates, shippingBrackets, totalProducts, totalBrands, totalCategories] =
    await Promise.all([
      listBrandReps(),
      listCategoryRequests(),
      listAllProducts(),
      listPendingProductsForAdmin(),
      listCategories(),
      getTaxSettings(),
      listShippingRates(),
      countAllProducts(),
      countBrands(),
      countCategories(),
    ]);
  const taxDefaults = {
    profitPct: taxRates.profitPct,
    tariffPct: taxRates.tariffPct,
    shippingPerKg: taxRates.shippingPerKg,
    shippingBrackets: shippingBrackets.map((b) => ({ minKg: b.minKg, maxKg: b.maxKg, ratePerKg: b.ratePerKg })),
  };

  return (
    <AdminDashboardClient
      shell={ctx.shell}
      counts={{ products: totalProducts, brands: totalBrands, categories: totalCategories }}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      taxDefaults={taxDefaults}
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
        approvalStatus: p.approvalStatus,
      }))}
      initialPendingProducts={pendingProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        brandName: p.brandName,
        submittedAt: p.submittedAt,
        rejectReason: p.rejectReason,
        isPublished: p.isPublished,
        categoryIds: p.categoryIds,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        costPrice: p.costPrice,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        stockStatus: p.stockStatus,
        totalStock: p.totalStock,
        isFeatured: p.isFeatured,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        categoryNames: p.categoryNames,
        images: p.images,
        variants: p.variants.map((v) => ({
          size: v.size,
          color: v.color ?? "",
          stockQuantity: v.stockQuantity,
          skuVariant: v.skuVariant,
        })),
        sizeCharts: p.sizeCharts,
        shipping: p.shipping,
        profitPct: p.profitPct,
        tariffPct: p.tariffPct,
        shippingCostOverride: p.shippingCostOverride,
        wholesalePrice: p.wholesalePrice,
      }))}
    />
  );
}
