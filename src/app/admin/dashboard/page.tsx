"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleSlash, Eye, Package, Search, Shield, Store, Users } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { portalSelectors, usePortalStore } from "@/store/portal-store";
import { useRoleGuard } from "@/hooks/use-role-guard";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Shield },
  { label: "Profile", href: "/profile", icon: Users },
];

const pageSize = 6;

export default function AdminDashboardPage() {
  const { ready } = useRoleGuard("admin");
  const account = usePortalStore(portalSelectors.currentAccount);
  const accounts = usePortalStore((state) => state.accounts);
  const categories = usePortalStore((state) => state.categories);
  const products = usePortalStore((state) => state.products);
  const activity = usePortalStore((state) => state.activity);
  const approveBrand = usePortalStore((state) => state.approveBrand);
  const declineBrand = usePortalStore((state) => state.declineBrand);
  const banBrand = usePortalStore((state) => state.banBrand);
  const unbanBrand = usePortalStore((state) => state.unbanBrand);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const brands = useMemo(
    () => accounts.filter((item) => item.role === "brand"),
    [accounts],
  );
  const pendingRequests = brands.filter((item) => item.status === "pending");
  const totalBrands = brands.length;
  const approvedBrands = brands.filter((item) => item.status === "approved").length;
  const bannedBrands = brands.filter((item) => item.status === "banned").length;
  const totalCategories = categories.length;
  const totalProducts = products.length;

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const matchesSearch =
        `${brand.brandName} ${brand.fullName} ${brand.email}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || brand.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / pageSize));
  const currentPageBrands = filteredBrands.slice((page - 1) * pageSize, page * pageSize);
  const selectedBrand = brands.find((brand) => brand.id === selectedBrandId) ?? null;
  const selectedBrandProducts = products.filter((product) => product.brandId === selectedBrand?.id);
  const selectedBrandCategories = categories.filter((category) => category.brandId === selectedBrand?.id);

  if (!ready || !account) {
    return null;
  }

  return (
    <DashboardShell
      title="Admin dashboard"
      description="Approve registrations, moderate brands, and monitor the catalog from one control surface."
      navItems={navItems}
    >
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Admin" }, { label: "Dashboard" }]} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Total Brands" value={String(totalBrands)} icon={<Store className="h-5 w-5" />} />
          <StatCard label="Pending Requests" value={String(pendingRequests.length)} icon={<CircleSlash className="h-5 w-5" />} />
          <StatCard label="Approved Brands" value={String(approvedBrands)} icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard label="Banned Brands" value={String(bannedBrands)} icon={<Shield className="h-5 w-5" />} />
          <StatCard label="Total Products" value={String(totalProducts)} icon={<Package className="h-5 w-5" />} />
          <StatCard label="Total Categories" value={String(totalCategories)} icon={<Users className="h-5 w-5" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Pending brand requests</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">Review submitted registrations before activation.</p>
              </div>
              <Badge variant="warning">{pendingRequests.length} waiting</Badge>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <EmptyState title="No pending requests" description="Brand requests are caught up right now." />
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((brand) => (
                    <div key={brand.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">{brand.brandName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{brand.email}</p>
                        <p className="text-xs text-slate-400">Joined {formatDate(brand.joinedAt ?? new Date().toISOString())}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => { approveBrand(brand.id); toast.success(`${brand.brandName} approved.`); }}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { declineBrand(brand.id); toast(`Declined ${brand.brandName}.`); }}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">Recent platform events from the mock backend.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">{item.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                    </div>
                    <Badge variant={item.tone}>{item.tone}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Brands table</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">Search, filter, and moderate all brands in one place.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search brands" className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.brandName}</TableCell>
                    <TableCell>{brand.email}</TableCell>
                    <TableCell><StatusBadge status={brand.status ?? "pending"} /></TableCell>
                    <TableCell>{categories.filter((category) => category.brandId === brand.id).length}</TableCell>
                    <TableCell>{products.filter((product) => product.brandId === brand.id).length}</TableCell>
                    <TableCell>{formatDate(brand.joinedAt ?? new Date().toISOString())}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {brand.status === "approved" ? (
                          <Button size="sm" variant="outline" onClick={() => { banBrand(brand.id); toast.warning(`${brand.brandName} banned.`); }}>Ban</Button>
                        ) : brand.status === "banned" ? (
                          <Button size="sm" variant="outline" onClick={() => { unbanBrand(brand.id); toast.success(`${brand.brandName} unbanned.`); }}>Unban</Button>
                        ) : null}
                        <Button size="sm" variant="outline" onClick={() => setSelectedBrandId(brand.id)}><Eye className="mr-2 h-4 w-4" />View Brand</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedBrand)} onOpenChange={(open) => !open && setSelectedBrandId(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedBrand?.brandName}</DialogTitle>
            <DialogDescription>{selectedBrand?.email}</DialogDescription>
          </DialogHeader>
          {selectedBrand ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base">Brand details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  <p>Status: <StatusBadge status={selectedBrand.status ?? "pending"} /></p>
                  <p>Phone: {selectedBrand.phoneNumber}</p>
                  <p>Joined: {formatDate(selectedBrand.joinedAt ?? new Date().toISOString())}</p>
                  <p>Categories: {selectedBrandCategories.length}</p>
                  <p>Products: {selectedBrandProducts.length}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base">Brand products</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedBrandProducts.length === 0 ? (
                    <EmptyState title="No products yet" description="This brand has not added products." />
                  ) : (
                    selectedBrandProducts.map((product) => (
                      <div key={product.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                        <p className="font-medium text-slate-950 dark:text-white">{product.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{product.sku}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
