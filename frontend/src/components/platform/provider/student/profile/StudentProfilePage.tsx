"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  CreditCard,
  Icon,
  Mail,
  MapPin,
  Menu,
  ShieldCheck,
  Star,
} from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { ProfilePageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { studentNav } from "@/components/platform/provider/student/studentNav";
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

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
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

function DashSelect({
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
    <div className="grid min-w-0 gap-2">
      <label htmlFor={id} className="dashboard-field-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn("dashboard-field dashboard-field-select", disabled && "opacity-50")}
      >
        {children}
      </select>
    </div>
  );
}

const mailIcon = <Icon icon={Mail} size={16} />;

const shieldIcon = <Icon icon={ShieldCheck} size={16} />;

const pinIcon = <Icon icon={MapPin} size={16} />;

const bellIcon = <Icon icon={Bell} size={16} />;

const accountLinks = [
  {
    label: "Membership",
    href: "/student/payment",
    category: "Billing",
    icon: <Icon icon={Star} size={16} />,
  },
  {
    label: "Orders",
    href: "/student/payment/orders",
    category: "Billing",
    icon: <Icon icon={ClipboardList} size={16} />,
  },
  {
    label: "Payment card",
    href: "/student/payment/card",
    category: "Billing",
    icon: <Icon icon={CreditCard} size={16} />,
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
    <div className="dashboard-row flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 sm:gap-3 sm:px-3.5 sm:py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] sm:h-9 sm:w-9">
        {icon}
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-brand-caption font-medium text-[color:var(--dash-faint)]">{label}</p>
        <div className="font-sans mt-0.5 break-words text-sm font-medium text-[color:var(--dash-text)] [overflow-wrap:anywhere]">
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
      className="dashboard-row group flex min-h-12 items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition sm:gap-3 sm:px-3 sm:py-3"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] transition group-hover:bg-[#DDE466]/15 group-hover:text-[color:var(--dash-accent)] sm:h-9 sm:w-9">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-brand-caption block text-[color:var(--dash-faint)]">{category}</span>
        <span className="font-sans block truncate text-sm font-medium text-[color:var(--dash-text)]">{label}</span>
      </span>
      <Icon
        icon={ChevronRight}
        size={16}
        className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
      />
    </Link>
  );
}

function VerifiedBadge({ verified }: { verified?: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600">
        <Icon icon={Check} size={12} strokeWidth={2.2} />
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600">
      <Icon icon={CircleAlert} size={12} strokeWidth={2} />
      Not verified
    </span>
  );
}

export function StudentProfilePage() {
  // Keep SSR and first client paint identical — never read session/local cache during render.
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [baseline, setBaseline] = useState<ProfileFormState>(emptyForm);
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [location, setLocation] = useState<LocationUiState>(() => toLocationUi(emptyForm()));
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
    const cached =
      (getCachedStudentProfile()?.profile as StudentProfile | undefined) ?? storedProfileFallback();

    if (cached) {
      applyProfile(cached);
    }

    async function load() {
      setError(null);

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
      }
    }

    void load();
    return () => controller.abort();
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
      setSuccess("Profile updated.");
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
    <PortalShell
      role="student"
      title="Profile"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
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
              <Icon icon={Menu} size={18} />
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

          <WelcomeChip />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {!profile ? (
            <ProfilePageSkeleton />
          ) : mode === "read" ? (
            <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
                  <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/70 bg-white/40 font-sans text-sm font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:h-20 sm:w-20 sm:text-lg">
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
                        <div className="mt-1.5 flex flex-col items-center gap-1.5 sm:mt-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-start sm:gap-x-2 sm:gap-y-1">
                          <span className="font-sans max-w-full break-words text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                            {fullName}
                          </span>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-brand-caption font-semibold sm:mb-0.5",
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
                            Member since {formatDate(profile.created_at)}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={startEdit}
                      className="font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:min-h-10 sm:w-auto lg:shrink-0"
                    >
                      Edit profile
                    </button>
                  </div>
                </section>

                <section className="dashboard-surface rounded-2xl p-3.5 sm:p-5 md:p-6">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Account
                  </p>
                  <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                    Account details
                  </h2>
                  <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
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

              <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                <section className="dashboard-surface rounded-2xl p-3.5 sm:p-5 md:p-6">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Shortcuts
                  </p>
                  <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                    Billing & payment
                  </h2>
                  <div className="mt-2.5 space-y-1 sm:mt-3">
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
                      <span className="sm:hidden">Update name, photo, and address.</span>
                      <span className="hidden sm:inline">
                        Update your name, photo, mailing address, and email preferences.
                      </span>
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
                      form="profile-edit-form"
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
                          initials(profile)
                        )}
                      </span>
                      <div className="min-w-0 w-full flex-1 text-center sm:text-left">
                        <p className="text-brand-body break-all text-sm text-[color:var(--dash-muted)] sm:truncate sm:break-normal">
                          {profile?.email}
                        </p>
                        <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                          JPEG, PNG, WebP, or GIF
                        </p>
                        <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
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

                  <section className="dashboard-surface hidden rounded-2xl p-4 sm:p-5 lg:block">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Current
                    </p>
                    <p className="font-sans mt-2 text-lg font-semibold text-[color:var(--dash-text)]">
                      {fullName}
                    </p>
                    <p className="text-brand-body mt-1 whitespace-pre-line text-sm text-[color:var(--dash-muted)]">
                      {formatAddress(profile?.address)}
                    </p>
                  </section>
                </div>

                <section className="dashboard-surface order-1 min-w-0 rounded-2xl p-3.5 sm:p-5 md:p-6 lg:order-2">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Profile details
                  </p>
                  <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                    Personal information
                  </h2>
                  <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
                    Name and mailing address for your account.
                  </p>

                  <form id="profile-edit-form" className="mt-4 grid gap-3 sm:mt-5 sm:gap-4" onSubmit={handleSubmit}>
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <DashField
                        id="first_name"
                        label="First name"
                        value={form.first_name}
                        onChange={(value) => setForm((prev) => ({ ...prev, first_name: value }))}
                        placeholder="First name"
                        autoComplete="given-name"
                        required
                      />
                      <DashField
                        id="last_name"
                        label="Last name"
                        value={form.last_name}
                        onChange={(value) => setForm((prev) => ({ ...prev, last_name: value }))}
                        placeholder="Last name"
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
                      placeholder="Apt, suite, etc. (optional)"
                      autoComplete="address-line2"
                    />

                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <DashSelect
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
                      </DashSelect>

                      {location.stateSelect === MANUAL_VALUE ? (
                        <DashField
                          id="state_manual"
                          label="State"
                          value={location.stateManual}
                          onChange={(value) => setLocation((prev) => ({ ...prev, stateManual: value }))}
                          placeholder="Enter state"
                        />
                      ) : (
                        <DashSelect
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
                        </DashSelect>
                      )}
                    </div>

                    {location.stateSelect === MANUAL_VALUE ? (
                      <DashField
                        id="city_manual"
                        label="City"
                        value={location.cityManual}
                        onChange={(value) => setLocation((prev) => ({ ...prev, cityManual: value }))}
                        placeholder="Enter city"
                      />
                    ) : location.citySelect === MANUAL_VALUE ? (
                      <DashField
                        id="city_manual_other"
                        label="City"
                        value={location.cityManual}
                        onChange={(value) => setLocation((prev) => ({ ...prev, cityManual: value }))}
                        placeholder="Enter city"
                      />
                    ) : null}

                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                      <DashField
                        id="postal_code"
                        label="ZIP / Postal code"
                        value={form.postal_code}
                        onChange={(value) => setForm((prev) => ({ ...prev, postal_code: value }))}
                        placeholder="ZIP code"
                        autoComplete="postal-code"
                      />
                      <div className="grid min-w-0 gap-2">
                        <label htmlFor="country" className="dashboard-field-label">
                          Country
                        </label>
                        <input
                          id="country"
                          value="United States"
                          disabled
                          className="dashboard-field opacity-70"
                        />
                      </div>
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
                          Occasional news about courses and membership.
                        </span>
                      </span>
                    </label>

                    <div className="mt-1 flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5">
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
                        className="font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-6 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:min-w-[10rem]"
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
