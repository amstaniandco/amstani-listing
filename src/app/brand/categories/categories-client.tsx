"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell, type NavItem, type ShellUser } from "@/components/shared/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

interface CategoryOption {
  id: string;
  name: string;
}
interface RequestItem {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/brand/dashboard", icon: "dashboard" },
  { label: "Categories", href: "/brand/categories", icon: "categories" },
  { label: "Products", href: "/brand/products", icon: "products" },
];

const statusVariant: Record<RequestItem["status"], "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export function BrandCategoriesClient({
  shell,
  categories,
  initialRequests,
}: {
  shell: ShellUser;
  categories: CategoryOption[];
  initialRequests: RequestItem[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  async function submitRequest() {
    const name = newName.trim();
    if (name.length < 2) {
      toast.error("Enter a category name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.message ?? "Request failed.");
        return;
      }
      toast.success(data.message ?? "Request submitted.");
      setNewName("");
      // refresh own requests
      const list = await fetch("/api/categories/requests");
      const ld = await list.json();
      if (ld.ok) {
        setRequests(
          ld.requests.map((r: RequestItem) => ({
            id: r.id, name: r.name, status: r.status, createdAt: r.createdAt,
          })),
        );
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell
      title="Categories"
      description="Browse available categories and request new ones for admin approval."
      navItems={navItems}
      user={shell}
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Available categories</CardTitle>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full sm:w-56" />
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState title="No categories" description="No categories match your search." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {filtered.map((c) => (
                  <Badge key={c.id} variant="outline">{c.name}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader>
            <CardTitle>Request a new category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New category name"
                onKeyDown={(e) => e.key === "Enter" && submitRequest()}
              />
              <Button onClick={submitRequest} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Your requests</p>
              {requests.length === 0 ? (
                <p className="text-sm text-slate-500">No requests yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell><Badge variant={statusVariant[r.status]}>{r.status}</Badge></TableCell>
                        <TableCell>{formatDate(r.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
