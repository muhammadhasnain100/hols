"use client";

import Link from "next/link";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { getStoredUser } from "@/lib/integrate/auth/storage";

type AdviserChatPageLayoutProps = {
  patientName: string;
  children: React.ReactNode;
};

function initialsFor(name: string) {
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

export function AdviserChatPageLayout({ patientName, children }: AdviserChatPageLayoutProps) {
  const user = getStoredUser();
  const firstName = typeof user?.profile?.first_name === "string" ? user.profile.first_name : "";
  const lastName = typeof user?.profile?.last_name === "string" ? user.profile.last_name : "";
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || "Student";
  const avatarSrc =
    typeof user?.profile?.profile_pic === "string" ? user.profile.profile_pic : undefined;

  return (
    <PortalShell
      role="student"
      title={patientName}
      showPageHeader={false}
      contentFlush
      nav={studentNav}
    >
      <div className="dashboard-screen">
        <header className="fixed inset-x-0 top-0 z-30 bg-transparent px-4 pt-6 md:px-6 lg:left-[var(--portal-sidebar-offset)] lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={() => window.dispatchEvent(new Event("hols-portal-open-sidebar"))}
                className="portal-header-icon rounded-full p-2 lg:hidden"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M4 7h16M4 12h10M4 17h16" />
                </svg>
              </button>
              <Link
                href="/student/adviser"
                aria-label="Back to patients"
                className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Link>
              <h1 className="font-sans truncate text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
                {patientName}
              </h1>
            </div>

            <span className="dashboard-welcome-chip flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#DDE466] text-brand-caption font-semibold text-[#152744]">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsFor(displayName)
                )}
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-[11px] text-[color:var(--dash-faint)]">Welcome back,</span>
                <span className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
                  {displayName}
                </span>
              </span>
            </span>
          </div>
        </header>

        {/* Keeps page content below the fixed header */}
        <div className="h-16" aria-hidden />

        {children}
      </div>
    </PortalShell>
  );
}
