"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserRound, ShieldCheck, Mail, Phone, BadgeCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { portalSelectors, usePortalStore } from "@/store/portal-store";

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter a full name."),
  brandName: z.string().optional(),
  phoneNumber: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const hydrated = usePortalStore((state) => state.hydrated);
  const account = usePortalStore(portalSelectors.currentAccount);
  const updateProfile = usePortalStore((state) => state.updateProfile);
  const [ready, setReady] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: account?.fullName ?? "",
      brandName: account?.brandName ?? "",
      phoneNumber: account?.phoneNumber ?? "",
      avatar: account?.avatar ?? "",
    },
  });

  useEffect(() => {
    if (hydrated && !account) {
      router.replace("/login");
    }
  }, [account, hydrated, router]);

  useEffect(() => {
    if (account) {
      form.reset({
        fullName: account.fullName,
        brandName: account.brandName ?? "",
        phoneNumber: account.phoneNumber ?? "",
        avatar: account.avatar ?? "",
      });
      setReady(true);
    }
  }, [account, form]);

  const submit = form.handleSubmit((values) => {
    if (!account) return;

    updateProfile(account.id, {
      fullName: values.fullName,
      brandName: values.brandName || undefined,
      phoneNumber: values.phoneNumber || undefined,
      avatar: values.avatar || undefined,
    });
    toast.success("Profile updated.");
  });

  if (!hydrated || !account || !ready) {
    return null;
  }

  return (
    <DashboardShell
      title="Profile settings"
      description="Update your account details and branding information from a single page."
      navItems={[
        { label: "Dashboard", href: account.role === "admin" ? "/admin/dashboard" : "/brand/dashboard", icon: ShieldCheck },
        { label: "Profile", href: "/profile", icon: UserRound },
      ]}
    >
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Account" }, { label: "Profile settings" }]} />

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Account summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900">
                  {account.avatar ? <img src={account.avatar} alt={account.fullName} className="h-full w-full object-cover" /> : <span className="text-lg font-semibold">{account.fullName.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div>
                  <p className="text-lg font-semibold">{account.role === "brand" ? account.brandName : account.fullName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{account.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3 text-sm">
                <Detail icon={<BadgeCheck className="h-4 w-4" />} label="Role" value={account.role} />
                <Detail icon={<Mail className="h-4 w-4" />} label="Email" value={account.email} />
                <Detail icon={<Phone className="h-4 w-4" />} label="Phone" value={account.phoneNumber ?? "Not set"} />
                {account.role === "brand" ? <Detail icon={<ShieldCheck className="h-4 w-4" />} label="Status" value={<StatusBadge status={account.status ?? "pending"} />} /> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80">
            <CardHeader>
              <CardTitle>Edit profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" {...form.register("fullName")} />
                </div>
                {account.role === "brand" ? (
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand name</Label>
                    <Input id="brandName" {...form.register("brandName")} />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone number</Label>
                  <Input id="phoneNumber" {...form.register("phoneNumber")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" {...form.register("avatar")} />
                </div>
                <Button type="submit">Save changes</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-medium text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}
