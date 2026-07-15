import { apiFormRequest, apiRequest } from "@/lib/integrate/client";
import type { ProfileData } from "@/lib/integrate/auth/types";
import {
  adminCacheKey,
  cachedAdminRequest,
  clearAdminCachePrefix,
  readAdminCache,
  writeAdminCache,
} from "@/lib/integrate/provider/admin/cache";
import type { AdminProfileUpdate } from "@/lib/integrate/provider/admin/profile/types";

export type { AdminProfile, AdminProfileUpdate, ProfileAccess } from "@/lib/integrate/provider/admin/profile/types";

export function getCachedAdminProfile() {
  return readAdminCache<ProfileData>(adminCacheKey("profile"));
}

export function getUserProfile(userId: string) {
  return cachedAdminRequest<ProfileData>(
    adminCacheKey("profile-by-id", userId),
    `/api/auth/profile/${userId}`,
  );
}

export function updateUserProfile(userId: string, payload: AdminProfileUpdate) {
  return apiRequest<ProfileData>(`/api/auth/profile/${userId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  }).then((data) => {
    writeAdminCache(adminCacheKey("profile-by-id", userId), data);
    clearAdminCachePrefix(adminCacheKey("students"));
    clearAdminCachePrefix(adminCacheKey("affiliates"));
    clearAdminCachePrefix(adminCacheKey("users-affiliates"));
    return data;
  });
}

export function getAdminProfile() {
  return cachedAdminRequest<ProfileData>(
    adminCacheKey("profile"),
    "/api/auth/profile",
  );
}

export function updateAdminProfile(payload: AdminProfileUpdate, profilePicFile?: File | null) {
  const formData = new FormData();

  if (payload.first_name !== undefined) formData.append("first_name", payload.first_name);
  if (payload.last_name !== undefined) formData.append("last_name", payload.last_name);
  if (payload.marketing_pref !== undefined) {
    formData.append("marketing_pref", String(payload.marketing_pref));
  }
  if (profilePicFile) {
    formData.append("profile_pic", profilePicFile);
  }

  return apiFormRequest<ProfileData>("/api/auth/profile", formData, { auth: true }).then((data) => {
    writeAdminCache(adminCacheKey("profile"), data);
    return data;
  });
}
