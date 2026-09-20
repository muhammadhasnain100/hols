"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startPortalAuthRuntime, stopPortalAuthRuntime } from "@/lib/integrate/auth/runtime";
import { getLoginPath, getPortalPath } from "@/lib/integrate/auth/routes";
import { getStoredUser } from "@/lib/integrate/auth/storage";
import type { UserRole } from "@/lib/integrate/auth/types";

type PortalGateProps = {
  role: UserRole;
  children: React.ReactNode;
};

export function PortalGate({ role, children }: PortalGateProps) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      stopPortalAuthRuntime();
      setBlocked(true);
      router.replace(getLoginPath(role));
      return undefined;
    }

    if (user.role !== role) {
      setBlocked(true);
      router.replace(getPortalPath(user.role));
      return undefined;
    }

    function onPopState() {
      const current = getStoredUser();
      if (!current) return;
      const path = window.location.pathname;
      if (path === "/login" || path.startsWith("/login/") || path === "/register") {
        router.replace(getPortalPath(current.role));
      }
    }

    setBlocked(false);
    startPortalAuthRuntime(role);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [role, router]);

  useEffect(() => {
    function handleAuthLogout() {
      stopPortalAuthRuntime();
      setBlocked(true);
      router.replace(getLoginPath(role));
    }

    window.addEventListener("hols-auth-logout", handleAuthLogout);
    return () => window.removeEventListener("hols-auth-logout", handleAuthLogout);
  }, [role, router]);

  if (blocked) return null;

  return children;
}
