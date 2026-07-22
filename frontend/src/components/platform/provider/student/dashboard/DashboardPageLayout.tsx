"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type DashboardPageLayoutProps = {
  displayName: string;
  children: React.ReactNode;
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardPageLayout({ displayName, children }: DashboardPageLayoutProps) {
  const initials = initialsFor(displayName) || "S";

  return (
    <PortalShell role="student" title="Dashboard" showPageHeader={false} nav={studentNav}>
      <div className="dashboard-screen">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
            Dashboard
          </h1>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Settings"
              className="dashboard-icon-btn flex h-9 w-9 items-center justify-center rounded-full"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Notifications"
              className="dashboard-icon-btn flex h-9 w-9 items-center justify-center rounded-full"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <span className="dashboard-welcome-chip flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DDE466] text-brand-caption font-semibold text-[#152744]">
                {initials}
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-[11px] text-[color:var(--dash-faint)]">Welcome back,</span>
                <span className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">{displayName}</span>
              </span>
            </span>
          </div>
        </header>

        <div className="grid w-full gap-4 lg:grid-cols-[1.9fr_1fr]">{children}</div>
      </div>
    </PortalShell>
  );
}
