"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DashboardShell, type NavItem, type ShellUser } from "@/components/shared/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { ProductView } from "@/features/products/components/product-view";
import { ProductForm, type CategoryOption, type EditProduct, type TaxDefaults } from "@/features/products/components/product-form";
import type { ApprovalStatus } from "@/types/db";

interface UserItem {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "BLOCKED";
  brandName: string | null;
  createdAt: string;
}
interface RequestItem {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  brandName: string | null;
  createdAt: string;
}
interface ProductItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  isPublished: boolean;
  brandName: string | null;
  approvalStatus: ApprovalStatus;
}

// Full pending-product payload — extends EditProduct so it can be handed
// straight to <ProductView> for a complete pre-approval review.
type PendingProductItem = EditProduct & {
  brandName: string | null;
  categoryNames: string[];
  submittedAt: string | null;
  rejectReason: string | null;
};

const approvalVariant: Record<ApprovalStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CHANGES_REQUESTED: "warning",
};

const approvalLabel: Record<ApprovalStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes requested",
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "admin" },
  { label: "Shipping & Taxes", href: "/admin/taxes", icon: "taxes" },
  { label: "Profile", href: "/profile", icon: "profile" },
];

const userStatusVariant: Record<UserItem["status"], "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  BLOCKED: "danger",
};
const reqStatusVariant: Record<RequestItem["status"], "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function AdminDashboardClient({
  shell,
  counts,
  categories,
  taxDefaults,
  initialUsers,
  initialRequests,
  initialProducts,
  initialPendingProducts,
}: {
  shell: ShellUser;
  counts: { products: number; brands: number; categories: number };
  categories: CategoryOption[];
  taxDefaults: TaxDefaults;
  initialUsers: UserItem[];
  initialRequests: RequestItem[];
  initialProducts: ProductItem[];
  initialPendingProducts: PendingProductItem[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [requests, setRequests] = useState(initialRequests);
  const [products, setProducts] = useState(initialProducts);
  const [pendingProducts, setPendingProducts] = useState(initialPendingProducts);
  const [viewing, setViewing] = useState<PendingProductItem | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [approveItem, setApproveItem] = useState<PendingProductItem | null>(null);
  // "Request changes" dialog: which product, and the note the admin writes.
  const [changesId, setChangesId] = useState<string | null>(null);
  const [changesNote, setChangesNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  // Admin product editor.
  const [editing, setEditing] = useState<EditProduct | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function refreshPending() {
    const res = await fetch("/api/admin/products/pending");
    const data = await res.json().catch(() => null);
    if (data?.ok) setPendingProducts(data.products);
    router.refresh();
  }

  async function openEdit(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      const data = await res.json();
      if (!data.ok) { toast.error(data.message ?? "Could not load product."); return; }
      setEditing(data.product as EditProduct);
      setEditId(id);
      setFormKey((k) => k + 1);
      setFormOpen(true);
    } finally {
      setBusyId(null);
    }
  }

  const pendingUsers = users.filter((u) => u.status === "PENDING").length;
  const pendingReqs = requests.filter((r) => r.status === "PENDING").length;

  async function reviewProduct(id: string, action: "approve" | "reject" | "request_changes", reason?: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.message ?? "Action failed.");
        return;
      }
      // Remove from the pending queue and reflect the new status in the catalog tab.
      setPendingProducts((prev) => prev.filter((p) => p.id !== id));
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, approvalStatus: data.approvalStatus } : p)),
      );
      toast.success(
        action === "approve"
          ? "Product approved and listed."
          : action === "request_changes"
            ? "Sent back to the brand for changes."
            : "Product rejected.",
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function userAction(id: string, action: "approve" | "reject" | "suspend" | "reactivate") {
    const res = await fetch(`/api/admin/users/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!data.ok) {
      toast.error(data.message ?? "Action failed.");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: data.status } : u)));
    toast.success("Updated.");
    router.refresh();
  }

  async function deleteUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}/status`, { method: "DELETE" });
    const data = await res.json();
    if (!data.ok) {
      toast.error(data.message ?? "Delete failed.");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("Brand rep deleted.");
    router.refresh();
  }

  async function requestAction(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/admin/categories/requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!data.ok) {
      toast.error(data.message ?? "Action failed.");
      return;
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED" } : r)),
    );
    toast.success(action === "approve" ? "Category approved." : "Request rejected.");
    router.refresh();
  }

  async function deleteProduct(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.ok) {
      toast.error(data.message ?? "Delete failed.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted.");
    router.refresh();
  }

  // Final (after-tax) price the admin will lock in on approve. Uses the product's
  // overrides where set, else the global rates / weight-bracket lookup —
  // mirrors the server math in tax.ts / approveProduct.
  function finalPriceOf(p: PendingProductItem): number {
    const base = p.wholesalePrice ?? p.price;
    const profit = p.profitPct ?? taxDefaults.profitPct;
    const tariff = p.tariffPct ?? taxDefaults.tariffPct;
    const total = profit + tariff;
    const weight = p.shipping?.weight ?? 0;
    let shipping = p.shippingCostOverride ?? 0;
    if (p.shippingCostOverride == null) {
      const b = taxDefaults.shippingBrackets.find(
        (br) => weight >= br.minKg && (br.maxKg == null || weight <= br.maxKg),
      );
      const rate = b ? b.ratePerKg : taxDefaults.shippingPerKg;
      shipping = Math.round(weight * rate * 100) / 100;
    }
    return Math.round((base * (1 + total / 100) + shipping) * 100) / 100;
  }

  return (
    <DashboardShell
      title="Admin dashboard"
      description="Approve brand reps, review category requests, and moderate the catalog."
      navItems={navItems}
      user={shell}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Pending Reps" value={String(pendingUsers)} />
          <StatCard label="Pending Categories" value={String(pendingReqs)} />
          <StatCard label="Pending Products" value={String(pendingProducts.length)} />
          <StatCard label="Total Products" value={counts.products.toLocaleString()} />
          <StatCard label="Total Brands" value={counts.brands.toLocaleString()} />
          <StatCard label="Total Categories" value={counts.categories.toLocaleString()} />
        </div>

        <Tabs defaultValue={pendingProducts.length > 0 ? "approvals" : "users"}>
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid sm:grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="approvals">
              Product Approvals
              {pendingProducts.length > 0 && (
                <Badge variant="warning" className="ml-2">{pendingProducts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          {/* USERS */}
          <TabsContent value="users">
            <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
              <CardContent className="p-0">
                {users.length === 0 ? (
                  <EmptyState title="No brand reps" description="No signups yet." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.brandName ?? "—"}</TableCell>
                          <TableCell><Badge variant={userStatusVariant[u.status]}>{u.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex flex-wrap justify-end gap-2">
                              {u.status === "PENDING" && (
                                <>
                                  <Button size="sm" onClick={() => userAction(u.id, "approve")}>Approve</Button>
                                  <Button size="sm" variant="outline" onClick={() => userAction(u.id, "reject")}>Reject</Button>
                                </>
                              )}
                              {u.status === "APPROVED" && (
                                <Button size="sm" variant="outline" className="text-rose-600" onClick={() => userAction(u.id, "suspend")}>Suspend</Button>
                              )}
                              {u.status === "BLOCKED" && (
                                <Button size="sm" variant="outline" onClick={() => userAction(u.id, "reactivate")}>Reactivate</Button>
                              )}
                              <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setDeleteUserId(u.id)}>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CATEGORIES */}
          <TabsContent value="categories">
            <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
              <CardContent className="p-0">
                {requests.length === 0 ? (
                  <EmptyState title="No category requests" description="Brand reps haven't requested categories yet." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.brandName ?? "—"}</TableCell>
                          <TableCell><Badge variant={reqStatusVariant[r.status]}>{r.status}</Badge></TableCell>
                          <TableCell>{formatDate(r.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              {r.status === "PENDING" && (
                                <>
                                  <Button size="sm" onClick={() => requestAction(r.id, "approve")}>Approve</Button>
                                  <Button size="sm" variant="outline" onClick={() => requestAction(r.id, "reject")}>Reject</Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRODUCT APPROVALS */}
          <TabsContent value="approvals">
            <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
              <CardContent className="p-0">
                {pendingProducts.length === 0 ? (
                  <EmptyState title="No products awaiting approval" description="New product submissions show up here for review." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Wholesale</TableHead>
                        <TableHead>Final (after tax)</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingProducts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.brandName ?? "—"}</TableCell>
                          <TableCell>{p.sku}</TableCell>
                          <TableCell>{formatCurrency(p.wholesalePrice ?? p.price)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(finalPriceOf(p))}</TableCell>
                          <TableCell>{p.submittedAt ? formatDate(p.submittedAt) : "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setViewing(p); setViewOpen(true); }}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === p.id}
                                onClick={() => openEdit(p.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                disabled={busyId === p.id}
                                onClick={() => setApproveItem(p)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-600"
                                disabled={busyId === p.id}
                                onClick={() => { setChangesId(p.id); setChangesNote(""); }}
                              >
                                Request changes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600"
                                disabled={busyId === p.id}
                                onClick={() => setRejectId(p.id)}
                              >
                                Reject
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
          </TabsContent>

          {/* PRODUCTS */}
          <TabsContent value="products">
            <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
              <CardContent className="p-0">
                {products.length === 0 ? (
                  <EmptyState title="No products" description="No products in the catalog." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Approval</TableHead>
                        <TableHead>Listing</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.brandName ?? "—"}</TableCell>
                          <TableCell>{p.sku}</TableCell>
                          <TableCell>{formatCurrency(p.price)}</TableCell>
                          <TableCell><Badge variant={approvalVariant[p.approvalStatus]}>{approvalLabel[p.approvalStatus]}</Badge></TableCell>
                          <TableCell><Badge variant={p.isPublished ? "success" : "secondary"}>{p.isPublished ? "Published" : "Draft"}</Badge></TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button size="sm" variant="outline" className="text-rose-600" onClick={() => deleteProduct(p.id)}>Delete</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Full pre-approval product review (read-only). */}
      <ProductView open={viewOpen} onOpenChange={setViewOpen} product={viewing} />

      {/* Admin product editor — edits any field (incl. price) before approval. */}
      <ProductForm
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        brandName=""
        categories={categories}
        product={editing}
        adminEndpoint={editId ? `/api/admin/products/${editId}` : undefined}
        taxDefaults={taxDefaults}
        onSaved={refreshPending}
      />

      {/* Approve confirmation — shows the final after-tax price being locked in. */}
      <ConfirmDialog
        open={Boolean(approveItem)}
        onOpenChange={(open) => !open && setApproveItem(null)}
        title="Approve and list this product?"
        description={
          approveItem
            ? `Wholesale ${formatCurrency(approveItem.wholesalePrice ?? approveItem.price)} + taxes → final price ${formatCurrency(finalPriceOf(approveItem))}. This after-tax price will be set on the product and it goes live.`
            : ""
        }
        confirmLabel="Approve at this price"
        onConfirm={() => {
          if (approveItem) reviewProduct(approveItem.id, "approve");
          setApproveItem(null);
        }}
      />

      {/* Delete brand rep confirmation — permanent. */}
      <ConfirmDialog
        open={Boolean(deleteUserId)}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        title="Delete this brand rep?"
        description="This permanently removes the account. They will lose portal access immediately. This can't be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteUserId) deleteUser(deleteUserId);
          setDeleteUserId(null);
        }}
      />

      {/* Reject confirmation. */}
      <ConfirmDialog
        open={Boolean(rejectId)}
        onOpenChange={(open) => !open && setRejectId(null)}
        title="Reject this product?"
        description="The brand rep will be notified it was rejected and can edit and resubmit it. It will not appear on the live store."
        confirmLabel="Reject"
        onConfirm={() => {
          if (rejectId) reviewProduct(rejectId, "reject");
          setRejectId(null);
        }}
      />

      {/* Request changes — send the product back to the brand with a note. */}
      <Dialog open={Boolean(changesId)} onOpenChange={(open) => !open && setChangesId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send back for changes?</DialogTitle>
            <DialogDescription>
              The product is returned to the brand so they can edit and resubmit it — no need to recreate it.
              It won&apos;t appear on the live store until it&apos;s approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="changes-note">What should the brand change?</Label>
            <Textarea
              id="changes-note"
              rows={4}
              value={changesNote}
              onChange={(e) => setChangesNote(e.target.value)}
              placeholder="e.g. Please add a clearer main image and fix the size chart units."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesId(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (changesId) reviewProduct(changesId, "request_changes", changesNote.trim() || undefined);
                setChangesId(null);
              }}
            >
              Send back for changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
