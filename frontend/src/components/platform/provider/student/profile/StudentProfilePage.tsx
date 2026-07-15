"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
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

const fieldClass =
  "w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm text-primary outline-none transition placeholder:text-primary/35 focus:border-primary/30 focus:ring-4 focus:ring-primary/5";

const selectArrow =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23152744' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const selectClass = cn(
  fieldClass,
  "appearance-none bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat pr-10",
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

function ReadRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-black/[0.05] py-3 last:border-b-0 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-[13px] text-primary/45">{label}</dt>
      <dd className="text-[13px] font-medium whitespace-pre-line text-primary">{value || "—"}</dd>
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
    <PortalShell role="student" title="Profile" nav={studentNav}>
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

        {!profile && refreshing ? (
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
                    initials(profile)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-primary">
                    {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Your profile"}
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
              <ReadRow label="Verified" value={profile?.email_verified ? "Yes" : "No"} />
              <ReadRow label="Address" value={formatAddress(profile?.address)} />
              <ReadRow label="Updates" value={profile?.marketing_pref ? "Subscribed" : "Off"} />
            </dl>

            <div className="mt-5 border-t border-black/[0.05] pt-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-primary/35">
                Account
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                <Link
                  href="/student/payment"
                  className="font-medium text-primary/55 transition hover:text-primary"
                >
                  Membership
                </Link>
                <Link
                  href="/student/payment/orders"
                  className="font-medium text-primary/55 transition hover:text-primary"
                >
                  Orders
                </Link>
                <Link
                  href="/student/payment/card"
                  className="font-medium text-primary/55 transition hover:text-primary"
                >
                  Payment card
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
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
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

              <input
                aria-label="Address line 1"
                placeholder="Address line 1"
                value={form.line1}
                onChange={(e) => setForm((prev) => ({ ...prev, line1: e.target.value }))}
                className={fieldClass}
              />
              <input
                aria-label="Address line 2"
                placeholder="Address line 2"
                value={form.line2}
                onChange={(e) => setForm((prev) => ({ ...prev, line2: e.target.value }))}
                className={fieldClass}
              />

              <div className="grid gap-3.5 sm:grid-cols-2">
                <select
                  aria-label="State"
                  value={location.stateSelect}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocation({
                      stateSelect: value,
                      stateManual: value === MANUAL_VALUE ? location.stateManual : "",
                      citySelect: "",
                      cityManual: "",
                    });
                  }}
                  className={selectClass}
                  style={{ backgroundImage: selectArrow }}
                >
                  <option value="">Select state</option>
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                  <option value={MANUAL_VALUE}>Other (manual)</option>
                </select>

                <input
                  aria-label="Postal code"
                  placeholder="ZIP / Postal code"
                  value={form.postal_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, postal_code: e.target.value }))}
                  className={fieldClass}
                />
              </div>

              {location.stateSelect === MANUAL_VALUE ? (
                <>
                  <input
                    aria-label="State manual"
                    placeholder="Enter state"
                    value={location.stateManual}
                    onChange={(e) =>
                      setLocation((prev) => ({ ...prev, stateManual: e.target.value }))
                    }
                    className={fieldClass}
                  />
                  <input
                    aria-label="City manual"
                    placeholder="Enter city"
                    value={location.cityManual}
                    onChange={(e) =>
                      setLocation((prev) => ({ ...prev, cityManual: e.target.value }))
                    }
                    className={fieldClass}
                  />
                </>
              ) : (
                <>
                  <select
                    aria-label="City"
                    value={location.citySelect}
                    disabled={!location.stateSelect}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocation((prev) => ({
                        ...prev,
                        citySelect: value,
                        cityManual: value === MANUAL_VALUE ? prev.cityManual : "",
                      }));
                    }}
                    className={cn(selectClass, !location.stateSelect && "opacity-50")}
                    style={{ backgroundImage: selectArrow }}
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
                  </select>

                  {location.citySelect === MANUAL_VALUE ? (
                    <input
                      aria-label="City manual"
                      placeholder="Enter city"
                      value={location.cityManual}
                      onChange={(e) =>
                        setLocation((prev) => ({ ...prev, cityManual: e.target.value }))
                      }
                      className={fieldClass}
                    />
                  ) : null}
                </>
              )}

              <p className="text-[12px] text-primary/35">Country: United States</p>

              <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-primary/55">
                <input
                  type="checkbox"
                  checked={form.marketing_pref}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, marketing_pref: e.target.checked }))
                  }
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
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PortalShell>
  );
}
