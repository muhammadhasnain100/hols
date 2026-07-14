import { apiRequest } from "@/lib/integrate/client";
import type { ProfileData, ProfileUpdatePayload } from "@/lib/integrate/auth/types";

export function getAffiliateProfile() {
  return apiRequest<ProfileData>("/api/auth/profile", { auth: true });
}

export function updateAffiliateProfile(payload: ProfileUpdatePayload) {
  return apiRequest<ProfileData>("/api/auth/profile", {
    method: "PUT",
    auth: true,
    body: payload,
  });
}
