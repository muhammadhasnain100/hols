"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AuthField } from "@/components/platform/auth/AuthField";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
import {
  portalInlineMetaClass,
  portalSectionDescClass,
  portalSectionTitleClass,
} from "@/components/platform/provider/portal-styles";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_COUNTRY_CODE,
  MANUAL_VALUE,
  US_STATES,
  getCitiesForState,
  getStateName,
  resolveCitySelection,
  resolveStateSelection,
} from "@/content/locations/us";
import { ApiRequestError } from "@/lib/integrate/client";
import { getStoredUser, updateStoredProfile } from "@/lib/integrate/auth/storage";
import {
  getStudentProfile,
  getCachedStudentProfile,
  updateStudentProfile,
  type StudentAddress,
  type StudentProfile,
  type StudentProfileUpdate,
} from "@/lib/integrate/provider/student/profile/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";
import { cn } from "@/lib/utils";

const selectArrow =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23152744' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const selectClass = cn(
  authFieldClass,
  "appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat px-4 pr-10",
);

type ProfileFormState = {
  first_name: string;
  last_name: string;
  marketing_pref: boolean;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type LocationUiState = {
  stateSelect: string;
  stateManual: string;
  citySelect: string;
  cityManual: string;
};

function emptyForm(): ProfileFormState {
  return {
    first_name: "",
    last_name: "",
    marketing_pref: false,
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: DEFAULT_COUNTRY_CODE,
  };
}

function profileToForm(profile: StudentProfile): ProfileFormState {
  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    marketing_pref: Boolean(profile.marketing_pref),
    line1: profile.address?.line1 ?? "",
    line2: profile.address?.line2 ?? "",
    city: profile.address?.city ?? "",
    state: profile.address?.state ?? "",
    postal_code: profile.address?.postal_code ?? "",
    country: DEFAULT_COUNTRY_CODE,
  };
}

function toLocationUi(form: ProfileFormState): LocationUiState {
  const stateSel = resolveStateSelection(form.state);
  const citySel =
    stateSel.mode === "select"
      ? resolveCitySelection(stateSel.code, form.city)
      : { mode: "manual" as const, value: MANUAL_VALUE, manual: form.city };

  return {
    stateSelect: stateSel.code || "",
    stateManual: stateSel.manual,
    citySelect: citySel.value || "",
    cityManual: citySel.manual,
  };
}

function mergeLocationIntoForm(form: ProfileFormState, location: LocationUiState): ProfileFormState {
  const state =
    location.stateSelect === MANUAL_VALUE ? location.stateManual.trim() : location.stateSelect;
  const city =
    location.stateSelect === MANUAL_VALUE || location.citySelect === MANUAL_VALUE
      ? location.cityManual.trim()
      : location.citySelect;

  return {
    ...form,
    country: DEFAULT_COUNTRY_CODE,
    state,
    city,
  };
}

function storedProfileFallback(): StudentProfile | null {
  const user = getStoredUser();
  if (!user?.profile) return null;
  return {
    user_id: user.user_id,
    role: user.role,
    email: String(user.profile.email ?? ""),
    first_name: String(user.profile.first_name ?? ""),
    last_name: String(user.profile.last_name ?? ""),
    profile_pic: typeof user.profile.profile_pic === "string" ? user.profile.profile_pic : undefined,
    address: user.profile.address as StudentAddress | undefined,
    marketing_pref: Boolean(user.profile.marketing_pref),
    referred_by_affiliate_id:
      typeof user.profile.referred_by_affiliate_id === "string"
        ? user.profile.referred_by_affiliate_id
        : undefined,
    email_verified: Boolean(user.profile.email_verified),
    created_at: typeof user.profile.created_at === "string" ? user.profile.created_at : undefined,
  };
}

function buildAddress(form: ProfileFormState): StudentAddress | undefined {
  const line1 = form.line1.trim();
  const city = form.city.trim();
  if (!line1 || !city) return undefined;

  return {
    line1,
    line2: form.line2.trim() || undefined,
    city,
    state: form.state.trim() || undefined,
    postal_code: form.postal_code.trim() || undefined,
    country: DEFAULT_COUNTRY_CODE,
  };
}

