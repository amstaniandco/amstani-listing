"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Icons are referenced by NAME (a plain string) so navItems can be passed from
// a Server Component to this Client Component — component refs aren't serializable.
export type NavIcon = "dashboard" | "products" | "categories" | "profile" | "admin" | "taxes";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
}

const ICONS: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  dashboard: ChartNoAxesCombined,
  products: Package,
  categories: Archive,
  profile: UserRound,
  admin: LayoutDashboard,
  taxes: Receipt,
};

export interface ShellUser {
  name: string;
  email: string;
  role: "ADMIN" | "BRAND_REP";
  brandName?: string | null;
}

interface DashboardShellProps {
  title: string;
  description: string;
  navItems: NavItem[];
  user: ShellUser;
  children: React.ReactNode;
}

function DashboardShell({ title, description, navItems, user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = user.role === "ADMIN";
  const displayName = isAdmin ? user.name : user.brandName ?? user.name;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.9))] text-slate-950 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.9),rgba(2,6,23,1))] dark:text-white"
      suppressHydrationWarning
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 lg:flex">
          <div className="flex h-20 items-center gap-3 px-6">
            <Image
              src="/Amstani.png"
              alt="Amstani"
              width={120}
              height={48}
              priority
              className="h-12 w-auto"
            />
          </div>
          <Separator />
          <nav className="flex flex-1 flex-col gap-1 p-4">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Signed in as</p>
              <p className="mt-2 text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
            <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[min(90vw,20rem)] p-0">
                    <SheetHeader className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                      <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>
                    <div className="flex h-full flex-col p-4">
                      {navItems.map((item) => {
                        const active = pathname === item.href;
                        const Icon = ICONS[item.icon];
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium",
                              active
                                ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="hidden items-center gap-3 lg:flex">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      {isAdmin ? "Admin" : "Brand"}
                    </p>
                    <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 gap-3 rounded-2xl px-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{initials(displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="hidden text-left sm:block">
                        <p className="text-sm font-medium">{displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{isAdmin ? "Admin" : "Brand rep"}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <UserRound className="mr-2 h-4 w-4" />
                      Profile settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white/80 px-6 py-5 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
                </div>
                <Badge variant={isAdmin ? "info" : "success"}>
                  {isAdmin ? "Admin workspace" : "Brand workspace"}
                </Badge>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export { DashboardShell };
