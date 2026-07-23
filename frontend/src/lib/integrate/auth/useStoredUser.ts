"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/integrate/auth/storage";
import type { StoredUser } from "@/lib/integrate/auth/types";

/** Reads localStorage only after mount to avoid SSR/client hydration mismatches. */
export function useStoredUser() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setReady(true);
  }, []);

  return { user, ready };
}

export function displayNameFromUser(user: StoredUser | null, fallback = "Student") {
  const firstName = typeof user?.profile?.first_name === "string" ? user.profile.first_name : "";
  const lastName = typeof user?.profile?.last_name === "string" ? user.profile.last_name : "";
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || fallback;
}

export function avatarSrcFromUser(user: StoredUser | null) {
  return typeof user?.profile?.profile_pic === "string" ? user.profile.profile_pic : undefined;
}

export function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "S"
  );
}
