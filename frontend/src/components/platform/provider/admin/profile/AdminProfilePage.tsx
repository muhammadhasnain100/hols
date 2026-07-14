"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import { updateStoredProfile } from "@/lib/integrate/auth/storage";
import {
  getAdminProfile,
  updateAdminProfile,
  type AdminProfile,
} from "@/lib/integrate/provider/admin/profile/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";
import { inputClassName } from "@/lib/form-styles";

type FormState = {
  first_name: string;
  last_name: string;
  marketing_pref: boolean;
};

export function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    marketing_pref: false,
  });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAdminProfile();
        const nextProfile = data.profile as AdminProfile;
        setProfile(nextProfile);
        setForm({
          first_name: nextProfile.first_name ?? "",
          last_name: nextProfile.last_name ?? "",
          marketing_pref: Boolean(nextProfile.marketing_pref),
        });
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setProfile(nextProfile);
      updateStoredProfile(nextProfile as unknown as Record<string, unknown>);
      setProfilePicFile(null);
      setProfilePicPreview(null);
      setSuccess("Admin profile updated.");
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
      {loading ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <p className="text-sm text-muted">Loading profile…</p>
        </div>
      ) : (
        <div className="mx-auto grid max-w-3xl gap-6">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {profile ? (
            <div className="glass-panel rounded-3xl p-6">
              <h2 className="font-sans text-lg font-semibold text-primary">Account Info</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Email</dt>
                  <dd className="mt-1 font-medium text-primary">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-muted">Role</dt>
                  <dd className="mt-1 font-medium capitalize text-primary">{profile.role}</dd>
                </div>
                <div>
                  <dt className="text-muted">User ID</dt>
                  <dd className="mt-1 font-medium text-primary">{profile.user_id}</dd>
                </div>
                <div>
                  <dt className="text-muted">Member since</dt>
                  <dd className="mt-1 font-medium text-primary">{formatDate(profile.created_at)}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          <form className="glass-panel rounded-3xl p-6 md:p-8" onSubmit={handleSubmit}>
            <h2 className="font-sans text-lg font-semibold text-primary">Edit Profile</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="first-name" className="mb-2 block text-sm font-medium text-primary">
                  First name
                </label>
                <input
                  id="first-name"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="last-name" className="mb-2 block text-sm font-medium text-primary">
                  Last name
                </label>
                <input
                  id="last-name"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="profile-pic" className="mb-2 block text-sm font-medium text-primary">
                Profile picture
              </label>
              {profile?.profile_pic || profilePicPreview ? (
                <div className="mb-3 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profilePicPreview ?? profile?.profile_pic ?? ""}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-2xl border border-primary/10 object-cover"
                  />
                </div>
              ) : null}
              <input
                id="profile-pic"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setProfilePicFile(file);
                  setProfilePicPreview(file ? URL.createObjectURL(file) : null);
                }}
                className={inputClassName}
              />
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border/40 bg-white/60 px-4 py-3.5">
              <input
                type="checkbox"
                checked={form.marketing_pref}
                onChange={(e) => setForm((prev) => ({ ...prev, marketing_pref: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary"
              />
              <span className="text-sm text-muted">Marketing emails enabled</span>
            </label>

            <div className="mt-8 flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/admin" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
                Back to dashboard
              </Link>
              <Button type="submit" variant="primary" size="lg" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </PortalShell>
  );
}
