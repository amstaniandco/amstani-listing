"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoCredentials } from "@/mock/data";
import { usePortalStore } from "@/store/portal-store";
import type { LoginInput } from "@/types/portal";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["admin", "brand"]),
  rememberMe: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const login = usePortalStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: demoCredentials.brand.email,
      password: demoCredentials.brand.password,
      role: "brand",
      rememberMe: true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    const result = login(values as LoginInput);
    setSubmitting(false);

    if (!result.ok) {
      form.setError("root", { message: result.message });
      toast.error(result.message);
      return;
    }

    toast.success(`Welcome back, ${result.account.role === "admin" ? result.account.fullName : result.account.brandName ?? result.account.fullName}.`);
    router.push(result.account.role === "admin" ? "/admin/dashboard" : "/brand/dashboard");
  });

  return (
    <Card className="border-slate-200/80 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.35)] dark:border-slate-800">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Use the seeded admin or approved brand credentials to access the portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <Tabs value={form.watch("role")} onValueChange={(value) => form.setValue("role", value as LoginValues["role"], { shouldValidate: true })}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="brand">Brand</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@company.com" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-rose-500">{form.formState.errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...form.register("password")} className="pr-12" />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-950 dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password ? <p className="text-sm text-rose-500">{form.formState.errors.password.message}</p> : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Checkbox checked={form.watch("rememberMe")} onCheckedChange={(checked) => form.setValue("rememberMe", Boolean(checked))} />
              Remember me
            </label>
            <Link href="/signup" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Create brand account</Link>
          </div>

          {form.formState.errors.root ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">{form.formState.errors.root.message}</div> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
          <p className="font-medium text-slate-950 dark:text-white">Demo credentials</p>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Admin: {demoCredentials.admin.email}</p>
          <p className="text-slate-600 dark:text-slate-400">Brand: {demoCredentials.brand.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { LoginForm };
