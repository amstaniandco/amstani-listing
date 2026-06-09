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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortalStore } from "@/store/portal-store";
import type { SignupInput } from "@/types/portal";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
    brandName: z.string().min(2, "Enter a brand name."),
    phoneNumber: z.string().min(7, "Enter a valid phone number."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const signupBrand = usePortalStore((state) => state.signupBrand);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      brandName: "",
      phoneNumber: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitting(true);
    const payload: SignupInput = values;
    const result = signupBrand(payload);
    setSubmitting(false);

    if (!result.ok) {
      form.setError("root", { message: result.message });
      toast.error(result.message);
      return;
    }

    toast.success("Brand request submitted. An admin review is now pending.");
    router.push("/login");
  });

  return (
    <Card className="border-slate-200/80 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.35)] dark:border-slate-800">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Create brand account</CardTitle>
        <CardDescription>Brand registration is request-based. An admin must approve the account before login.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="Mia Carter" {...form.register("fullName")} />
              {form.formState.errors.fullName ? <p className="text-sm text-rose-500">{form.formState.errors.fullName.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand name</Label>
              <Input id="brandName" placeholder="Northstar Wear" {...form.register("brandName")} />
              {form.formState.errors.brandName ? <p className="text-sm text-rose-500">{form.formState.errors.brandName.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="brand@company.com" {...form.register("email")} />
              {form.formState.errors.email ? <p className="text-sm text-rose-500">{form.formState.errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input id="phoneNumber" placeholder="+1 415 555 0148" {...form.register("phoneNumber")} />
              {form.formState.errors.phoneNumber ? <p className="text-sm text-rose-500">{form.formState.errors.phoneNumber.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...form.register("confirmPassword")} className="pr-12" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-950 dark:hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword ? <p className="text-sm text-rose-500">{form.formState.errors.confirmPassword.message}</p> : null}
            </div>
          </div>

          {form.formState.errors.root ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">{form.formState.errors.root.message}</div> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit brand request
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export { SignupForm };
