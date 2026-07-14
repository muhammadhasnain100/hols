import { apiFormRequest, apiRequest } from "@/lib/integrate/client";
import type { ProfileData } from "@/lib/integrate/auth/types";
import type {
  StudentAddress,
  StudentProfileUpdate,
} from "@/lib/integrate/provider/student/profile/types";

export type {
  StudentAddress,
  StudentProfile,
  StudentProfileUpdate,
} from "@/lib/integrate/provider/student/profile/types";

export function getStudentProfile(signal?: AbortSignal) {
  return apiRequest<ProfileData>("/api/auth/profile", { auth: true, signal });
}

export function updateStudentProfile(
  payload: StudentProfileUpdate,
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
  });
}
