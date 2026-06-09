import { AuthShell } from "@/components/shared/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Brand registration request"
      title="Create a brand account request"
      description="Only brands can sign up here. Admin access is seeded from mock data and managed internally."
    >
      <SignupForm />
    </AuthShell>
  );
}
