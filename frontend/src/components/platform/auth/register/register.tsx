"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import { signup } from "@/lib/integrate/auth";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-2xl border border-primary/10 bg-white px-4 py-3.5 text-sm text-primary outline-none transition placeholder:text-muted/60 focus:border-primary/30 focus:ring-4 focus:ring-primary/8";

type RegisterFormProps = {
  className?: string;
};

export function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralId = searchParams.get("ref")?.trim() || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketingPref, setMarketingPref] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await signup({
        email,
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        marketing_pref: marketingPref,
        referred_by_affiliate_id: referralId || undefined,
      });

      const params = new URLSearchParams({ registered: "1" });
      router.push(`/login?${params.toString()}`);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Unable to create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className={cn("rounded-3xl border border-primary/8 bg-white p-7 shadow-sm md:p-8", className)}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {referralId ? <AuthAlert variant="info">Referral link applied.</AuthAlert> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <input
            id="first-name"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            placeholder="First name"
            aria-label="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={fieldClass}
          />
          <input
            id="last-name"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            placeholder="Last name"
            aria-label="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={fieldClass}
          />
        </div>

        <input
          id="register-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />

        <div className="relative">
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Password (min. 8)"
            aria-label="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={cn(fieldClass, "pr-12")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            className="absolute inset-y-0 right-0 flex min-w-11 items-center justify-center px-3 text-primary/40 transition hover:text-primary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7-.5 1.2-1.2 2.3-2.1 3.2M6.1 6.1C4.2 7.4 2.7 9.1 1.8 11c1.7 3.9 6 7 11.2 7 1.3 0 2.5-.2 3.6-.5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <input
          id="register-confirm-password"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Confirm password"
          aria-label="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={fieldClass}
        />

        <label className="flex cursor-pointer items-center gap-3 text-sm text-muted">
          <input
            type="checkbox"
            name="marketingPref"
            checked={marketingPref}
            onChange={(event) => setMarketingPref(event.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary-light/20"
          />
          Email me product updates
        </label>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="mt-6 w-full justify-center"
      >
        {loading ? "Creating…" : "Create account"}
      </Button>

      <p className="mt-5 text-center text-sm text-muted">
        Have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
