"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import type { UserRole } from "@/lib/integrate/auth/types";
import {
  getUserProfile,
  updateUserProfile,
  type AdminProfile,
  type ProfileAccess,
} from "@/lib/integrate/provider/admin/profile/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";
import { inputClassName, selectClassName } from "@/lib/form-styles";

type AdminUserDetailPageProps = {
  userId: string;
};

type FormState = {
  first_name: string;
  last_name: string;
  marketing_pref: boolean;
  margin_percent: string;
  invite_code: string;
  invitation_quota: string;
  role: UserRole;
};

function profileToForm(profile: AdminProfile): FormState {
  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    marketing_pref: Boolean(profile.marketing_pref),
    margin_percent: profile.margin_percent != null ? String(profile.margin_percent) : "",
    invite_code: profile.invite_code ?? "",
    invitation_quota: profile.invitation_quota != null ? String(profile.invitation_quota) : "",
    role: (profile.role as UserRole) ?? "student",
  };
}

export function AdminUserDetailPage({ userId }: AdminUserDetailPageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [access, setAccess] = useState<ProfileAccess | null>(null);
  const [form, setForm] = useState<FormState>(profileToForm({ role: "student" } as AdminProfile));

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getUserProfile(userId);
        const nextProfile = data.profile as AdminProfile;
        setProfile(nextProfile);
        setAccess(data.access as ProfileAccess);
        setForm(profileToForm(nextProfile));
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [userId]);

  function canEdit(field: string) {
    return access?.editable_fields.includes(field) ?? false;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!access?.can_edit) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: Record<string, unknown> = {};

    if (canEdit("first_name")) payload.first_name = form.first_name.trim();
    if (canEdit("last_name")) payload.last_name = form.last_name.trim();
    if (canEdit("marketing_pref")) payload.marketing_pref = form.marketing_pref;
    if (canEdit("margin_percent") && form.margin_percent.trim()) {
      payload.margin_percent = Number(form.margin_percent);
    }
    if (canEdit("invite_code")) payload.invite_code = form.invite_code.trim() || undefined;
    if (canEdit("invitation_quota") && form.invitation_quota.trim()) {
      payload.invitation_quota = Number(form.invitation_quota);
    }
    if (canEdit("role")) payload.role = form.role;

    try {
      const data = await updateUserProfile(userId, payload);
      const nextProfile = data.profile as AdminProfile;
      setProfile(nextProfile);
      setAccess(data.access as ProfileAccess);
      setForm(profileToForm(nextProfile));
      setSuccess("User profile updated.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update user profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalShell
      role="admin"
      title="User Profile"
      subtitle="GET/PUT /api/auth/profile/{user_id}"
      nav={adminNav}
    >
      {loading ? (
        <div className="glass-panel rounded-3xl p-10 text-center">
          <p className="text-sm text-muted">Loading user…</p>
        </div>
      ) : (
        <div className="mx-auto grid max-w-3xl gap-6">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {profile ? (
            <div className="glass-panel rounded-3xl p-6">
              <h2 className="font-sans text-lg font-semibold text-primary">
                {profile.first_name} {profile.last_name}
              </h2>
              {profile.profile_pic ? (
                <div className="mt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profile.profile_pic}
                    alt={`${profile.first_name} ${profile.last_name}`}
                    className="h-16 w-16 rounded-2xl border border-primary/10 object-cover"
                  />
                </div>
              ) : null}
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
                  <dt className="text-muted">Joined</dt>
                  <dd className="mt-1 font-medium text-primary">{formatDate(profile.created_at)}</dd>
                </div>
                {profile.student_count != null ? (
                  <div>
                    <dt className="text-muted">Student count</dt>
                    <dd className="mt-1 font-medium text-primary">{profile.student_count}</dd>
                  </div>
                ) : null}
                {profile.invitation_quota != null ? (
                  <div>
                    <dt className="text-muted">Invitation quota</dt>
                    <dd className="mt-1 font-medium text-primary">{profile.invitation_quota}</dd>
                  </div>
                ) : null}
                {profile.referred_by_affiliate_id ? (
                  <div>
                    <dt className="text-muted">Referred by</dt>
                    <dd className="mt-1 font-medium text-primary">{profile.referred_by_affiliate_id}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : null}

          {access?.can_edit ? (
            <form className="glass-panel rounded-3xl p-6 md:p-8" onSubmit={handleSubmit}>
              <h2 className="font-sans text-lg font-semibold text-primary">Edit User</h2>
              <p className="mt-1 text-sm text-muted">
                Editable fields: {access.editable_fields.join(", ")}
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {canEdit("first_name") ? (
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
                ) : null}
                {canEdit("last_name") ? (
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
                ) : null}
              </div>

              {canEdit("margin_percent") ? (
                <div className="mt-5">
                  <label htmlFor="margin-percent" className="mb-2 block text-sm font-medium text-primary">
                    Margin percent
                  </label>
                  <input
                    id="margin-percent"
                    type="number"
                    step="0.01"
                    value={form.margin_percent}
                    onChange={(e) => setForm((prev) => ({ ...prev, margin_percent: e.target.value }))}
                    className={inputClassName}
                  />
                </div>
              ) : null}

              {canEdit("invite_code") ? (
                <div className="mt-5">
                  <label htmlFor="invite-code" className="mb-2 block text-sm font-medium text-primary">
                    Invite code
                  </label>
                  <input
                    id="invite-code"
                    value={form.invite_code}
                    onChange={(e) => setForm((prev) => ({ ...prev, invite_code: e.target.value }))}
                    className={inputClassName}
                  />
                </div>
              ) : null}

              {canEdit("invitation_quota") ? (
                <div className="mt-5">
                  <label htmlFor="invitation-quota" className="mb-2 block text-sm font-medium text-primary">
                    Invitation quota
                  </label>
                  <input
                    id="invitation-quota"
                    type="number"
                    min="0"
                    value={form.invitation_quota}
                    onChange={(e) => setForm((prev) => ({ ...prev, invitation_quota: e.target.value }))}
                    className={inputClassName}
                  />
                </div>
              ) : null}

              {canEdit("role") ? (
                <div className="mt-5">
                  <label htmlFor="role" className="mb-2 block text-sm font-medium text-primary">
                    Role
                  </label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                    className={selectClassName}
                  >
                    <option value="student">Student</option>
                    <option value="affiliate">Affiliate</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ) : null}

              {canEdit("marketing_pref") ? (
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border/40 bg-white/60 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={form.marketing_pref}
                    onChange={(e) => setForm((prev) => ({ ...prev, marketing_pref: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                  />
                  <span className="text-sm text-muted">Marketing emails enabled</span>
                </label>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/admin/students" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
                  Back to users
                </Link>
                <Button type="submit" variant="primary" size="lg" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          ) : (
            <AuthAlert variant="info">You do not have permission to edit this profile.</AuthAlert>
          )}
        </div>
      )}
    </PortalShell>
  );
}
