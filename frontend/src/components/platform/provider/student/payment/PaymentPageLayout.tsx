"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PaymentSubnav } from "@/components/platform/provider/student/payment/PaymentSubnav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { getStoredUser } from "@/lib/integrate/auth/storage";

type PaymentPageLayoutProps = {
  title: string;
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

export function PaymentPageLayout({ title, children }: PaymentPageLayoutProps) {
  const user = getStoredUser();
  const firstName = typeof user?.profile?.first_name === "string" ? user.profile.first_name : "";
  const lastName = typeof user?.profile?.last_name === "string" ? user.profile.last_name : "";
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || "Student";
  const avatarSrc =
    typeof user?.profile?.profile_pic === "string" ? user.profile.profile_pic : undefined;

  return (
    <PortalShell role="student" title={title} showPageHeader={false} nav={studentNav}>
      <div className="dashboard-screen">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
            {title}
          </h1>

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
        </header>

        <div className="mb-4">
          <PaymentSubnav />
        </div>

        <div className="grid w-full gap-4">{children}</div>
      </div>
    </PortalShell>
  );
}
