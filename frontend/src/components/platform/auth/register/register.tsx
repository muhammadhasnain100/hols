"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AuthField } from "@/components/platform/auth/AuthField";
import { authIconButtonClass } from "@/components/platform/auth/auth-styles";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import { signup } from "@/lib/integrate/auth";
import { resolveAffiliateInviteCode } from "@/lib/integrate/provider/affiliate/referrals/api";
import { cn } from "@/lib/utils";

type RegisterFormProps = {
  className?: string;
};

export function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref")?.trim() || "";
  const referralIdParam = searchParams.get("affiliate_id")?.trim() || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketingPref, setMarketingPref] = useState(false);
  const [referralId, setReferralId] = useState(referralIdParam);
  const [referralName, setReferralName] = useState("");
  const [referralLoading, setReferralLoading] = useState(Boolean(referralCode && !referralIdParam));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!referralCode || referralIdParam) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      async function resolveReferral() {
        setReferralLoading(true);
        try {
          const result = await resolveAffiliateInviteCode(referralCode, controller.signal);
          if (controller.signal.aborted) return;
          setReferralId(result.affiliate_id);
          setReferralName([result.first_name, result.last_name].filter(Boolean).join(" "));
        } catch (err) {
          if (controller.signal.aborted) return;
          setError(err instanceof ApiRequestError ? err.message : "Invalid referral link.");
        } finally {
          if (!controller.signal.aborted) setReferralLoading(false);
        }
      }

      void resolveReferral();
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [referralCode, referralIdParam]);

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

    if (referralCode && !referralId) {
      setError("Referral link is not ready. Please wait or use a valid invite link.");
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

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((open) => !open)}
      className={authIconButtonClass}
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
  );

  return (
    <form className={cn("w-full", className)} onSubmit={handleSubmit}>
      <div className="grid gap-5">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {referralLoading ? <AuthAlert variant="info">Checking referral link...</AuthAlert> : null}
        {referralId && !referralLoading ? (
          <AuthAlert variant="info">
            Referral link applied{referralName ? ` from ${referralName}` : ""}.
          </AuthAlert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            id="first-name"
            label="First name"
            value={firstName}
            onChange={setFirstName}
            placeholder="First name"
            autoComplete="given-name"
            icon="user"
            required
          />
          <AuthField
            id="last-name"
            label="Last name"
            value={lastName}
            onChange={setLastName}
            placeholder="Last name"
            autoComplete="family-name"
            icon="user"
            required
          />
        </div>

        <AuthField
          id="register-email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="@example.com"
          autoComplete="email"
          icon="email"
          required
        />

        <AuthField
          id="register-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          icon="password"
          required
          trailing={passwordToggle}
        />

        <AuthField
          id="register-confirm-password"
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter password"
          autoComplete="new-password"
          icon="password"
          required
          trailing={passwordToggle}
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
        disabled={loading || referralLoading}
        className="mt-7 w-full justify-center"
      >
        {loading ? "Creating…" : "Create account"}
      </Button>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
