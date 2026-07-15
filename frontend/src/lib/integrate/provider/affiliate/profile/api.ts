import { apiFormRequest, apiRequest } from "@/lib/integrate/client";
import { getStoredUser, updateStoredProfile } from "@/lib/integrate/auth/storage";
import type { ProfileData } from "@/lib/integrate/auth/types";

export type AffiliateAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
};

export type AffiliateProfile = {
  user_id: string;
  role: "affiliate";
  email: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
  address?: AffiliateAddress;
  marketing_pref?: boolean;
  margin_percent?: number;
  invite_code?: string;
  invitation_quota?: number;
  student_count?: number;
  email_verified?: boolean;
  created_at?: string;
};

export type AffiliateProfileUpdate = {
  first_name?: string;
  last_name?: string;
  address?: AffiliateAddress;
  marketing_pref?: boolean;
};

let profileMemoryCache: ProfileData | null = null;
let profileMemoryUserId: string | null = null;
let pendingProfileRequest: Promise<ProfileData> | null = null;

function profileCacheKey() {
  return `affiliate-profile:${getStoredUser()?.user_id ?? "anonymous"}:me`;
}

function readSessionProfile(): ProfileData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(profileCacheKey());
    return raw ? (JSON.parse(raw) as ProfileData) : null;
  } catch {
    return null;
  }
}

function writeProfileCache(data: ProfileData) {
  profileMemoryCache = data;
  profileMemoryUserId = getStoredUser()?.user_id ?? null;
  updateStoredProfile(data.profile);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(profileCacheKey(), JSON.stringify(data));
  } catch {
    // Profile cache is only an optimization; ignore storage failures.
  }
}

export function getCachedAffiliateProfile() {
  const userId = getStoredUser()?.user_id ?? null;
  if (profileMemoryCache && profileMemoryUserId === userId) return profileMemoryCache;

  const sessionProfile = readSessionProfile();
  if (sessionProfile) {
    profileMemoryCache = sessionProfile;
    profileMemoryUserId = userId;
    return sessionProfile;
  }

  return null;
}

export function getAffiliateProfile(signal?: AbortSignal) {
  const cached = getCachedAffiliateProfile();
  if (cached) return Promise.resolve(cached);
  if (pendingProfileRequest) return pendingProfileRequest;

  pendingProfileRequest = apiRequest<ProfileData>("/api/auth/profile", { auth: true, signal })
    .then((data) => {
      writeProfileCache(data);
      return data;
    })
    .finally(() => {
      pendingProfileRequest = null;
    });
  return pendingProfileRequest;
}

export function updateAffiliateProfile(
  payload: AffiliateProfileUpdate,
  profilePicFile?: File | null,
) {
  const formData = new FormData();
  let hasFields = Boolean(profilePicFile);

  if (payload.first_name !== undefined) {
    formData.append("first_name", payload.first_name);
    hasFields = true;
  }
  if (payload.last_name !== undefined) {
    formData.append("last_name", payload.last_name);
    hasFields = true;
  }
  if (payload.marketing_pref !== undefined) {
    formData.append("marketing_pref", String(payload.marketing_pref));
    hasFields = true;
  }
  if (payload.address) {
    formData.append("address", JSON.stringify(payload.address));
    hasFields = true;
  }
  if (profilePicFile) {
    formData.append("profile_pic", profilePicFile);
  }

  if (!hasFields) {
    return Promise.reject(new Error("No profile changes to save."));
  }

  return apiFormRequest<ProfileData>("/api/auth/profile", formData, {
    auth: true,
  }).then((data) => {
    writeProfileCache(data);
    return data;
  });
}
