"use client";

import { useState } from "react";
import { AuthShell } from "@/components/platform/auth/AuthShell";
import { LoginForm } from "@/components/platform/auth/login/login";
import type { UserRole } from "@/lib/integrate/auth";
import { useRestoreSessionOnLogin } from "@/lib/integrate/auth/session";

type LoginAuthClientProps = {
  role?: UserRole;
  initialMessage?: string;
};

const loginCopy: Record<
  UserRole,
  { eyebrow: string; title: string; subtitle?: string }
> = {
  student: {
    eyebrow: "Sign in",
    title: "Welcome back",
  },
  admin: {
    eyebrow: "Admin portal",
    title: "Admin sign in",
    subtitle: "Sign in with your HOLS admin credentials.",
  },
  affiliate: {
    eyebrow: "Affiliate portal",
    title: "Affiliate sign in",
    subtitle: "Sign in with your HOLS affiliate credentials.",
  },
};

export function LoginAuthClient({
  role = "student",
  initialMessage,
}: LoginAuthClientProps) {
  const restoring = useRestoreSessionOnLogin();
  const [otpStep, setOtpStep] = useState(false);
  const copy = loginCopy[role];

  if (restoring) {
    return <div className="min-h-svh bg-transparent" aria-hidden />;
  }

  return (
    <AuthShell
      eyebrow={otpStep ? "Verification" : copy.eyebrow}
      title={otpStep ? "Enter your code" : copy.title}
      subtitle={
        otpStep
          ? "We sent a 6-digit verification code to your email."
          : copy.subtitle
      }
    >
      <LoginForm
        role={role}
        initialMessage={initialMessage}
        onOtpStepChange={setOtpStep}
      />
    </AuthShell>
  );
}
