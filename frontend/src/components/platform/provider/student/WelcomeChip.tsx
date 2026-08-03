"use client";

import {
  avatarSrcFromUser,
  displayNameFromUser,
  initialsFor,
  useStoredUser,
} from "@/lib/integrate/auth/useStoredUser";
import { cn } from "@/lib/utils";

type WelcomeChipProps = {
  className?: string;
  /** Shown before hydration and when the stored user has no name. */
  fallbackName?: string;
};

/** Hydration-safe welcome chip — initials first, then stored photo/name after mount. */
export function WelcomeChip({ className, fallbackName = "Student" }: WelcomeChipProps) {
  const { user, ready } = useStoredUser();
  const name = ready ? displayNameFromUser(user, fallbackName) : fallbackName;
  const photo = ready ? avatarSrcFromUser(user) : undefined;
  const initials = initialsFor(name);

  return (
    <span
      className={cn(
        "dashboard-welcome-chip flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-1.5 sm:gap-2.5 sm:pr-3.5",
        className,
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DDE466] text-brand-caption font-semibold text-[#152744]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <span className="hidden max-w-[9rem] flex-col leading-tight sm:flex md:max-w-[12rem]">
        <span className="text-[11px] font-medium text-[color:var(--dash-muted)]">Welcome back,</span>
        <span className="font-sans truncate text-sm font-semibold text-[color:var(--dash-text)]">
          {name}
        </span>
      </span>
    </span>
  );
}
