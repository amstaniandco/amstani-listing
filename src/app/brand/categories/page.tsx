"use client";

import { useMemo, useState } from "react";
import { Grid2x2, Plus, Search, Table2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { portalSelectors, usePortalStore } from "@/store/portal-store";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { CategoryForm } from "@/features/categories/components/category-form";

const navItems = [
  { label: "Dashboard", href: "/brand/dashboard", icon: Grid2x2 },
  { label: "Categories", href: "/brand/categories", icon: Table2 },
  { label: "Products", href: "/brand/products", icon: Search },
  { label: "Profile", href: "/profile", icon: Pencil },
];

export default function BrandCategoriesPage() {
  const { ready, account } = useRoleGuard("brand");
  const brand = usePortalStore(portalSelectors.currentBrand);
  const categories = usePortalStore((state) => state.categories);
  const deleteCategory = usePortalStore((state) => state.deleteCategory);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const brandCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.brandId === brand?.id && category.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [brand?.id, categories, search],
  );
  const editingCategory = categories.find((category) => category.id === editingCategoryId) ?? null;
  const deletingCategory = categories.find((category) => category.id === deleteId) ?? null;

  if (!ready || !account || !brand) {
    return null;
  }

  return (
    <DashboardShell title="Categories" description="Create and manage only your own brand categories." navItems={navItems}>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Brand" }, { label: "Categories" }]} />

        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/80 p-4 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Category management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Create, edit, search, and delete categories for your own catalog.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" className="pl-9" />
            </div>
            <Button onClick={() => { setEditingCategoryId(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Create category
            </Button>
          </div>
        </div>

        <Tabs value={view} onValueChange={(value) => setView(value as "grid" | "table")}>
          <TabsList>
            <TabsTrigger value="grid"><Grid2x2 className="mr-2 h-4 w-4" />Grid</TabsTrigger>
            <TabsTrigger value="table"><Table2 className="mr-2 h-4 w-4" />Table</TabsTrigger>
          </TabsList>
        </Tabs>

        {brandCategories.length === 0 ? (
          <EmptyState
            title="No categories found"
            description="Try a different search or create a new category for this brand."
            actionLabel="Create category"
            onAction={() => setFormOpen(true)}
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {brandCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
                <div className="h-44 overflow-hidden">
                  <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                </div>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{category.description}</p>
                    </div>
                    <StatusBadge status={category.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Created {formatDate(category.createdAt)}</span>
                    <span>{category.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingCategoryId(category.id); setFormOpen(true); }}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(category.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brandCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-md text-slate-500 dark:text-slate-400">{category.description}</TableCell>
                      <TableCell><StatusBadge status={category.status} /></TableCell>
                      <TableCell>{formatDate(category.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingCategoryId(category.id); setFormOpen(true); }}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteId(category.id)}>Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        brandId={brand.id}
        category={editingCategory}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete category"
        description={`Delete ${deletingCategory?.name ?? "this category"}? Products using it will have the link removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteId) {
            deleteCategory(deleteId);
            toast.success("Category deleted.");
          }
          setDeleteId(null);
        }}
        onOpenChange={(open) => !open && setDeleteId(null)}
      />
    </DashboardShell>
  );
}
