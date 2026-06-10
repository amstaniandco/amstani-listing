"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Image as ImageIcon, Pencil, Plus, ScanEye, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell, type NavItem, type ShellUser } from "@/components/shared/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductForm, type CategoryOption, type EditProduct } from "@/features/products/components/product-form";
import { ProductView } from "@/features/products/components/product-view";

interface ProductListItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  isPublished: boolean;
  mainImage: string | null;
  createdAt: string;
  categoryIds: string[];
  brandName: string | null;
  categoryNames: string[];
  totalStock: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
}

const approvalVariant: Record<ProductListItem["approvalStatus"], "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const approvalLabel: Record<ProductListItem["approvalStatus"], string> = {
  PENDING: "Awaiting approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/brand/dashboard", icon: "dashboard" },
  { label: "Categories", href: "/brand/categories", icon: "categories" },
  { label: "Products", href: "/brand/products", icon: "products" },
];

export function BrandProductsClient({
  shell,
  brandName,
  initialProducts,
  categories,
}: {
  shell: ShellUser;
  brandName: string;
  initialProducts: ProductListItem[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<EditProduct | null>(null);
  const [viewing, setViewing] = useState<(EditProduct & { brandName?: string | null; categoryNames?: string[] }) | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function refresh() {
    const res = await fetch("/api/products");
    const data = await res.json();
    if (data.ok) setProducts(data.products);
    router.refresh();
  }

  function openCreate() {
    setEditing(null);
    setFormKey((k) => k + 1); // remount the form so its state resets
    setFormOpen(true);
  }

  async function openEdit(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (!data.ok) { toast.error(data.message ?? "Could not load product."); return; }
      setEditing(data.product as EditProduct);
      setFormKey((k) => k + 1);
      setFormOpen(true);
    } finally {
      setBusyId(null);
    }
  }

  async function openView(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (!data.ok) { toast.error(data.message ?? "Could not load product."); return; }
      setViewing(data.product);
      setViewOpen(true);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    const data = await res.json();
    setDeleteId(null);
    if (!data.ok) {
      toast.error(data.message ?? "Delete failed.");
      return;
    }
    toast.success("Product deleted.");
    refresh();
  }

  async function togglePublish(id: string, next: boolean) {
    const res = await fetch(`/api/products/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: next }),
    });
    const data = await res.json();
    if (!data.ok) {
      toast.error(data.message ?? "Update failed.");
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isPublished: next } : p)));
    toast.success(next ? "Product enabled." : "Product disabled.");
    router.refresh();
  }

  return (
    <DashboardShell
      title="Products"
      description="Create and manage product listings for your brand."
      navItems={navItems}
      user={shell}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" className="pl-9" />
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add product
          </Button>
        </div>

        <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState title="No products" description="Add your first product to get started." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.mainImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.sku}</TableCell>
                      <TableCell>{p.brandName ?? "—"}</TableCell>
                      <TableCell>
                        {p.categoryNames.length ? (
                          <span className="text-sm">{p.categoryNames.slice(0, 2).join(", ")}{p.categoryNames.length > 2 ? "…" : ""}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{p.totalStock}</TableCell>
                      <TableCell>
                        <Badge variant={approvalVariant[p.approvalStatus]}>
                          {approvalLabel[p.approvalStatus]}
                        </Badge>
                        {p.approvalStatus === "REJECTED" && p.rejectReason ? (
                          <p className="mt-1 max-w-[14rem] text-xs text-rose-600" title={p.rejectReason}>
                            {p.rejectReason}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.isPublished ? "success" : "secondary"}>
                          {p.isPublished ? "Published" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" disabled={busyId === p.id} onClick={() => openView(p.id)}>
                            <ScanEye className="mr-2 h-4 w-4" /> View
                          </Button>
                          <Button variant="outline" size="sm" disabled={busyId === p.id} onClick={() => openEdit(p.id)}>
                            <Pencil className="mr-2 h-4 w-4" /> {p.approvalStatus === "REJECTED" ? "Edit & resubmit" : "Edit"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!p.isPublished && p.approvalStatus !== "APPROVED"}
                            title={!p.isPublished && p.approvalStatus !== "APPROVED" ? "Awaiting admin approval" : undefined}
                            onClick={() => togglePublish(p.id, !p.isPublished)}
                          >
                            {p.isPublished ? (
                              <><EyeOff className="mr-2 h-4 w-4" /> Disable</>
                            ) : (
                              <><Eye className="mr-2 h-4 w-4" /> Enable</>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" className="text-rose-600" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ProductForm
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        brandName={brandName}
        categories={categories}
        product={editing}
        onSaved={refresh}
      />

      <ProductView open={viewOpen} onOpenChange={setViewOpen} product={viewing} />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete product?"
        description="This permanently removes the listing from the catalog."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </DashboardShell>
  );
}
