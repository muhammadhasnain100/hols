"use client";

import { authAlertClass } from "@/components/platform/auth/auth-styles";
import { cn } from "@/lib/utils";

type AuthAlertProps = {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
};

const variants = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-[#8DC3E1]/50 bg-[#E8F4FA] text-primary",
};

export function AuthAlert({ variant = "error", children, className }: AuthAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border px-4 py-3",
        authAlertClass,
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
