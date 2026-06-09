"use client";

import { useMemo } from "react";
import { Archive, Boxes, ChartNoAxesCombined, Package, ShoppingBag, Sparkles } from "lucide-react";

import { AnalyticsChart } from "@/components/charts/analytics-chart";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";
import { portalSelectors, usePortalStore } from "@/store/portal-store";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { Link } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/brand/dashboard", icon: ChartNoAxesCombined },
  { label: "Categories", href: "/brand/categories", icon: Archive },
  { label: "Products", href: "/brand/products", icon: Package },
  { label: "Profile", href: "/profile", icon: Sparkles },
];

export default function BrandDashboardPage() {
  const { ready, account } = useRoleGuard("brand");
  const categories = usePortalStore((state) => state.categories);
  const products = usePortalStore((state) => state.products);
  const brand = usePortalStore(portalSelectors.currentBrand);

  const brandProducts = useMemo(
    () => products.filter((product) => product.brandId === brand?.id),
    [brand?.id, products],
  );
  const brandCategories = useMemo(
    () => categories.filter((category) => category.brandId === brand?.id),
    [brand?.id, categories],
  );

  const publishedProducts = brandProducts.filter((product) => product.published).length;
  const draftProducts = brandProducts.filter((product) => !product.published).length;
  const outOfStockProducts = brandProducts.filter((product) => product.stockStatus === "out-of-stock").length;
  const chartData = [
    { label: "Mon", revenue: 820, orders: 11 },
    { label: "Tue", revenue: 1260, orders: 16 },
    { label: "Wed", revenue: 980, orders: 14 },
    { label: "Thu", revenue: 1540, orders: 19 },
    { label: "Fri", revenue: 1860, orders: 26 },
    { label: "Sat", revenue: 2140, orders: 29 },
    { label: "Sun", revenue: 1720, orders: 24 },
  ];

  if (!ready || !account || !brand) {
    return null;
  }

  return (
    <DashboardShell
      title="Brand dashboard"
      description="Track your products, categories, and performance from a clean workspace designed for daily operations."
      navItems={navItems}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Products" value={String(brandProducts.length)} icon={<Package className="h-5 w-5" />} />
          <StatCard label="Categories" value={String(brandCategories.length)} icon={<Boxes className="h-5 w-5" />} />
          <StatCard label="Published Products" value={String(publishedProducts)} icon={<ShoppingBag className="h-5 w-5" />} />
          <StatCard label="Draft Products" value={String(draftProducts)} icon={<Archive className="h-5 w-5" />} />
          <StatCard label="Out of Stock" value={String(outOfStockProducts)} icon={<Sparkles className="h-5 w-5" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AnalyticsChart data={chartData} />
          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Recent products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandProducts.length === 0 ? (
                <EmptyState title="No products yet" description="Add your first product to see it here." />
              ) : (
                brandProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950 dark:text-white">{product.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{product.sku}</p>
                      </div>
                      <Badge variant={product.published ? "success" : "secondary"}>{product.published ? "Live" : "Draft"}</Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>{formatCurrency(product.price)}</span>
                      <span>{formatDate(product.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Workspace overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Brand</p>
              <p className="mt-1 text-lg font-semibold">{brand.brandName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Account</p>
              <p className="mt-1 text-lg font-semibold">{brand.fullName}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Joined</p>
              <p className="mt-1 text-lg font-semibold">{formatDate(brand.joinedAt ?? new Date().toISOString())}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
