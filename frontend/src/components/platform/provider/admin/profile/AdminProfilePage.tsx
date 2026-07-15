"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import { updateStoredProfile } from "@/lib/integrate/auth/storage";
import {
  getCachedAdminProfile,
  getAdminProfile,
  updateAdminProfile,
  type AdminProfile,
} from "@/lib/integrate/provider/admin/profile/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";

const fieldClass =
  "w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm text-primary outline-none transition placeholder:text-primary/35 focus:border-primary/30 focus:ring-4 focus:ring-primary/5";

type FormState = {
  first_name: string;
  last_name: string;
  marketing_pref: boolean;
};

function emptyForm(): FormState {
  return {
    first_name: "",
    last_name: "",
    marketing_pref: false,
  };
}

function profileToForm(profile: AdminProfile): FormState {
  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    marketing_pref: Boolean(profile.marketing_pref),
  };
}

function initials(profile: AdminProfile | null) {
  const first = profile?.first_name?.[0] ?? "";
  const last = profile?.last_name?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "A";
}

function ReadRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-black/[0.05] py-3 last:border-b-0 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-[13px] text-primary/45">{label}</dt>
      <dd className="text-[13px] font-medium text-primary">{value || "-"}</dd>
    </div>
  );
}

export function AdminProfilePage() {
  const cachedProfile = (getCachedAdminProfile()?.profile as AdminProfile | undefined) ?? null;
  const cachedForm = cachedProfile ? profileToForm(cachedProfile) : emptyForm();
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [loading, setLoading] = useState(!cachedProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(cachedProfile);
  const [baseline, setBaseline] = useState<FormState>(cachedForm);
  const [form, setForm] = useState<FormState>(cachedForm);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const applyProfile = useCallback((nextProfile: AdminProfile) => {
    const nextForm = profileToForm(nextProfile);
    setProfile(nextProfile);
    setBaseline(nextForm);
    setForm(nextForm);
    updateStoredProfile(nextProfile as unknown as Record<string, unknown>);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      async function load() {
        if (getCachedAdminProfile()) {
          setLoading(false);
        } else {
          setLoading(true);
        }
        setError(null);

        try {
          const data = await getAdminProfile();
          applyProfile(data.profile as AdminProfile);
        } catch (err) {
          setError(err instanceof ApiRequestError ? err.message : "Failed to load profile.");
        } finally {
          setLoading(false);
        }
      }

      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [applyProfile]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const hasChanges =
    form.first_name.trim() !== baseline.first_name.trim() ||
    form.last_name.trim() !== baseline.last_name.trim() ||
    form.marketing_pref !== baseline.marketing_pref ||
    Boolean(profilePicFile);

  function startEdit() {
    if (!profile) return;
    const nextForm = profileToForm(profile);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasChanges) {
      setSuccess("No changes to save.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await updateAdminProfile(
        {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          marketing_pref: form.marketing_pref,
        },
        profilePicFile,
      );
      const nextProfile = data.profile as AdminProfile;
      applyProfile(nextProfile);
      setProfilePicFile(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setProfilePicPreview(null);
      setSuccess("Saved.");
      setMode("read");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalShell
      role="admin"
      title="Admin Profile"
      subtitle="GET/PUT /api/auth/profile for your admin account"
      nav={adminNav}
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

        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          </div>
        ) : mode === "read" ? (
          <section className="rounded-2xl border border-black/[0.06] bg-white p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/[0.06] text-sm font-semibold text-primary">
                  {profile?.profile_pic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profile_pic} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(profile)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-primary">
                    {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Admin profile"}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-primary/45">{profile?.email}</p>
                  {profile?.created_at ? (
                    <p className="mt-1 text-[11px] text-primary/35">Since {formatDate(profile.created_at)}</p>
                  ) : null}
                </div>
              </div>
              <Button type="button" variant="primary" size="md" onClick={startEdit}>
                Edit
              </Button>
            </div>

            <dl className="mt-7">
              <ReadRow label="Email" value={profile?.email} />
              <ReadRow label="Role" value={<span className="capitalize">{profile?.role}</span>} />
              <ReadRow label="Verified" value={profile?.email_verified ? "Yes" : "No"} />
              <ReadRow label="Updates" value={profile?.marketing_pref ? "Subscribed" : "Off"} />
            </dl>

            <div className="mt-5 border-t border-black/[0.05] pt-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-primary/35">
                Admin tools
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                <Link href="/admin/students" className="font-medium text-primary/55 transition hover:text-primary">
                  Students
                </Link>
                <Link href="/admin/affiliates" className="font-medium text-primary/55 transition hover:text-primary">
                  Affiliates
                </Link>
                <Link href="/admin/plans" className="font-medium text-primary/55 transition hover:text-primary">
                  Plans
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <form
            className="rounded-2xl border border-black/[0.06] bg-white p-6 md:p-7"
            onSubmit={handleSubmit}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-primary">Edit profile</h2>
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
                  {profilePicPreview ?? profile?.profile_pic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profilePicPreview ?? profile?.profile_pic ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(profile)
                  )}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => onPickPhoto(event.target.files?.[0] ?? null)}
                />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Edit
                </span>
              </label>
              <p className="text-[13px] text-primary/45">{profile?.email}</p>
            </div>

            <div className="mt-7 grid gap-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <input
                  required
                  aria-label="First name"
                  placeholder="First name"
                  value={form.first_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                  className={fieldClass}
                />
                <input
                  required
                  aria-label="Last name"
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                  className={fieldClass}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-primary/55">
                <input
                  type="checkbox"
                  checked={form.marketing_pref}
                  onChange={(e) => setForm((prev) => ({ ...prev, marketing_pref: e.target.checked }))}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                Email me product updates
              </label>
            </div>

            <div className="mt-7 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="lg" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={saving || !hasChanges}
                className="min-w-[7.5rem] justify-center"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
