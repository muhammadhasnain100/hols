"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== role) {
      router.replace(getPortalPath(user.role));
      return;
    }

    setReady(true);
  }, [role, router]);

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
