"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startPortalAuthRuntime, stopPortalAuthRuntime } from "@/lib/integrate/auth/runtime";
import { getPortalPath } from "@/lib/integrate/auth/routes";
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
      router.replace("/login");
      return undefined;
    }

    if (user.role !== role) {
      setBlocked(true);
      router.replace(getPortalPath(user.role));
      return undefined;
    }

    setBlocked(false);
    startPortalAuthRuntime(role);
    return undefined;
  }, [role, router]);

  useEffect(() => {
    function handleAuthLogout() {
      stopPortalAuthRuntime();
      setBlocked(true);
      router.replace("/login");
    }

    window.addEventListener("hols-auth-logout", handleAuthLogout);
    return () => window.removeEventListener("hols-auth-logout", handleAuthLogout);
  }, [router]);

  if (blocked) return null;

  return children;
}
