"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_COUNTRY_CODE, getStateName } from "@/content/locations/us";
import { ApiRequestError } from "@/lib/integrate/client";
import { getStoredUser, updateStoredProfile } from "@/lib/integrate/auth/storage";
import {
  getAffiliateProfile,
  getCachedAffiliateProfile,
  type AffiliateAddress,
  type AffiliateProfile,
  type AffiliateProfileUpdate,
} from "@/lib/integrate/provider/affiliate/profile/api";
import {
  getAffiliateInviteUrl,
  type AffiliateInviteUrl,
} from "@/lib/integrate/provider/affiliate/referrals/api";

export type ProfileFormState = {
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

export function emptyAffiliateProfileForm(): ProfileFormState {
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

export function affiliateProfileToForm(profile: AffiliateProfile): ProfileFormState {
  return {
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    marketing_pref: Boolean(profile.marketing_pref),
    line1: profile.address?.line1 ?? "",
    line2: profile.address?.line2 ?? "",
    city: profile.address?.city ?? "",
    state: profile.address?.state ?? "",
    postal_code: profile.address?.postal_code ?? "",
    country: profile.address?.country ?? DEFAULT_COUNTRY_CODE,
  };
}

export function storedAffiliateProfileFallback(): AffiliateProfile | null {
  const user = getStoredUser();
  if (!user?.profile || user.role !== "affiliate") return null;

  return {
    user_id: user.user_id,
    role: "affiliate",
    email: String(user.profile.email ?? ""),
    first_name: typeof user.profile.first_name === "string" ? user.profile.first_name : undefined,
    last_name: typeof user.profile.last_name === "string" ? user.profile.last_name : undefined,
    profile_pic: typeof user.profile.profile_pic === "string" ? user.profile.profile_pic : undefined,
    address: user.profile.address as AffiliateAddress | undefined,
    marketing_pref: Boolean(user.profile.marketing_pref),
    margin_percent:
      typeof user.profile.margin_percent === "number" ? user.profile.margin_percent : undefined,
    invite_code: typeof user.profile.invite_code === "string" ? user.profile.invite_code : undefined,
    invitation_quota:
      typeof user.profile.invitation_quota === "number" ? user.profile.invitation_quota : undefined,
    student_count:
      typeof user.profile.student_count === "number" ? user.profile.student_count : undefined,
    email_verified: Boolean(user.profile.email_verified),
    created_at: typeof user.profile.created_at === "string" ? user.profile.created_at : undefined,
  };
}

export function buildAffiliateAddress(form: ProfileFormState): AffiliateAddress | undefined {
  const line1 = form.line1.trim();
  const city = form.city.trim();
  if (!line1 || !city) return undefined;

  return {
    line1,
    line2: form.line2.trim() || undefined,
    city,
    state: form.state.trim() || undefined,
    postal_code: form.postal_code.trim() || undefined,
    country: form.country.trim() || DEFAULT_COUNTRY_CODE,
  };
}

export function buildAffiliateProfilePayload(
  form: ProfileFormState,
  baseline: ProfileFormState,
): AffiliateProfileUpdate {
  const payload: AffiliateProfileUpdate = {};

  if (form.first_name.trim() !== baseline.first_name.trim()) {
    payload.first_name = form.first_name.trim();
  }
  if (form.last_name.trim() !== baseline.last_name.trim()) {
    payload.last_name = form.last_name.trim();
  }
  if (form.marketing_pref !== baseline.marketing_pref) {
    payload.marketing_pref = form.marketing_pref;
  }

  const nextAddress = buildAffiliateAddress(form);
  const prevAddress = buildAffiliateAddress(baseline);
  if (JSON.stringify(nextAddress ?? null) !== JSON.stringify(prevAddress ?? null)) {
    if (nextAddress) payload.address = nextAddress;
  }

  return payload;
}

export function affiliateInitials(profile: AffiliateProfile | null) {
  const first = profile?.first_name?.[0] ?? "";
  const last = profile?.last_name?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "A";
}

export function affiliateDisplayName(profile: AffiliateProfile | null) {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Affiliate";
}

export function formatAffiliateAddress(address?: AffiliateAddress) {
  if (!address) return "No address added";
  const stateLabel = getStateName(address.state ?? "") || address.state;
  return [
    address.line1,
    address.line2,
    [address.city, stateLabel, address.postal_code].filter(Boolean).join(", "),
    address.country === DEFAULT_COUNTRY_CODE ? "United States" : address.country,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatAffiliatePercent(value?: number) {
  if (value == null) return "Not set";
  return `${value}%`;
}

export function affiliateQuotaLabel(profile: AffiliateProfile | null) {
  const studentCount = profile?.student_count ?? 0;
  if (profile?.invitation_quota == null) return "Unlimited";
  return `${studentCount}/${profile.invitation_quota}`;
}

export function affiliateInviteLink(profile: AffiliateProfile | null) {
  if (!profile?.invite_code) return "";
  if (typeof window === "undefined") return `/signup?ref=${profile.invite_code}`;
  return `${window.location.origin}/signup?ref=${profile.invite_code}`;
}

export function useAffiliateProfile() {
  const cached =
    (getCachedAffiliateProfile()?.profile as AffiliateProfile | undefined) ??
    storedAffiliateProfileFallback();
  const [profile, setProfile] = useState<AffiliateProfile | null>(cached);
  const [inviteInfo, setInviteInfo] = useState<AffiliateInviteUrl | null>(null);
  const [refreshing, setRefreshing] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const applyProfile = useCallback((nextProfile: AffiliateProfile) => {
    setProfile(nextProfile);
    updateStoredProfile(nextProfile as unknown as Record<string, unknown>);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setError(null);
      if (!cached) setRefreshing(true);

      try {
        const [profileResult, inviteResult] = await Promise.allSettled([
          getAffiliateProfile(controller.signal),
          getAffiliateInviteUrl(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (profileResult.status === "fulfilled") {
          applyProfile(profileResult.value.profile as AffiliateProfile);
        } else if (!cached) {
          throw profileResult.reason;
        }
        if (inviteResult.status === "fulfilled") {
          setInviteInfo(inviteResult.value);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!cached) {
          setError(err instanceof ApiRequestError ? err.message : "Failed to load affiliate profile.");
        }
      } finally {
        if (!controller.signal.aborted) setRefreshing(false);
      }
    }

    void load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyProfile]);

  const inviteLink = useMemo(
    () => inviteInfo?.public_url ?? affiliateInviteLink(profile),
    [inviteInfo?.public_url, profile],
  );

  return {
    profile,
    setProfile,
    inviteInfo,
    refreshing,
    error,
    setError,
    applyProfile,
    inviteLink,
  };
}
