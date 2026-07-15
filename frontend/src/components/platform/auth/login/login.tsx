"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  isOtpRequired,
  login,
  resendOtp,
  verifyOtp,
  type UserRole,
} from "@/lib/integrate/auth";
import { getPortalPath } from "@/lib/integrate/auth/routes";
import { saveAuthSession } from "@/lib/integrate/auth/storage";
import { cn } from "@/lib/utils";

const roles: { value: UserRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "admin", label: "Admin" },
  { value: "affiliate", label: "Affiliate" },
];

const fieldClass =
  "w-full rounded-2xl border border-primary/10 bg-white px-4 py-3.5 text-sm text-primary outline-none transition placeholder:text-muted/60 focus:border-primary/30 focus:ring-4 focus:ring-primary/8";

type LoginFormProps = {
  className?: string;
  initialMessage?: string;
};

export function LoginForm({ className, initialMessage }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(initialMessage ?? null);
  const [loading, setLoading] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  async function completeLogin(result: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    user_id: string;
    role: UserRole;
    profile: Record<string, unknown>;
  }) {
    saveAuthSession(result);
    router.push(getPortalPath(result.role));
    router.refresh();
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const result = await login({ email, password, role });

      if (isOtpRequired(result)) {
        setOtpToken(result.otp_token);
        setOtpMessage(result.message);
        setOtpStep(true);
        setOtpCode("");
        return;
      }

      await completeLogin(result);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await verifyOtp(otpToken, otpCode);
      await completeLogin(result);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Invalid verification code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError(null);
    setResendLoading(true);

    try {
      const result = await resendOtp(otpToken);
      setOtpToken(result.otp_token);
      setOtpMessage(result.message);
      setInfo("Code sent.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not resend code.");
    } finally {
      setResendLoading(false);
    }
  }

  if (otpStep) {
    return (
      <form
        className={cn("rounded-3xl border border-primary/8 bg-white p-7 shadow-sm md:p-8", className)}
        onSubmit={handleOtpSubmit}
      >
        <h3 className="font-sans text-lg font-semibold text-primary">Enter code</h3>
        <p className="mt-1 text-sm text-muted">{otpMessage || "Check your email for a 6-digit code."}</p>

        <div className="mt-6 grid gap-4">
          {info ? <AuthAlert variant="info">{info}</AuthAlert> : null}
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            pattern="\d{6}"
            placeholder="000000"
            aria-label="Verification code"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className={cn(fieldClass, "text-center text-lg font-semibold tracking-[0.4em]")}
          />
        </div>

        <div className="mt-6 grid gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || otpCode.length !== 6}
            className="w-full justify-center"
          >
            {loading ? "Verifying…" : "Verify"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setOtpStep(false);
                setOtpCode("");
                setError(null);
                setInfo(null);
              }}
              className="font-medium text-primary/60 transition hover:text-primary"
            >
              Back
            </button>
            <button
              type="button"
              disabled={resendLoading}
              onClick={handleResendOtp}
              className="font-medium text-primary transition hover:text-primary/70 disabled:opacity-60"
            >
              {resendLoading ? "Sending…" : "Resend"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form
      className={cn("rounded-3xl border border-primary/8 bg-white p-7 shadow-sm md:p-8", className)}
      onSubmit={handleLoginSubmit}
    >
      <div className="grid gap-5">
        {info ? <AuthAlert variant="success">{info}</AuthAlert> : null}
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        <div
          className="grid grid-cols-3 gap-1 rounded-2xl bg-primary/[0.04] p-1"
          role="radiogroup"
          aria-label="Account type"
        >
          {roles.map((option) => {
            const selected = role === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRole(option.value)}
                className={cn(
                  "rounded-xl py-2.5 text-sm font-medium transition",
                  selected
                    ? "bg-primary text-white shadow-sm"
                    : "text-primary/55 hover:text-primary",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <input
          id="login-email"
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
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Password"
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
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="mt-6 w-full justify-center"
      >
        {loading ? "Signing in…" : "Log in"}
      </Button>

      <p className="mt-5 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
