"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Command, Menu, Moon, PanelLeft, Search, Shield, Sun, LogOut, UserRound } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { CommandMenu } from "@/components/shared/command-menu";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { usePortalStore, portalSelectors } from "@/store/portal-store";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { PortalAccount } from "@/types/portal";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardShellProps {
  title: string;
  description: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

function DashboardShell({ title, description, navItems, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const currentAccount = usePortalStore(portalSelectors.currentAccount);
  const notifications = usePortalStore((state) => state.notifications);
  const unreadCount = notifications.filter((item) => !item.read).length;
  const logout = usePortalStore((state) => state.logout);
  const markNotificationRead = usePortalStore((state) => state.markNotificationRead);
  const commandActions = useMemo(
    () =>
      navItems.map((item) => ({
        label: item.label,
        description: `Open ${item.label.toLowerCase()} page`,
        href: item.href,
      })),
    [navItems],
  );

  if (!currentAccount) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.9))] text-slate-950 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.9),rgba(2,6,23,1))] dark:text-white">
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} actions={commandActions} />
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 lg:flex">
          <div className="flex h-20 items-center gap-3 px-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Amstani</p>
              <p className="text-lg font-semibold">Portal</p>
            </div>
          </div>
          <Separator />
          <nav className="flex flex-1 flex-col gap-1 p-4">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
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
              <p className="mt-2 text-sm font-semibold">{currentAccount.role === "brand" ? currentAccount.brandName : currentAccount.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentAccount.email}</p>
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
                        const Icon = item.icon;
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
                  <Button variant="outline" size="icon" onClick={() => setCommandOpen(true)}>
                    <Command className="h-4 w-4" />
                  </Button>
                  <div>
                    <Breadcrumbs
                      items={[
                        { label: currentAccount.role === "admin" ? "Admin" : "Brand" },
                        { label: title },
                      ]}
                    />
                    <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
                <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setCommandOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 ? (
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
                      ) : null}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[22rem]">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="px-3 py-6 text-sm text-slate-500">No notifications.</div>
                    ) : (
                      notifications.slice(0, 6).map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          className="flex flex-col items-start gap-1.5"
                          onSelect={() => markNotificationRead(item.id)}
                        >
                          <div className="flex w-full items-center justify-between gap-2">
                            <span className="font-medium">{item.title}</span>
                            {!item.read ? <Badge variant="warning">New</Badge> : null}
                          </div>
                          <p className="text-left text-xs text-slate-500 dark:text-slate-400">{item.message}</p>
                          <span className="text-[11px] text-slate-400">{formatRelativeTime(item.time)}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 gap-3 rounded-2xl px-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentAccount.avatar} alt={currentAccount.fullName} />
                        <AvatarFallback>{initials(currentAccount)}</AvatarFallback>
                      </Avatar>
                      <div className="hidden text-left sm:block">
                        <p className="text-sm font-medium">{currentAccount.role === "brand" ? currentAccount.brandName : currentAccount.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentAccount.role}</p>
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
                    <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}> 
                      {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                      Toggle theme
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-rose-600 focus:text-rose-600"
                      onClick={() => {
                        logout();
                        router.push("/login");
                      }}
                    >
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
                <Badge variant={currentAccount.role === "admin" ? "info" : "success"}>
                  {currentAccount.role === "admin" ? "Admin workspace" : "Brand workspace"}
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

function initials(account: PortalAccount) {
  const source = account.role === "brand" ? account.brandName ?? account.fullName : account.fullName;
  return source
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export { DashboardShell };
