import { apiRequest } from "@/lib/integrate/client";
import type {
  LoginOtpRequired,
  LoginPayload,
  LoginSuccess,
  ProfileData,
  ProfileUpdatePayload,
  SignupPayload,
  SignupSuccess,
} from "@/lib/integrate/auth/types";

export function isOtpRequired(
  result: LoginOtpRequired | LoginSuccess,
): result is LoginOtpRequired {
  return "otp_required" in result && result.otp_required === true;
}

export function login(payload: LoginPayload) {
  return apiRequest<LoginOtpRequired | LoginSuccess>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function signup(payload: SignupPayload) {
  return apiRequest<SignupSuccess>("/api/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export function verifyOtp(otp_token: string, code: string) {
  return apiRequest<LoginSuccess>("/api/auth/verify-otp", {
    method: "POST",
    body: { otp_token, code },
  });
}

export function resendOtp(otp_token: string) {
  return apiRequest<{ otp_token: string; message: string; expires_in: number }>(
    "/api/auth/send-otp",
    {
      method: "POST",
      body: { otp_token },
    },
  );
}

export function refreshTokens(refresh_token: string) {
  return apiRequest<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  }>("/api/auth/refresh", {
    method: "POST",
    body: { refresh_token },
  });
}

export function getMyProfile() {
  return apiRequest<ProfileData>("/api/auth/profile", { auth: true });
}

export function updateMyProfile(payload: ProfileUpdatePayload) {
  return apiRequest<ProfileData>("/api/auth/profile", {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function getProfileById(userId: string) {
  return apiRequest<ProfileData>(`/api/auth/profile/${userId}`, { auth: true });
}

export function updateProfileById(userId: string, payload: ProfileUpdatePayload) {
  return apiRequest<ProfileData>(`/api/auth/profile/${userId}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}
