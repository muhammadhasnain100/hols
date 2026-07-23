"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { ApiRequestError } from "@/lib/integrate/client";
import type { UserRole } from "@/lib/integrate/auth/types";
import {
  getUserProfile,
  updateUserProfile,
  type AdminProfile,
  type ProfileAccess,
} from "@/lib/integrate/provider/admin/profile/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";
import { cn } from "@/lib/utils";

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

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function initials(profile: AdminProfile | null) {
  const first = profile?.first_name?.[0] ?? "";
  const last = profile?.last_name?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "U";
}

function DashField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string | number;
  step?: string | number;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="dashboard-field-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="dashboard-field"
      />
    </div>
  );
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
    if (!access?.can_edit || profile?.role === "student") return;

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

  const fullName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "User profile"
    : "User profile";
  const isStudent = profile?.role === "student";
  // Student profiles are view-only from the admin directory.
  const allowEdit = Boolean(access?.can_edit) && !isStudent;
  const backHref = profile?.role === "affiliate" ? "/admin/affiliates" : "/admin/students";
  const backLabelFull = profile?.role === "affiliate" ? "Back to affiliates" : "Back to students";
  const backLabelShort = profile?.role === "affiliate" ? "Affiliates" : "Students";

  return (
    <PortalShell
      role="admin"
      title="User Profile"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={adminNav}
    >
      <div className="dashboard-screen profile-page min-w-0 overflow-x-hidden">
        <header className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
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
            <h1 className="font-sans truncate text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              User profile
            </h1>
          </div>
          <WelcomeChip fallbackName="Admin" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {loading ? (
            <div className="dashboard-surface rounded-2xl p-10 text-center" aria-busy="true">
              <span className="dashboard-skeleton-block mx-auto block h-8 w-8 rounded-full" />
            </div>
          ) : (
            <>
              <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
                <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/70 bg-white/40 font-sans text-sm font-bold text-[color:var(--dash-text)] shadow-[0_8px_20px_rgba(21,39,68,0.12)] sm:h-20 sm:w-20 sm:text-lg">
                      {profile?.profile_pic ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.profile_pic} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(profile)
                      )}
                    </span>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                        Managed account
                      </p>
                      <div className="mt-1.5 flex flex-col items-center gap-1.5 sm:mt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-2">
                        <span className="font-sans max-w-full break-words text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                          {fullName}
                        </span>
                        <span className="inline-flex rounded-full bg-[#DDE466]/25 px-2.5 py-0.5 text-brand-caption font-semibold capitalize text-[color:var(--dash-accent)]">
                          {profile?.role || "user"}
                        </span>
                      </div>
                      <p className="text-brand-body mt-1.5 break-all text-[color:var(--dash-muted)] sm:mt-2 sm:truncate sm:break-normal">
                        {profile?.email}
                      </p>
                      {profile?.created_at ? (
                        <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                          Joined {formatDate(profile.created_at)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    href={backHref}
                    className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:min-h-10 sm:w-auto lg:shrink-0"
                  >
                    <span className="sm:hidden">{backLabelShort}</span>
                    <span className="hidden sm:inline">{backLabelFull}</span>
                  </Link>
                </div>
              </section>

              <div
                className={cn(
                  "grid w-full min-w-0 items-start gap-3 sm:gap-4",
                  allowEdit && "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]",
                )}
              >
                <section className="dashboard-surface order-2 min-w-0 rounded-2xl p-3.5 sm:p-5 md:p-6 lg:order-1">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Account
                  </p>
                  <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                    Details
                  </h2>
                  <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                    <DetailRow label="Email" value={profile?.email} />
                    <DetailRow label="Role" value={<span className="capitalize">{profile?.role}</span>} />
                    <DetailRow label="Joined" value={formatDate(profile?.created_at)} />
                    {profile?.student_count != null ? (
                      <DetailRow label="Student count" value={String(profile.student_count)} />
                    ) : null}
                    {profile?.invitation_quota != null ? (
                      <DetailRow label="Invitation quota" value={String(profile.invitation_quota)} />
                    ) : null}
                    {profile?.margin_percent != null ? (
                      <DetailRow label="Margin" value={`${profile.margin_percent}%`} />
                    ) : null}
                    {profile?.invite_code ? (
                      <DetailRow label="Invite code" value={profile.invite_code} />
                    ) : null}
                    {profile?.referred_by_affiliate_id ? (
                      <DetailRow label="Referred by" value={profile.referred_by_affiliate_id} />
                    ) : null}
                    <DetailRow
                      label="Marketing"
                      value={profile?.marketing_pref ? "Subscribed" : "Off"}
                    />
                  </div>
                </section>

                {allowEdit ? (
                  <section className="dashboard-surface order-1 min-w-0 rounded-2xl p-3.5 sm:p-5 md:p-6 lg:order-2">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Edit
                    </p>
                    <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                      Update fields
                    </h2>
                    <p className="text-brand-body mt-1 break-words text-sm text-[color:var(--dash-muted)] [overflow-wrap:anywhere]">
                      Editable: {access?.editable_fields.join(", ")}
                    </p>

                    <form className="mt-4 grid gap-3 sm:mt-5 sm:gap-4" onSubmit={handleSubmit}>
                      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        {canEdit("first_name") ? (
                          <DashField
                            id="first-name"
                            label="First name"
                            value={form.first_name}
                            required
                            onChange={(value) => setForm((prev) => ({ ...prev, first_name: value }))}
                          />
                        ) : null}
                        {canEdit("last_name") ? (
                          <DashField
                            id="last-name"
                            label="Last name"
                            value={form.last_name}
                            required
                            onChange={(value) => setForm((prev) => ({ ...prev, last_name: value }))}
                          />
                        ) : null}
                      </div>

                      {canEdit("margin_percent") ? (
                        <DashField
                          id="margin-percent"
                          label="Margin percent"
                          type="number"
                          step="0.01"
                          value={form.margin_percent}
                          onChange={(value) => setForm((prev) => ({ ...prev, margin_percent: value }))}
                        />
                      ) : null}

                      {canEdit("invite_code") ? (
                        <DashField
                          id="invite-code"
                          label="Invite code"
                          value={form.invite_code}
                          onChange={(value) => setForm((prev) => ({ ...prev, invite_code: value }))}
                        />
                      ) : null}

                      {canEdit("invitation_quota") ? (
                        <DashField
                          id="invitation-quota"
                          label="Invitation quota"
                          type="number"
                          min={0}
                          value={form.invitation_quota}
                          onChange={(value) =>
                            setForm((prev) => ({ ...prev, invitation_quota: value }))
                          }
                        />
                      ) : null}

                      {canEdit("role") ? (
                        <div className="grid min-w-0 gap-2">
                          <label htmlFor="role" className="dashboard-field-label">
                            Role
                          </label>
                          <select
                            id="role"
                            value={form.role}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))
                            }
                            className={cn("dashboard-field", "dashboard-field-select")}
                          >
                            <option value="student">Student</option>
                            <option value="affiliate">Affiliate</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      ) : null}

                      {canEdit("marketing_pref") ? (
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
                          <input
                            type="checkbox"
                            checked={form.marketing_pref}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, marketing_pref: e.target.checked }))
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--dash-dim)] accent-[#DDE466]"
                          />
                          <span className="min-w-0">
                            <span className="font-sans block text-sm font-medium text-[color:var(--dash-text)]">
                              Marketing emails enabled
                            </span>
                          </span>
                        </label>
                      ) : null}

                      <div className="mt-1 flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <Link
                          href={backHref}
                          className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
                        >
                          <span className="sm:hidden">{backLabelShort}</span>
                          <span className="hidden sm:inline">{backLabelFull}</span>
                        </Link>
                        <button
                          type="submit"
                          disabled={saving}
                          className="font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:min-w-[10rem]"
                        >
                          {saving ? "Saving…" : "Save changes"}
                        </button>
                      </div>
                    </form>
                  </section>
                ) : !isStudent ? (
                  <section className="dashboard-surface order-1 min-w-0 rounded-2xl p-4 sm:p-5 lg:order-2">
                    <AuthAlert variant="info">You do not have permission to edit this profile.</AuthAlert>
                  </section>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="dashboard-row flex min-w-0 flex-col items-start gap-1 rounded-xl px-2.5 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-3.5 sm:py-3">
      <p className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-faint)]">{label}</p>
      <div className="font-sans min-w-0 w-full break-words text-sm font-medium text-[color:var(--dash-text)] [overflow-wrap:anywhere] sm:w-auto sm:text-right">
        {value || "—"}
      </div>
    </div>
  );
}
