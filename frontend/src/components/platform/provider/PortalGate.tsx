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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    let readyTimer: number | null = null;

    if (!user) {
      stopPortalAuthRuntime();
      router.replace("/login");
      return undefined;
    }

    if (user.role !== role) {
      router.replace(getPortalPath(user.role));
      return undefined;
    }

    startPortalAuthRuntime(role);
    readyTimer = window.setTimeout(() => setReady(true), 0);
    return () => {
      if (readyTimer) window.clearTimeout(readyTimer);
    };
  }, [role, router]);

  useEffect(() => {
    function handleAuthLogout() {
      stopPortalAuthRuntime();
      router.replace("/login");
    }

    window.addEventListener("hols-auth-logout", handleAuthLogout);
    return () => window.removeEventListener("hols-auth-logout", handleAuthLogout);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-gradient-science-haze">
        <div className="glass-panel rounded-3xl px-8 py-10 text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-accent/40" />
          <p className="mt-4 text-sm text-muted">Loading portal…</p>
        </div>
      </div>
    );
  }

  return children;
}
