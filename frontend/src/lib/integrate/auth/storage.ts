import type { StoredUser, UserRole } from "@/lib/integrate/auth/types";

const ACCESS_TOKEN_KEY = "hols_access_token";
const REFRESH_TOKEN_KEY = "hols_refresh_token";
const USER_KEY = "hols_user";

export function saveAuthSession(data: {
  access_token: string;
  refresh_token: string;
  user_id: string;
  role: UserRole;
  profile: Record<string, unknown>;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      user_id: data.user_id,
      role: data.role,
      profile: data.profile,
    } satisfies StoredUser),
  );
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function updateStoredProfile(profile: Record<string, unknown>) {
  const user = getStoredUser();
  if (!user) return;
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      ...user,
      profile,
    } satisfies StoredUser),
  );
}
