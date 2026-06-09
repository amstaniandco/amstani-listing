import { AuthShell } from "@/components/shared/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Brand registration request"
      title="Create a brand account request"
      description="Select your brand and submit a registration request. An admin reviews and approves accounts before sign-in."
    >
      <SignupForm />
    </AuthShell>
  );
}
