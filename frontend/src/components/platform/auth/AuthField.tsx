"use client";

import type { ReactNode } from "react";
import { authFieldClass } from "@/components/platform/auth/auth-styles";
import { cn } from "@/lib/utils";

type AuthFieldIcon = "user" | "email" | "password";

type AuthFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  icon?: AuthFieldIcon;
  required?: boolean;
  trailing?: ReactNode;
};

function FieldIcon({ icon }: { icon: AuthFieldIcon }) {
  if (icon === "email") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 6h16v12H4V6Z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  if (icon === "password") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c1.5-3.5 4.5-5.5 7-5.5s5.5 2 7 5.5" />
    </svg>
  );
}

export function AuthField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  icon,
  required = false,
  trailing,
}: AuthFieldProps) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="font-sans text-sm font-medium text-primary">
        {label}
      </label>

      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-primary/35">
            <FieldIcon icon={icon} />
          </span>
        ) : null}

        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={cn(
            authFieldClass,
            icon ? "pl-11" : "px-4",
            trailing ? "pr-12" : "pr-4",
          )}
        />

        {trailing}
      </div>
    </div>
  );
}
