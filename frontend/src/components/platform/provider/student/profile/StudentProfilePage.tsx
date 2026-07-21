"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AuthField } from "@/components/platform/auth/AuthField";
import { authFieldClass } from "@/components/platform/auth/auth-styles";
import { ProfileLearningVisual } from "@/components/platform/provider/student/profile/ProfileLearningVisual";
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

const labelClass = "font-sans text-sm font-medium text-primary";

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

const accountLinks = [
  { label: "Membership", href: "/student/payment", category: "Billing" },
  { label: "Orders", href: "/student/payment/orders", category: "Billing" },
  { label: "Payment card", href: "/student/payment/card", category: "Billing" },
] as const;

function ProfileInfoRow({
  category,
  label,
  value,
  className,
}: {
  category: string;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.06)] md:p-5",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/40">{category}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <p className="text-[15px] font-semibold text-primary">{label}</p>
        <div className="text-sm font-medium leading-relaxed text-primary/65 sm:max-w-[55%] sm:text-right">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

function AccountLinkRow({ label, href, category }: { label: string; href: string; category: string }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.06)] transition hover:shadow-[0_4px_14px_rgba(21,39,68,0.08)] md:p-5"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/40">{category}</p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="text-[15px] font-semibold text-primary">{label}</p>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-60"
          aria-hidden
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}

function VerifiedBadge({ verified }: { verified?: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Verified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-primary/[0.06] px-2.5 py-1 text-xs font-medium text-primary/55">
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
      <label htmlFor={id} className={labelClass}>
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

  return (
    <PortalShell role="student" title="Profile" showPageHeader={false} nav={studentNav}>
      <div className="portal-guide-card mb-2 rounded-[1.75rem]">
        <div
          className={cn(
            "flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-9 lg:px-10",
            mode === "edit" ? "py-3 md:py-4" : "py-4 md:py-5",
          )}
        >
          <header className="min-w-0 flex-1">
            <p className="portal-page-eyebrow">HOLS · Student portal</p>
            <h1 className="mt-1 text-xl font-bold leading-tight tracking-tight text-primary md:text-[1.65rem]">
              {mode === "edit" ? "Edit your profile" : "Your learning profile"}
            </h1>
            <p className="mt-1 max-w-lg text-[13px] leading-snug text-muted md:text-sm">
              {mode === "edit"
                ? "Update your name, address, and profile photo."
                : "Manage your personal details, account photo, and learning preferences."}
            </p>
          </header>

          {mode !== "edit" ? (
            <ProfileLearningVisual className="mx-auto sm:mx-0 sm:justify-self-end" />
          ) : null}
        </div>

        <div className="px-4 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
          <div className="profile-guide-body rounded-2xl px-6 pb-8 pt-5 md:px-8 md:pb-10 md:pt-6 lg:px-10 lg:pb-10">
            <div className="grid w-full gap-5 md:gap-6">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {!profile && refreshing ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
              <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
            </div>
          ) : mode === "read" ? (
            <div className="grid w-full items-start gap-5 lg:grid-cols-[minmax(16rem,18rem)_1fr] lg:gap-6">
              <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(21,39,68,0.06)] md:p-7">
                <div className="flex flex-col items-center text-center">
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/10 bg-primary/[0.04] text-base font-semibold text-primary shadow-[0_4px_14px_rgba(21,39,68,0.06)]">
                    {avatarSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(profile)
                    )}
                  </span>
                  <div className="mt-4 min-w-0 w-full">
                    <p className="truncate font-sans text-lg font-semibold tracking-tight text-primary">
                      {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Your profile"}
                    </p>
                    <p className="mt-1 truncate text-sm text-primary/50">{profile?.email}</p>
                    <div className="mt-3 flex justify-center">
                      <VerifiedBadge verified={profile?.email_verified} />
                    </div>
                    {profile?.created_at ? (
                      <p className="mt-3 text-xs text-primary/40">
                        Member since {formatDate(profile.created_at)}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="mt-5 w-full justify-center"
                    onClick={startEdit}
                  >
                    Edit profile
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                <ProfileInfoRow category="Contact" label="Email address" value={profile?.email} />
                <ProfileInfoRow
                  category="Security"
                  label="Email verification"
                  value={<VerifiedBadge verified={profile?.email_verified} />}
                />
                <ProfileInfoRow
                  category="Location"
                  label="Mailing address"
                  value={<span className="whitespace-pre-line">{formatAddress(profile?.address)}</span>}
                />
                <ProfileInfoRow
                  category="Preferences"
                  label="Product updates"
                  value={
                    profile?.marketing_pref ? (
                      <span className="inline-flex rounded-full bg-primary/[0.06] px-2.5 py-1 text-xs font-medium text-primary/70">
                        Subscribed
                      </span>
                    ) : (
                      "Off"
                    )
                  }
                />

                <div className="mt-2 grid gap-3">
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/40">
                    Account shortcuts
                  </p>
                  {accountLinks.map((link) => (
                    <AccountLinkRow
                      key={link.href}
                      category={link.category}
                      label={link.label}
                      href={link.href}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form className="mx-auto w-full max-w-3xl" onSubmit={handleSubmit}>
              <div className="mb-5 flex flex-col gap-3 rounded-xl bg-white/80 p-4 shadow-[0_1px_3px_rgba(21,39,68,0.05)] sm:flex-row sm:items-center sm:gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-primary/[0.04] text-xs font-semibold text-primary">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(profile)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">Profile photo</p>
                  <p className="mt-0.5 truncate text-xs text-primary/50">{profile?.email}</p>
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
                        className="text-xs font-medium text-primary/60 transition hover:text-primary"
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
                  <label htmlFor="country" className={labelClass}>
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

              <label className="flex cursor-pointer items-center gap-3 text-sm text-muted">
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

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-primary/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={cancelEdit}
                className="text-sm font-medium text-primary/60 transition hover:text-primary"
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
        )}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
