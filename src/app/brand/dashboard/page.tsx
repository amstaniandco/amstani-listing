import { redirect } from "next/navigation";
import { Archive, Package, ShoppingBag } from "lucide-react";

import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getShellUser } from "@/lib/auth/shell-user";
import { listProductsForBrand } from "@/lib/data/products";
import { formatCurrency, formatDate } from "@/lib/format";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/brand/dashboard", icon: "dashboard" },
  { label: "Categories", href: "/brand/categories", icon: "categories" },
  { label: "Products", href: "/brand/products", icon: "products" },
];

export default async function BrandDashboardPage() {
  const ctx = await getShellUser();
  if (!ctx) redirect("/login");
  if (ctx.session.role !== "BRAND_REP" || !ctx.session.brandId) redirect("/login");

  const products = await listProductsForBrand(ctx.session.brandId);
  const published = products.filter((p) => p.isPublished).length;
  const drafts = products.length - published;

  return (
    <DashboardShell
      title="Brand dashboard"
      description="Track your product listings at a glance."
      navItems={navItems}
      user={ctx.shell}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Products" value={String(products.length)} icon={<Package className="h-5 w-5" />} />
          <StatCard label="Published" value={String(published)} icon={<ShoppingBag className="h-5 w-5" />} />
          <StatCard label="Drafts" value={String(drafts)} icon={<Archive className="h-5 w-5" />} />
        </div>

        <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Recent products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.length === 0 ? (
              <EmptyState title="No products yet" description="Add your first product to see it here." />
            ) : (
              products.slice(0, 5).map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">{p.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{p.sku}</p>
                    </div>
                    <Badge variant={p.isPublished ? "success" : "secondary"}>{p.isPublished ? "Published" : "Draft"}</Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>{formatCurrency(p.price)}</span>
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
