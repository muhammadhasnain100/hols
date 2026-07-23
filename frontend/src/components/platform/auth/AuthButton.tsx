"use client";

import { cn } from "@/lib/utils";

type AuthButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

export function AuthButton({
  children,
  type = "button",
  disabled = false,
  className,
  onClick,
  variant = "primary",
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-6 text-sm font-medium tracking-[0.01em] transition",
        "disabled:pointer-events-none disabled:opacity-60",
        variant === "primary"
          ? "bg-[#DDE466] text-[#152744] hover:brightness-105"
          : "border border-primary/10 bg-white text-[#152744] hover:bg-[#f7f9fc]",
        className,
      )}
    >
      {children}
    </button>
  );
}