function buildChangedPayload(
  form: ProfileFormState,
  baseline: ProfileFormState,
): StudentProfileUpdate {
  const payload: StudentProfileUpdate = {};

  if (form.first_name.trim() !== baseline.first_name.trim()) {
    payload.first_name = form.first_name.trim();
  }
  if (form.last_name.trim() !== baseline.last_name.trim()) {
    payload.last_name = form.last_name.trim();
  }
  if (form.marketing_pref !== baseline.marketing_pref) {
    payload.marketing_pref = form.marketing_pref;
  }

  const nextAddress = buildAddress(form);
  const prevAddress = buildAddress(baseline);
  if (JSON.stringify(nextAddress ?? null) !== JSON.stringify(prevAddress ?? null)) {
    if (nextAddress) payload.address = nextAddress;
  }

  return payload;
}

function initials(profile: StudentProfile | null) {
  const first = profile?.first_name?.[0] ?? "";
  const last = profile?.last_name?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "S";
}

function formatAddress(address?: StudentAddress) {
  if (!address) return "No address added";
  const stateLabel = getStateName(address.state ?? "") || address.state;
  return [
    address.line1,
    address.line2,
    [address.city, stateLabel, address.postal_code].filter(Boolean).join(", "),
    "United States",
  ]
    .filter(Boolean)
    .join("\n");
}

const mailIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const shieldIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const pinIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const bellIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const accountLinks = [
  {
    label: "Membership",
    href: "/student/payment",
    category: "Billing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/student/payment/orders",
    category: "Billing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    label: "Payment card",
    href: "/student/payment/card",
    category: "Billing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
] as const;

function ProfileDetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="dashboard-row flex items-start gap-3 rounded-xl px-3.5 py-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-brand-caption font-medium text-[color:var(--dash-faint)]">{label}</p>
        <div className="font-sans mt-0.5 text-sm font-medium text-[color:var(--dash-text)]">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function AccountLinkRow({
  label,
  href,
  category,
  icon,
}: {
  label: string;
  href: string;
  category: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="dashboard-row group flex items-center gap-3 rounded-xl px-3 py-3 transition"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] transition group-hover:bg-[#DDE466]/15 group-hover:text-[color:var(--dash-accent)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-brand-caption block text-[color:var(--dash-faint)]">{category}</span>
        <span className="font-sans block truncate text-sm font-medium text-[color:var(--dash-text)]">{label}</span>
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
        aria-hidden
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}

function VerifiedBadge({ verified }: { verified?: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      Not verified
    </span>
  );
}

function FieldSelect({
  id,
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className={authLabelClass}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(selectClass, disabled && "opacity-50")}
        style={{ backgroundImage: selectArrow }}
      >
        {children}
      </select>
    </div>
  );
}

export function StudentProfilePage() {
  const cached = (getCachedStudentProfile()?.profile as StudentProfile | undefined) ?? storedProfileFallback();
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [refreshing, setRefreshing] = useState(!cached);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(cached);
  const [baseline, setBaseline] = useState<ProfileFormState>(
    cached ? profileToForm(cached) : emptyForm(),
  );
  const [form, setForm] = useState<ProfileFormState>(baseline);
  const [location, setLocation] = useState<LocationUiState>(toLocationUi(baseline));
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const applyProfile = useCallback((next: StudentProfile) => {
    const nextForm = profileToForm(next);
    setProfile(next);
    setBaseline(nextForm);
    setForm(nextForm);
    setLocation(toLocationUi(nextForm));
    updateStoredProfile(next as unknown as Record<string, unknown>);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setError(null);
      if (!cached) setRefreshing(true);

      try {
        const data = await getStudentProfile(controller.signal);
        if (controller.signal.aborted) return;
        applyProfile(data.profile as StudentProfile);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!cached) {
          setError(err instanceof ApiRequestError ? err.message : "Failed to load profile.");
        }
      } finally {
        if (!controller.signal.aborted) setRefreshing(false);
      }
    }

    void load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyProfile]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const composedForm = useMemo(() => mergeLocationIntoForm(form, location), [form, location]);
  const dirtyPayload = useMemo(
    () => buildChangedPayload(composedForm, baseline),
    [composedForm, baseline],
  );
  const hasChanges = Object.keys(dirtyPayload).length > 0 || Boolean(profilePicFile);

  const usCities = useMemo(() => {
    if (location.stateSelect && location.stateSelect !== MANUAL_VALUE) {
      return getCitiesForState(location.stateSelect);
    }
    return [];
  }, [location.stateSelect]);

  function startEdit() {
    if (!profile) return;
    const nextForm = profileToForm(profile);
    setForm(nextForm);
    setLocation(toLocationUi(nextForm));
    setProfilePicFile(null);
    setProfilePicPreview(null);
    setError(null);
    setSuccess(null);
    setMode("edit");
  }

  function cancelEdit() {
    setForm(baseline);
    setLocation(toLocationUi(baseline));
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
      const data = await updateStudentProfile(dirtyPayload, profilePicFile);
      applyProfile(data.profile as StudentProfile);
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

  const avatarSrc = profilePicPreview ?? profile?.profile_pic;
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Your profile";

  return (
    <PortalShell role="student" title="Profile" showPageHeader={false} nav={studentNav}>
      <div className="dashboard-screen">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
            {mode === "edit" ? "Edit profile" : "Profile"}
          </h1>

          <span className="dashboard-welcome-chip flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#DDE466] text-brand-caption font-semibold text-[#152744]">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(profile)
              )}
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-[11px] text-[color:var(--dash-faint)]">Welcome back,</span>
              <span className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
                {fullName}
              </span>
            </span>
          </span>
        </header>

        <div className="grid w-full gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {!profile && refreshing ? (
            <section className="dashboard-surface rounded-2xl p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
            </section>
          ) : mode === "read" ? (
            <div className="grid w-full items-start gap-4 lg:grid-cols-[1.9fr_1fr]">
              <div className="flex flex-col gap-4">
                <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/70 bg-white/40 font-sans text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] shadow-[0_8px_20px_rgba(21,39,68,0.12)]">
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(profile)
                      )}
                    </span>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                        Your profile
                      </p>
                      <p className="font-sans mt-1 truncate text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-2xl">
                        {fullName}
                      </p>
                      <p className="text-brand-body mt-0.5 truncate text-[color:var(--dash-muted)]">
                        {profile?.email}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <VerifiedBadge verified={profile?.email_verified} />
                        {profile?.created_at ? (
                          <span className="text-brand-caption rounded-full bg-white/40 px-2.5 py-1 font-medium text-[color:var(--dash-muted)]">
                            Member since {formatDate(profile.created_at)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startEdit}
                      className="font-sans inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
                    >
                      Edit profile
                    </button>
                  </div>
                </section>

                <section className="dashboard-surface rounded-2xl p-5">
                  <h2 className="font-sans text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                    Account details
                  </h2>
                  <div className="mt-4 space-y-2.5">
                    <ProfileDetailRow icon={mailIcon} label="Email address" value={profile?.email} />
                    <ProfileDetailRow
                      icon={shieldIcon}
                      label="Email verification"
                      value={<VerifiedBadge verified={profile?.email_verified} />}
                    />
                    <ProfileDetailRow
                      icon={pinIcon}
                      label="Mailing address"
                      value={<span className="whitespace-pre-line">{formatAddress(profile?.address)}</span>}
                    />
                    <ProfileDetailRow
                      icon={bellIcon}
                      label="Product updates"
                      value={
                        profile?.marketing_pref ? (
                          <span className="inline-flex rounded-full bg-[#DDE466]/20 px-2.5 py-1 text-xs font-medium text-[color:var(--dash-accent)]">
                            Subscribed
                          </span>
                        ) : (
                          "Off"
                        )
                      }
                    />
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-4">
                <section className="dashboard-surface rounded-2xl p-5">
                  <h2 className="font-sans text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                    Account shortcuts
                  </h2>
                  <div className="mt-3 space-y-1">
                    {accountLinks.map((link) => (
                      <AccountLinkRow
                        key={link.href}
                        category={link.category}
                        label={link.label}
                        href={link.href}
                        icon={link.icon}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <section className="dashboard-surface rounded-2xl p-5 md:p-6">
              <form className="mx-auto w-full max-w-3xl" onSubmit={handleSubmit}>
                <div className="dashboard-row mb-5 flex flex-col gap-3 rounded-xl border border-[color:var(--dash-surface-border)] p-4 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-xs font-semibold text-[color:var(--dash-text)]">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(profile)
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={portalSectionTitleClass}>Profile photo</p>
                    <p className={cn("mt-0.5 truncate", portalInlineMetaClass)}>{profile?.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={(event) => onPickPhoto(event.target.files?.[0] ?? null)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change photo
                      </Button>
                      {profilePicFile ? (
                        <button
                          type="button"
                          onClick={() => {
                            onPickPhoto(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-brand-body font-medium text-[color:var(--dash-faint)] transition hover:text-[color:var(--dash-text)]"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthField
                      id="first_name"
                      label="First name"
                      value={form.first_name}
                      onChange={(value) => setForm((prev) => ({ ...prev, first_name: value }))}
                      placeholder="First name"
                      autoComplete="given-name"
                      icon="user"
                      required
                    />
                    <AuthField
                      id="last_name"
                      label="Last name"
                      value={form.last_name}
                      onChange={(value) => setForm((prev) => ({ ...prev, last_name: value }))}
                      placeholder="Last name"
                      autoComplete="family-name"
                      icon="user"
                      required
                    />
                  </div>

                  <AuthField
                    id="line1"
                    label="Address line 1"
                    value={form.line1}
                    onChange={(value) => setForm((prev) => ({ ...prev, line1: value }))}
                    placeholder="Street address"
                    autoComplete="address-line1"
                  />
                  <AuthField
                    id="line2"
                    label="Address line 2"
                    value={form.line2}
                    onChange={(value) => setForm((prev) => ({ ...prev, line2: value }))}
                    placeholder="Apt, suite, etc. (optional)"
                    autoComplete="address-line2"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldSelect
                      id="state"
                      label="State"
                      value={location.stateSelect}
                      onChange={(value) => {
                        setLocation({
                          stateSelect: value,
                          stateManual: value === MANUAL_VALUE ? location.stateManual : "",
                          citySelect: "",
                          cityManual: "",
                        });
                      }}
                    >
                      <option value="">Select state</option>
                      {US_STATES.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                      <option value={MANUAL_VALUE}>Other (manual)</option>
                    </FieldSelect>

                    {location.stateSelect === MANUAL_VALUE ? (
                      <AuthField
                        id="state_manual"
                        label="State"
                        value={location.stateManual}
                        onChange={(value) => setLocation((prev) => ({ ...prev, stateManual: value }))}
                        placeholder="Enter state"
                      />
                    ) : (
                      <FieldSelect
                        id="city"
                        label="City"
                        value={location.citySelect}
                        disabled={!location.stateSelect}
                        onChange={(value) => {
                          setLocation((prev) => ({
                            ...prev,
                            citySelect: value,
                            cityManual: value === MANUAL_VALUE ? prev.cityManual : "",
                          }));
                        }}
                      >
                        <option value="">
                          {location.stateSelect ? "Select city" : "Select state first"}
                        </option>
                        {usCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                        <option value={MANUAL_VALUE}>Other (manual)</option>
                      </FieldSelect>
                    )}
                  </div>

                  {location.stateSelect === MANUAL_VALUE ? (
                    <AuthField
                      id="city_manual"
                      label="City"
                      value={location.cityManual}
                      onChange={(value) => setLocation((prev) => ({ ...prev, cityManual: value }))}
                      placeholder="Enter city"
                    />
                  ) : location.citySelect === MANUAL_VALUE ? (
                    <AuthField
                      id="city_manual_other"
                      label="City"
                      value={location.cityManual}
                      onChange={(value) => setLocation((prev) => ({ ...prev, cityManual: value }))}
                      placeholder="Enter city"
                    />
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthField
                      id="postal_code"
                      label="ZIP / Postal code"
                      value={form.postal_code}
                      onChange={(value) => setForm((prev) => ({ ...prev, postal_code: value }))}
                      placeholder="ZIP code"
                      autoComplete="postal-code"
                    />

                    <div className="grid gap-2">
                      <label htmlFor="country" className={authLabelClass}>
                        Country
                      </label>
                      <input
                        id="country"
                        value="United States"
                        disabled
                        className={cn(authFieldClass, "px-4 opacity-70")}
                      />
                    </div>
                  </div>

                  <label className={cn("flex cursor-pointer items-center gap-3", portalSectionDescClass)}>
                    <input
                      type="checkbox"
                      checked={form.marketing_pref}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, marketing_pref: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary-light/20"
                    />
                    Email me product updates
                  </label>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[color:var(--dash-surface-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-brand-body font-medium text-[color:var(--dash-faint)] transition hover:text-[color:var(--dash-text)]"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={saving || !hasChanges}
                    className="w-full justify-center sm:w-auto sm:min-w-[8.5rem]"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </PortalShell>
  );
}
