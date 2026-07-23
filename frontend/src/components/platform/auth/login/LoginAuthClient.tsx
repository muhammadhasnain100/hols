"use client";

import { useState } from "react";
import { AuthShell } from "@/components/platform/auth/AuthShell";
import { LoginForm } from "@/components/platform/auth/login/login";

type LoginAuthClientProps = {
  initialMessage?: string;
};

export function LoginAuthClient({ initialMessage }: LoginAuthClientProps) {
  const [otpStep, setOtpStep] = useState(false);

  return (
    <AuthShell
      eyebrow={otpStep ? "Verification" : "Sign in"}
      title={otpStep ? "Enter your code" : "Welcome back"}
      subtitle={
        otpStep
          ? "We sent a 6-digit verification code to your email."
          : undefined
      }
    >
      <LoginForm initialMessage={initialMessage} onOtpStepChange={setOtpStep} />
    </AuthShell>
  );
}
