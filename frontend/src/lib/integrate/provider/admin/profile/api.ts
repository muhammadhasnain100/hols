import { apiFormRequest, apiRequest } from "@/lib/integrate/client";
import type { ProfileData } from "@/lib/integrate/auth/types";
import type { AdminProfileUpdate } from "@/lib/integrate/provider/admin/profile/types";

export type { AdminProfile, AdminProfileUpdate, ProfileAccess } from "@/lib/integrate/provider/admin/profile/types";

export function getUserProfile(userId: string) {
  return apiRequest<ProfileData>(`/api/auth/profile/${userId}`, { auth: true });
}

export function updateUserProfile(userId: string, payload: AdminProfileUpdate) {
  return apiRequest<ProfileData>(`/api/auth/profile/${userId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function getAdminProfile() {
  return apiRequest<ProfileData>("/api/auth/profile", { auth: true });
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

  return apiFormRequest<ProfileData>("/api/auth/profile", formData, { auth: true });
}
