"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { ProfilePageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import {
  affiliateDisplayName,
  affiliateInitials,
  affiliateProfileToForm,
  affiliateQuotaLabel,
  buildAffiliateProfilePayload,
  emptyAffiliateProfileForm,
  formatAffiliateAddress,
  formatAffiliatePercent,
  type ProfileFormState,
  useAffiliateProfile,
} from "@/components/platform/provider/affiliate/affiliateProfile";
import { ApiRequestError } from "@/lib/integrate/client";
import { updateAffiliateProfile, type AffiliateProfile } from "@/lib/integrate/provider/affiliate/profile/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";
import { cn } from "@/lib/utils";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function DashField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="dashboard-field-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="dashboard-field"
      />
    </div>
  );
}

function ProfileDetailRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="dashboard-row flex min-w-0 flex-col items-start gap-1 rounded-xl px-2.5 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-3.5 sm:py-3">
      <p className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-faint)]">{label}</p>
      <div className="font-sans min-w-0 w-full whitespace-pre-line break-words text-sm font-medium text-[color:var(--dash-text)] [overflow-wrap:anywhere] sm:w-auto sm:text-right">
        {value || "—"}
      </div>
    </div>
  );
}

const shortcutLinks = [
  {
    label: "Referrals",
    href: "/affiliate/referrals",
    category: "Growth",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Earnings",
    href: "/affiliate/earnings",
    category: "Billing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Dashboard",
    href: "/affiliate",
    category: "Home",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
] as const;

export function AffiliateProfilePage() {
  const { profile, refreshing, error, setError, applyProfile } = useAffiliateProfile();
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<ProfileFormState>(emptyAffiliateProfileForm);
  const [form, setForm] = useState<ProfileFormState>(emptyAffiliateProfileForm);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profile || mode === "edit") return;
    const timer = window.setTimeout(() => {
      const nextForm = affiliateProfileToForm(profile);
      setBaseline(nextForm);
      setForm(nextForm);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profile, mode]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const dirtyPayload = useMemo(
    () => buildAffiliateProfilePayload(form, baseline),
    [form, baseline],
  );
  const hasChanges = Object.keys(dirtyPayload).length > 0 || Boolean(profilePicFile);
  const avatarSrc = profilePicPreview ?? profile?.profile_pic;
  const fullName = affiliateDisplayName(profile);

  function startEdit() {
    if (!profile) return;
    const nextForm = affiliateProfileToForm(profile);
    setForm(nextForm);
    setBaseline(nextForm);
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setError(null);
    setSuccess(null);
    setMode("edit");
  }

  function cancelEdit() {
    setForm(baseline);
    setProfilePicFile(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setProfilePicPreview(null);
    setError(null);
    setSuccess(null);
    setMode("read");
  }

  function onPickPhoto(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setProfilePicFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setProfilePicPreview(url);
    } else {
      setProfilePicPreview(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasChanges) {
      setSuccess("No changes to save.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await updateAffiliateProfile(dirtyPayload, profilePicFile);
      applyProfile(data.profile as AffiliateProfile);
      const nextForm = affiliateProfileToForm(data.profile as AffiliateProfile);
      setBaseline(nextForm);
      setForm(nextForm);
      setProfilePicFile(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setProfilePicPreview(null);
      setSuccess("Profile saved.");
      setMode("read");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalShell
      role="affiliate"
      title="Profile"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={affiliateNav}
    >
      <div className="dashboard-screen profile-page min-w-0 overflow-x-hidden">
        <header className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </button>
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              {mode === "edit" ? (
                <>
                  <span className="sm:hidden">Edit</span>
                  <span className="hidden sm:inline">Edit profile</span>
                </>
              ) : (
                "Profile"
              )}
            </h1>
          </div>
          <WelcomeChip fallbackName="Affiliate" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {!profile && refreshing ? (
            <ProfilePageSkeleton />
          ) : mode === "read" ? (
            <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
                  <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/70 bg-white/40 font-sans text-sm font-bold tracking-[0.01em] text-[color:var(--dash-text)] shadow-[0_8px_20px_rgba(21,39,68,0.12)] sm:h-20 sm:w-20 sm:text-lg">
                        {avatarSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                        ) : (
                          affiliateInitials(profile)
                        )}
                      </span>
                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                          Your profile
                        </p>
                        <div className="mt-1.5 flex flex-col items-center gap-1.5 sm:mt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-2">
                          <span className="font-sans max-w-full break-words text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                            {fullName}
                          </span>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-brand-caption font-semibold",
                              profile?.email_verified
                                ? "bg-[#DDE466]/25 text-[color:var(--dash-accent)]"
                                : "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]",
                            )}
                          >
                            {profile?.email_verified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                        <p className="text-brand-body mt-1.5 break-all text-[color:var(--dash-muted)] sm:mt-2 sm:truncate sm:break-normal">
                          {profile?.email}
                        </p>
                        {profile?.created_at ? (
                          <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                            Partner since {formatDate(profile.created_at)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={startEdit}
                      disabled={!profile}
                      className="font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:min-h-10 sm:w-auto lg:shrink-0"
                    >
                      Edit profile
                    </button>
                  </div>
                </section>

                <section className="dashboard-surface rounded-2xl p-3.5 sm:p-5 md:p-6">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Account
                  </p>
                  <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                    Account details
                  </h2>
                  <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                    <ProfileDetailRow label="Email" value={profile?.email} />
                    <ProfileDetailRow label="Address" value={formatAffiliateAddress(profile?.address)} />
                    <ProfileDetailRow
                      label="Marketing"
                      value={profile?.marketing_pref ? "Subscribed" : "Off"}
                    />
                    <ProfileDetailRow label="Invite code" value={profile?.invite_code} />
                    <ProfileDetailRow
                      label={
                        <>
                          <span className="sm:hidden">Margin</span>
                          <span className="hidden sm:inline">Commission margin</span>
                        </>
                      }
                      value={formatAffiliatePercent(profile?.margin_percent)}
                    />
                    <ProfileDetailRow
                      label={
                        <>
                          <span className="sm:hidden">Quota</span>
                          <span className="hidden sm:inline">Invitation quota</span>
                        </>
                      }
                      value={affiliateQuotaLabel(profile)}
                    />
                  </div>
                  <p className="text-brand-caption mt-4 rounded-xl bg-[color:var(--dash-soft)] px-3.5 py-3 text-[color:var(--dash-faint)]">
                    <span className="sm:hidden">Code, margin, and quota are admin-managed.</span>
                    <span className="hidden sm:inline">
                      Invite code, margin, and quota are managed by admin.
                    </span>
                  </p>
                </section>
              </div>

              <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                <section className="dashboard-surface rounded-2xl p-3.5 sm:p-5 md:p-6">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Shortcuts
                  </p>
                  <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                    Partner tools
                  </h2>
                  <div className="mt-2.5 space-y-1 sm:mt-3">
                    {shortcutLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="dashboard-row group flex min-h-12 items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition sm:gap-3 sm:px-3 sm:py-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] transition group-hover:bg-[#DDE466]/15 group-hover:text-[color:var(--dash-accent)] sm:h-9 sm:w-9">
                          {link.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-brand-caption block text-[color:var(--dash-faint)]">
                            {link.category}
                          </span>
                          <span className="font-sans block truncate text-sm font-medium text-[color:var(--dash-text)]">
                            {link.label}
                          </span>
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5"
                          aria-hidden
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <>
              <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
                <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                      Account settings
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1 sm:mt-2">
                      <span className="font-sans text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                        Edit profile
                      </span>
                      <span className="mb-0.5 inline-flex rounded-full bg-[#DDE466]/25 px-2.5 py-0.5 text-brand-caption font-semibold text-[color:var(--dash-accent)]">
                        Editing
                      </span>
                    </div>
                    <p className="text-brand-body mt-1.5 text-sm text-[color:var(--dash-muted)] sm:mt-2 sm:text-base">
                      Update your name, address, photo, and email preferences.
                    </p>
                  </div>

                  <div className="hidden w-full grid-cols-2 gap-2 sm:grid sm:w-auto sm:flex-wrap sm:gap-2.5 lg:flex">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="affiliate-profile-edit-form"
                      disabled={saving || !hasChanges}
                      className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:px-5"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              </section>

              <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                <div className="order-2 flex min-w-0 flex-col gap-3 sm:gap-4 lg:order-1">
                  <section className="dashboard-surface rounded-2xl p-3.5 sm:p-5 md:p-6">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Profile photo
                    </p>
                    <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                      Avatar
                    </h2>
                    <div className="mt-3 flex flex-col items-center gap-3 sm:mt-4 sm:flex-row sm:items-center sm:gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] font-sans text-base font-bold text-[color:var(--dash-text)] sm:h-20 sm:w-20 sm:text-lg">
                        {avatarSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                        ) : (
                          affiliateInitials(profile)
                        )}
                      </span>
                      <div className="min-w-0 w-full flex-1 text-center sm:text-left">
                        <p className="text-brand-body break-all text-sm text-[color:var(--dash-muted)] sm:truncate sm:break-normal">
                          {profile?.email}
                        </p>
                        <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                          JPEG, PNG, or WebP up to 5MB
                        </p>
                        <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            onChange={(event) => onPickPhoto(event.target.files?.[0] ?? null)}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition sm:min-h-10 sm:w-auto"
                          >
                            Change photo
                          </button>
                          {profilePicFile ? (
                            <button
                              type="button"
                              onClick={() => {
                                onPickPhoto(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="text-brand-body inline-flex min-h-10 items-center justify-center text-sm font-medium text-[color:var(--dash-faint)] transition hover:text-[color:var(--dash-text)]"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="dashboard-surface order-1 min-w-0 rounded-2xl p-3.5 sm:p-5 md:p-6 lg:order-2">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Profile details
                  </p>
                  <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                    Personal information
                  </h2>

                  <form
                    id="affiliate-profile-edit-form"
                    className="mt-4 grid gap-3 sm:mt-5 sm:gap-4"
                    onSubmit={handleSubmit}
                  >
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <DashField
                        id="first_name"
                        label="First name"
                        value={form.first_name}
                        onChange={(value) => setForm((prev) => ({ ...prev, first_name: value }))}
                        autoComplete="given-name"
                        required
                      />
                      <DashField
                        id="last_name"
                        label="Last name"
                        value={form.last_name}
                        onChange={(value) => setForm((prev) => ({ ...prev, last_name: value }))}
                        autoComplete="family-name"
                        required
                      />
                    </div>

                    <DashField
                      id="line1"
                      label="Address line 1"
                      value={form.line1}
                      onChange={(value) => setForm((prev) => ({ ...prev, line1: value }))}
                      placeholder="Street address"
                      autoComplete="address-line1"
                    />
                    <DashField
                      id="line2"
                      label="Address line 2"
                      value={form.line2}
                      onChange={(value) => setForm((prev) => ({ ...prev, line2: value }))}
                      placeholder="Apt, suite, unit"
                      autoComplete="address-line2"
                    />

                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
                      <DashField
                        id="city"
                        label="City"
                        value={form.city}
                        onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
                        autoComplete="address-level2"
                      />
                      <DashField
                        id="state"
                        label="State"
                        value={form.state}
                        onChange={(value) => setForm((prev) => ({ ...prev, state: value }))}
                        autoComplete="address-level1"
                      />
                      <DashField
                        id="postal_code"
                        label="Postal code"
                        value={form.postal_code}
                        onChange={(value) => setForm((prev) => ({ ...prev, postal_code: value }))}
                        autoComplete="postal-code"
                      />
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
                      <input
                        type="checkbox"
                        checked={form.marketing_pref}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, marketing_pref: event.target.checked }))
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--dash-dim)] accent-[#DDE466]"
                      />
                      <span className="min-w-0">
                        <span className="font-sans block text-sm font-medium text-[color:var(--dash-text)]">
                          Email me product updates
                        </span>
                        <span className="text-brand-caption mt-0.5 block text-[color:var(--dash-faint)]">
                          Occasional news about the platform.
                        </span>
                      </span>
                    </label>

                    <div className="mt-1 flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving || !hasChanges}
                        className="font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:min-w-[10rem]"
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
