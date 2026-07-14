import { Suspense } from "react";
import { AuthShell } from "@/components/platform/auth/AuthShell";
import { RegisterForm } from "@/components/platform/auth/register";

function RegisterFormFallback() {
  return (
    <div className="rounded-3xl border border-primary/8 bg-white p-7 shadow-sm md:p-8">
      <div className="h-48 animate-pulse rounded-2xl bg-primary/5" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell eyebrow="Sign up" title="Create account" contentWidth="md">
      <Suspense fallback={<RegisterFormFallback />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
