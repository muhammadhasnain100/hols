"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon, Eye, EyeOff, Minus, Plus } from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AuthButton } from "@/components/platform/auth/AuthButton";
import { AuthField } from "@/components/platform/auth/AuthField";
import {
  authFieldClass,
  authFooterTextClass,
  authHelperTextClass,
  authIconButtonClass,
  authLabelClass,
  authLinkClass,
} from "@/components/platform/auth/auth-styles";
import { ApiRequestError } from "@/lib/integrate/client";
import { signup } from "@/lib/integrate/auth";
import { resolveAffiliateInviteCode } from "@/lib/integrate/provider/affiliate/referrals/api";
import { cn } from "@/lib/utils";

type RegisterFormProps = {
  className?: string;
};

function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase();
}

export function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlReferralCode = searchParams.get("ref")?.trim() || "";
  const referralIdParam = searchParams.get("affiliate_id")?.trim() || "";
  const lockedFromLink = Boolean(urlReferralCode || referralIdParam);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [marketingPref, setMarketingPref] = useState(false);
  const [showAffiliateCode, setShowAffiliateCode] = useState(lockedFromLink);
  const [affiliateCode, setAffiliateCode] = useState(normalizeInviteCode(urlReferralCode));
  const [referralId, setReferralId] = useState(referralIdParam);
  const [referralName, setReferralName] = useState("");
  const [referralLoading, setReferralLoading] = useState(Boolean(urlReferralCode && !referralIdParam));
  const [referralError, setReferralError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resolveRequestId = useRef(0);

  async function resolveCode(code: string, signal?: AbortSignal) {
    const normalized = normalizeInviteCode(code);
    if (!normalized) {
      setReferralId(referralIdParam);
      setReferralName("");
      setReferralError(null);
      setReferralLoading(false);
      return;
    }

    const requestId = ++resolveRequestId.current;
    setReferralLoading(true);
    setReferralError(null);

    try {
      const result = await resolveAffiliateInviteCode(normalized, signal);
      if (signal?.aborted || requestId !== resolveRequestId.current) return;
      setReferralId(result.affiliate_id);
      setReferralName([result.first_name, result.last_name].filter(Boolean).join(" "));
      setAffiliateCode(normalizeInviteCode(result.invite_code || normalized));
      setReferralError(null);
    } catch (err) {
      if (signal?.aborted || requestId !== resolveRequestId.current) return;
      setReferralId(referralIdParam);
      setReferralName("");
      setReferralError(err instanceof ApiRequestError ? err.message : "Invalid affiliate code.");
    } finally {
      if (!signal?.aborted && requestId === resolveRequestId.current) {
        setReferralLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!urlReferralCode || referralIdParam) return;
    const controller = new AbortController();
    void resolveCode(urlReferralCode, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only auto-resolve URL invite once
  }, [urlReferralCode, referralIdParam]);

  useEffect(() => {
    if (lockedFromLink) return;
    const normalized = normalizeInviteCode(affiliateCode);
    if (!normalized) {
      setReferralId("");
      setReferralName("");
      setReferralError(null);
      setReferralLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void resolveCode(normalized, controller.signal);
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce typed codes only
  }, [affiliateCode, lockedFromLink]);

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

    const typedCode = normalizeInviteCode(affiliateCode);
    if (typedCode && !referralId) {
      setError(referralError || "Enter a valid affiliate code, or clear the field to continue.");
      return;
    }

    if (referralLoading) {
      setError("Please wait while we verify the affiliate code.");
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
        <Icon icon={EyeOff} size={16} />
      ) : (
        <Icon icon={Eye} size={16} />
      )}
    </button>
  );

  return (
    <form className={cn("w-full", className)} onSubmit={handleSubmit}>
      <div className="grid gap-5">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

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
          placeholder="you@example.com"
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

        <div className="grid gap-3">
          {!lockedFromLink ? (
            <button
              type="button"
              onClick={() => {
                setShowAffiliateCode((open) => {
                  if (open) {
                    setAffiliateCode("");
                    setReferralId("");
                    setReferralName("");
                    setReferralError(null);
                    setReferralLoading(false);
                  }
                  return !open;
                });
              }}
              className={cn(
                "font-sans inline-flex w-fit items-center gap-2 text-sm font-medium text-primary/70 transition hover:text-primary",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border border-primary/20 text-xs",
                  showAffiliateCode ? "bg-primary text-white" : "bg-white text-primary/60",
                )}
              >
                {showAffiliateCode ? <Icon icon={Minus} size={12} /> : <Icon icon={Plus} size={12} />}
              </span>
              {showAffiliateCode ? "Remove affiliate code" : "Have an affiliate code?"}
            </button>
          ) : null}

          {showAffiliateCode || lockedFromLink ? (
            <div className="grid gap-2">
              {lockedFromLink && !urlReferralCode && referralIdParam ? (
                <AuthAlert variant="success">
                  Invite link applied{referralName ? ` — referred by ${referralName}` : ""}.
                </AuthAlert>
              ) : (
                <>
                  <label htmlFor="affiliate-code" className={authLabelClass}>
                    Affiliate code
                    {!lockedFromLink ? (
                      <span className="ml-1 font-normal text-primary/45">(optional)</span>
                    ) : null}
                  </label>

                  <input
                    id="affiliate-code"
                    name="affiliate-code"
                    type="text"
                    value={affiliateCode}
                    onChange={(event) =>
                      setAffiliateCode(normalizeInviteCode(event.target.value.replace(/\s+/g, "")))
                    }
                    placeholder="Enter code"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={lockedFromLink}
                    className={cn(
                      authFieldClass,
                      "px-4 font-mono tracking-[0.08em] uppercase",
                      lockedFromLink && "cursor-not-allowed bg-[#f7f9fc] text-primary/70",
                    )}
                  />

                  {referralLoading ? (
                    <AuthAlert variant="info">Checking affiliate code…</AuthAlert>
                  ) : null}
                  {referralError ? <AuthAlert variant="error">{referralError}</AuthAlert> : null}
                  {referralId && !referralLoading && !referralError ? (
                    <AuthAlert variant="success">
                      Affiliate code applied
                      {referralName ? ` — referred by ${referralName}` : ""}.
                    </AuthAlert>
                  ) : null}
                  {!lockedFromLink && !affiliateCode ? (
                    <p className={authHelperTextClass}>
                      If someone invited you, enter their code here.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>

        <label className={cn("flex cursor-pointer items-center gap-3", authHelperTextClass)}>
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

      <AuthButton type="submit" disabled={loading || referralLoading} className="mt-7">
        {loading ? "Creating…" : "Create account"}
      </AuthButton>

      <p className={cn("mt-6", authFooterTextClass)}>
        Already have an account?{" "}
        <Link href="/login" className={authLinkClass}>
          Log in
        </Link>
      </p>
    </form>
  );
}
