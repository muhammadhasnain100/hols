"use client";

import Link from "next/link";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { MEMBERSHIP_PLANS_HREF } from "@/lib/integrate/provider/student/payment/membershipAccess";
import { cn } from "@/lib/utils";

const lockButtonClass =
  "dashboard-navy-btn font-sans inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white sm:min-h-10";

type MembershipLockedButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
};

export function MembershipLockedButton({
  children,
  className,
  href = MEMBERSHIP_PLANS_HREF,
}: MembershipLockedButtonProps) {
  return (
    <Link href={href} className={cn(lockButtonClass, className)} aria-label="Membership required">
      <SidebarSvgIcon name="lock" size={15} strokeWidth={2.1} />
      {children}
    </Link>
  );
}

type MembershipLockedPanelProps = {
  title: string;
  description: string;
  actionLabel?: string;
};

export function MembershipLockedPanel({
  title,
  description,
  actionLabel = "View membership plans",
}: MembershipLockedPanelProps) {
  return (
    <div className="dashboard-surface rounded-xl p-8 text-center sm:p-10">
      <span className="dashboard-tool-icon mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--dash-text)]">
        <SidebarSvgIcon name="lock" size={22} strokeWidth={1.85} />
      </span>
      <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)] sm:text-lg">
        {title}
      </p>
      <p className="text-brand-body mt-1.5 mx-auto max-w-md text-[color:var(--dash-muted)]">
        {description}
      </p>
      <MembershipLockedButton className="mt-5 w-full sm:w-auto">{actionLabel}</MembershipLockedButton>
    </div>
  );
}
