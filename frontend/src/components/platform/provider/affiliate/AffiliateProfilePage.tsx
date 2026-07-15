"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { Button } from "@/components/ui/Button";
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
import { inputClassName } from "@/lib/form-styles";

function ReadRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-black/[0.05] py-3 last:border-b-0 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-[13px] text-primary/45">{label}</dt>
      <dd className="whitespace-pre-line text-[13px] font-medium text-primary">{value || "-"}</dd>
    </div>
  );
}

export function AffiliateProfilePage() {
  const { profile, refreshing, error, setError, applyProfile } = useAffiliateProfile();
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<ProfileFormState>(
    profile ? affiliateProfileToForm(profile) : emptyAffiliateProfileForm(),
  );
  const [form, setForm] = useState<ProfileFormState>(baseline);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

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
      title="Affiliate Profile"
      subtitle="Manage your visible account details."
      nav={affiliateNav}
    >
      <div className="mx-auto w-full max-w-2xl">
        {error ? (
          <div className="mb-4">
            <AuthAlert variant="error">{error}</AuthAlert>
          </div>
        ) : null}
        {success ? (
          <div className="mb-4">
            <AuthAlert variant="success">{success}</AuthAlert>
          </div>
        ) : null}

        {refreshing && !profile ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          </div>
        ) : mode === "read" ? (
          <section className="rounded-2xl border border-black/[0.06] bg-white p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/[0.06] text-sm font-semibold text-primary">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    affiliateInitials(profile)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-primary">
                    {affiliateDisplayName(profile)}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-primary/45">{profile?.email}</p>
                  {profile?.created_at ? (
                    <p className="mt-1 text-[11px] text-primary/35">Since {formatDate(profile.created_at)}</p>
                  ) : null}
                </div>
              </div>
              <Button type="button" variant="primary" size="md" onClick={startEdit} disabled={!profile}>
                Edit
              </Button>
            </div>

            <dl className="mt-7">
              <ReadRow label="Email" value={profile?.email} />
              <ReadRow label="Verified" value={profile?.email_verified ? "Yes" : "No"} />
              <ReadRow label="Address" value={formatAffiliateAddress(profile?.address)} />
              <ReadRow label="Updates" value={profile?.marketing_pref ? "Subscribed" : "Off"} />
              <ReadRow label="Invite code" value={profile?.invite_code} />
              <ReadRow label="Margin" value={formatAffiliatePercent(profile?.margin_percent)} />
              <ReadRow label="Quota" value={affiliateQuotaLabel(profile)} />
            </dl>

            <p className="mt-5 rounded-xl border border-black/[0.06] bg-[#F5F7FA] px-4 py-3 text-[13px] text-primary/50">
              Invite code, commission margin, invitation quota, and student count are controlled by admin.
            </p>
          </section>
        ) : (
          <form className="rounded-2xl border border-black/[0.06] bg-white p-6 md:p-7" onSubmit={handleSubmit}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-primary">Edit profile</h2>
                <p className="mt-1 text-[13px] text-primary/45">Update your personal details and profile photo.</p>
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-[13px] font-medium text-primary/45 transition hover:text-primary"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <label className="relative shrink-0 cursor-pointer">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/[0.06] text-sm font-semibold text-primary">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    affiliateInitials(profile)
                  )}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => onPickPhoto(event.target.files?.[0] ?? null)}
                />
              </label>
              <div>
                <p className="text-sm font-medium text-primary">Profile photo</p>
                <p className="mt-1 text-[12px] text-primary/45">PNG, JPG, or WebP up to 5MB.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-primary/65">First name</span>
                <input
                  className={inputClassName}
                  value={form.first_name}
                  onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-primary/65">Last name</span>
                <input
                  className={inputClassName}
                  value={form.last_name}
                  onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-primary/65">Address line 1</span>
                <input
                  className={inputClassName}
                  value={form.line1}
                  onChange={(event) => setForm((current) => ({ ...current, line1: event.target.value }))}
                  placeholder="Street address"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-primary/65">Address line 2</span>
                <input
                  className={inputClassName}
                  value={form.line2}
                  onChange={(event) => setForm((current) => ({ ...current, line2: event.target.value }))}
                  placeholder="Apt, suite, unit"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-primary/65">City</span>
                  <input
                    className={inputClassName}
                    value={form.city}
                    onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-primary/65">State</span>
                  <input
                    className={inputClassName}
                    value={form.state}
                    onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-primary/65">Postal code</span>
                  <input
                    className={inputClassName}
                    value={form.postal_code}
                    onChange={(event) => setForm((current) => ({ ...current, postal_code: event.target.value }))}
                  />
                </label>
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-xl border border-black/[0.06] bg-[#F5F7FA] px-4 py-3">
              <input
                type="checkbox"
                checked={form.marketing_pref}
                onChange={(event) => setForm((current) => ({ ...current, marketing_pref: event.target.checked }))}
                className="h-4 w-4 rounded border-primary/20 text-primary"
              />
              <span className="text-sm text-primary/70">Receive account and product updates</span>
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" size="md" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={saving || !hasChanges}>
                {saving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
