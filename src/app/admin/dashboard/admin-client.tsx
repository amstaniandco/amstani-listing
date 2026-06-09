"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DashboardShell, type NavItem, type ShellUser } from "@/components/shared/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";

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
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "admin" },
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
  initialUsers,
  initialRequests,
  initialProducts,
}: {
  shell: ShellUser;
  counts: { products: number; brands: number; categories: number };
  initialUsers: UserItem[];
  initialRequests: RequestItem[];
  initialProducts: ProductItem[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [requests, setRequests] = useState(initialRequests);
  const [products, setProducts] = useState(initialProducts);

  const pendingUsers = users.filter((u) => u.status === "PENDING").length;
  const pendingReqs = requests.filter((r) => r.status === "PENDING").length;

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

  return (
    <DashboardShell
      title="Admin dashboard"
      description="Approve brand reps, review category requests, and moderate the catalog."
      navItems={navItems}
      user={shell}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Pending Reps" value={String(pendingUsers)} />
          <StatCard label="Pending Categories" value={String(pendingReqs)} />
          <StatCard label="Total Products" value={counts.products.toLocaleString()} />
          <StatCard label="Total Brands" value={counts.brands.toLocaleString()} />
          <StatCard label="Total Categories" value={counts.categories.toLocaleString()} />
        </div>

        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
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
                            <div className="flex justify-end gap-2">
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
                        <TableHead>Status</TableHead>
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
    </DashboardShell>
  );
}
