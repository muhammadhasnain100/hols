import { Suspense } from "react";
import { AuthShell } from "@/components/platform/auth/AuthShell";
import { RegisterForm } from "@/components/platform/auth/register";

function RegisterFormFallback() {
  return (
    <div className="w-full">
      <div className="h-48 animate-pulse rounded-2xl bg-primary/5" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Sign up"
      title="Create account"
      subtitle="Join HOLS to access courses, tools, and your learning portal."
      contentWidth="md"
    >
      <Suspense fallback={<RegisterFormFallback />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
