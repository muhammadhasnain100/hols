import { apiRequest } from "@/lib/integrate/client";
import { getStoredUser } from "@/lib/integrate/auth/storage";

const adminMemoryCache = new Map<string, unknown>();
const adminPendingRequests = new Map<string, Promise<unknown>>();

export function adminCacheKey(kind: string, ...parts: Array<string | number | undefined | null>) {
  const userId = getStoredUser()?.user_id ?? "anonymous";
  return ["admin", userId, kind, ...parts.map((part) => part ?? "")].join(":");
}

function readSessionCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSessionCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Admin cache only improves navigation speed; ignore storage failures.
  }
}

export function readAdminCache<T>(key: string): T | null {
  const memoryValue = adminMemoryCache.get(key);
  if (memoryValue !== undefined) return memoryValue as T;

  const sessionValue = readSessionCache<T>(key);
  if (sessionValue !== null) {
    adminMemoryCache.set(key, sessionValue);
    return sessionValue;
  }

  return null;
}

export function writeAdminCache<T>(key: string, value: T) {
  adminMemoryCache.set(key, value);
  writeSessionCache(key, value);
}

export function deleteAdminCache(key: string) {
  adminMemoryCache.delete(key);
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(key);
  }
}

export function clearAdminCachePrefix(prefix: string) {
  for (const key of adminMemoryCache.keys()) {
    if (key.startsWith(prefix)) adminMemoryCache.delete(key);
  }
  if (typeof window === "undefined") return;
  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(prefix)) window.sessionStorage.removeItem(key);
  }
}

export async function cachedAdminRequest<T>(
  key: string,
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const cachedValue = readAdminCache<T>(key);
  if (cachedValue !== null) return cachedValue;

  const pending = adminPendingRequests.get(key);
  if (pending) return pending as Promise<T>;

  const request = apiRequest<T>(path, { auth: true, signal })
    .then((value) => {
      writeAdminCache(key, value);
      return value;
    })
    .finally(() => {
      adminPendingRequests.delete(key);
    });
  adminPendingRequests.set(key, request);
  return request;
}
