"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { restoreSession } from "@/lib/integrate/auth/api";
import { stopPortalAuthRuntime } from "@/lib/integrate/auth/runtime";
import { getLoginPath, getPortalPath } from "@/lib/integrate/auth/routes";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  notifyAuthLogout,
  saveAuthSession,
} from "@/lib/integrate/auth/storage";
import type { UserRole } from "@/lib/integrate/auth/types";
import { logoutOnServer } from "@/lib/integrate/client";

export function enterPortal(session: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user_id: string;
  role: UserRole;
  profile: Record<string, unknown>;
}) {
  saveAuthSession(session);
  return getPortalPath(session.role);
}

export function logoutImmediately(role: UserRole) {
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();
  stopPortalAuthRuntime();
  clearAuthSession();
  notifyAuthLogout();
  logoutOnServer(refreshToken, accessToken);
  return getLoginPath(role);
}

function bounceToStoredPortal(replace: (href: string) => void) {
  const user = getStoredUser();
  if (!user) return false;
  replace(getPortalPath(user.role));
  return true;
}

export function useRestoreSessionOnLogin() {
  const router = useRouter();
  const [blocked, setBlocked] = useState(true);

  useEffect(() => {
    const replace = (href: string) => router.replace(href);
    bounceToStoredPortal(replace);

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      setBlocked(Boolean(getStoredUser()));
      return undefined;
    }

    let cancelled = false;
    void restoreSession(refreshToken)
      .then((session) => {
        if (cancelled) return;
        saveAuthSession(session);
        router.replace(getPortalPath(session.role));
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthSession();
        notifyAuthLogout();
        setBlocked(false);
      });

    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted || getStoredUser()) {
        bounceToStoredPortal(replace);
      }
    }

    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  return blocked;
}
