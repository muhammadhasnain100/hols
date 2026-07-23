"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type PaymentSubnavLink = {
  href: string;
  label: string;
  shortLabel: string;
  exact?: boolean;
  icon: React.ReactNode;
};

const LINKS: readonly PaymentSubnavLink[] = [
  {
    href: "/student/payment",
    label: "Membership",
    shortLabel: "Plans",
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    href: "/student/payment/orders",
    label: "Orders",
    shortLabel: "Orders",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: "/student/payment/card",
    label: "Payment card",
    shortLabel: "Card",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
];

export function PaymentSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Payment sections"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "font-sans inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-medium tracking-[0.01em] transition sm:gap-2 sm:px-4",
              "flex-1 sm:flex-none",
              active
                ? "bg-[#DDE466] text-[#152744]"
                : "dashboard-pill-soft text-[color:var(--dash-text)] hover:brightness-[0.98]",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center",
                active ? "text-[#152744]" : "text-[color:var(--dash-muted)]",
              )}
            >
              {link.icon}
            </span>
            <span className="sm:hidden">{link.shortLabel}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
