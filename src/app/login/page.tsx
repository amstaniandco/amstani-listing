import { AuthShell } from "@/components/shared/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Secure access for admins and approved brands"
      title="Welcome back to the portal"
      description="Sign in to manage approvals, products, categories, and analytics from one polished frontend workspace."
    >
      <LoginForm />
    </AuthShell>
  );
}
