"use client";

import { useMemo, useState } from "react";
import { Eye, Filter, Grid2x2, Package, Plus, Search, SortAsc, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { portalSelectors, usePortalStore } from "@/store/portal-store";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { ProductForm } from "@/features/products/components/product-form";

const navItems = [
  { label: "Dashboard", href: "/brand/dashboard", icon: Grid2x2 },
  { label: "Categories", href: "/brand/categories", icon: Package },
  { label: "Products", href: "/brand/products", icon: Table2 },
  { label: "Profile", href: "/profile", icon: Plus },
];

const pageSize = 6;

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-high", label: "Price high" },
  { value: "price-low", label: "Price low" },
] as const;

export default function BrandProductsPage() {
  const { ready, account } = useRoleGuard("brand");
  const brand = usePortalStore(portalSelectors.currentBrand);
  const categories = usePortalStore((state) => state.categories);
  const products = usePortalStore((state) => state.products);
  const stores = usePortalStore((state) => state.stores);
  const deleteProduct = usePortalStore((state) => state.deleteProduct);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("newest");
  const [view, setView] = useState<"grid" | "table">("table");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const brandProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesBrand = product.brandId === brand?.id;
        const matchesSearch =
          `${product.title} ${product.sku} ${product.description}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" && product.published) ||
          (statusFilter === "draft" && !product.published) ||
          (statusFilter === product.stockStatus);
        return matchesBrand && matchesSearch && matchesStatus;
      }),
    [brand?.id, products, search, statusFilter],
  );

  const sortedProducts = useMemo(() => {
    const items = [...brandProducts];
    switch (sortBy) {
      case "oldest":
        return items.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      case "price-high":
        return items.sort((left, right) => right.price - left.price);
      case "price-low":
        return items.sort((left, right) => left.price - right.price);
      default:
        return items.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }
  }, [brandProducts, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const currentProducts = sortedProducts.slice((page - 1) * pageSize, page * pageSize);
  const editingProduct = products.find((product) => product.id === editingProductId) ?? null;
  const previewProduct = products.find((product) => product.id === previewId) ?? null;
  const deletingProduct = products.find((product) => product.id === deleteId) ?? null;
  const brandCategories = categories.filter((category) => category.brandId === brand?.id);

  if (!ready || !account || !brand) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DashboardShell title="Products" description="Create, preview, sort, and manage products for your own brand." navItems={navItems}>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Brand" }, { label: "Products" }]} />

        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/80 p-4 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Product management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">A premium frontend workflow for catalog creation and moderation.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search products" className="pl-9" />
            </div>
            <Button onClick={() => { setEditingProductId(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> New product
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={view} onValueChange={(value) => setView(value as "grid" | "table")}>
            <TabsList>
              <TabsTrigger value="table"><Table2 className="mr-2 h-4 w-4" />Table</TabsTrigger>
              <TabsTrigger value="grid"><Grid2x2 className="mr-2 h-4 w-4" />Grid</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in-stock">In stock</SelectItem>
                <SelectItem value="low-stock">Low stock</SelectItem>
                <SelectItem value="out-of-stock">Out of stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
              <SelectTrigger className="w-44"><SortAsc className="mr-2 h-4 w-4" /><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {currentProducts.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try a different search or create your first product in this brand workspace."
            actionLabel="Create product"
            onAction={() => setFormOpen(true)}
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
                <div className="relative h-48 overflow-hidden">
                  <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <Badge variant={product.published ? "success" : "secondary"}>{product.published ? "Published" : "Draft"}</Badge>
                    <StatusBadge status={product.stockStatus} />
                  </div>
                </div>
                <CardContent className="space-y-4 p-5">
                  <div>
                    <h3 className="text-lg font-semibold">{product.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{product.sku}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>{formatCurrency(product.price)}</span>
                    <span>{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.categoryIds.map((categoryId) => {
                      const category = categories.find((item) => item.id === categoryId);
                      return category ? <Badge key={category.id} variant="outline">{category.name}</Badge> : null;
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewId(product.id)}><Eye className="mr-2 h-4 w-4" />Preview</Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditingProductId(product.id); setFormOpen(true); }}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(product.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={product.images[0]} alt={product.title} className="h-12 w-12 rounded-xl object-cover" />
                          <div>
                            <p className="font-medium text-slate-950 dark:text-white">{product.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{product.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.categoryIds.length}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.totalStock}</TableCell>
                      <TableCell><StatusBadge status={product.stockStatus} /></TableCell>
                      <TableCell>{product.published ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setPreviewId(product.id)}>Preview</Button>
                          <Button variant="outline" size="sm" onClick={() => { setEditingProductId(product.id); setFormOpen(true); }}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteId(product.id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</Button>
          </div>
        </div>
      </div>

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        brandId={brand.id}
        brandName={brand.brandName ?? brand.fullName}
        categories={brandCategories}
        stores={stores}
        product={editingProduct}
      />

      <Dialog open={Boolean(previewProduct)} onOpenChange={(open) => !open && setPreviewId(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewProduct?.title}</DialogTitle>
            <DialogDescription>{previewProduct?.description}</DialogDescription>
          </DialogHeader>
          {previewProduct ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <img src={previewProduct.images[0]} alt={previewProduct.title} className="h-72 w-full rounded-3xl object-cover" />
                <div className="flex flex-wrap gap-2">
                  {previewProduct.images.map((image) => (
                    <img key={image} src={image} alt={previewProduct.title} className="h-16 w-16 rounded-xl object-cover" />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={previewProduct.published ? "success" : "secondary"}>{previewProduct.published ? "Published" : "Draft"}</Badge>
                  <StatusBadge status={previewProduct.stockStatus} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Price" value={formatCurrency(previewProduct.price)} />
                  <Info label="Stock" value={String(previewProduct.totalStock)} />
                  <Info label="SKU" value={previewProduct.sku} />
                  <Info label="Material" value={previewProduct.material} />
                  <Info label="Shipping" value={previewProduct.shippingClass} />
                  <Info label="Store" value={stores.find((store) => store.id === previewProduct.storeId)?.name ?? "Global Inventory"} />
                </div>
                <div>
                  <p className="text-sm font-medium">Categories</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewProduct.categoryIds.map((categoryId) => {
                      const category = categories.find((item) => item.id === categoryId);
                      return category ? <Badge key={category.id} variant="outline">{category.name}</Badge> : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete product"
        description={`Delete ${deletingProduct?.title ?? "this product"}? This action removes it from the catalog.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteId) {
            deleteProduct(deleteId);
            toast.success("Product deleted.");
          }
          setDeleteId(null);
        }}
        onOpenChange={(open) => !open && setDeleteId(null)}
      />
    </DashboardShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
