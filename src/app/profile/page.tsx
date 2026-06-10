import { redirect } from "next/navigation";

import { DashboardShell, type NavItem } from "@/components/shared/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getShellUser } from "@/lib/auth/shell-user";

export default async function ProfilePage() {
  const ctx = await getShellUser();
  if (!ctx) redirect("/login");

  const isAdmin = ctx.session.role === "ADMIN";
  const navItems: NavItem[] = isAdmin
    ? [
        { label: "Dashboard", href: "/admin/dashboard", icon: "admin" },
        { label: "Shipping & Taxes", href: "/admin/taxes", icon: "taxes" },
        { label: "Profile", href: "/profile", icon: "profile" },
      ]
    : [
        { label: "Dashboard", href: "/brand/dashboard", icon: "dashboard" },
        { label: "Categories", href: "/brand/categories", icon: "categories" },
        { label: "Products", href: "/brand/products", icon: "products" },
        { label: "Profile", href: "/profile", icon: "profile" },
      ];

  return (
    <DashboardShell
      title="Profile"
      description="Your account details."
      navItems={navItems}
      user={ctx.shell}
    >
      <Card className="max-w-xl border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Detail label="Name" value={ctx.shell.name} />
          <Detail label="Email" value={ctx.shell.email} />
          <Detail label="Role" value={isAdmin ? "Admin" : "Brand representative"} />
          {!isAdmin ? <Detail label="Brand" value={ctx.shell.brandName ?? "—"} /> : null}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
