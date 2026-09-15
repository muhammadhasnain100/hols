"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarSvgIcon, type SidebarIconName } from "@/components/platform/provider/sidebar-icons";
import { cn } from "@/lib/utils";

type PaymentSubnavLink = {
  href: string;
  label: string;
  shortLabel: string;
  exact?: boolean;
  icon: SidebarIconName;
};

const LINKS: readonly PaymentSubnavLink[] = [
  {
    href: "/student/payment",
    label: "Membership",
    shortLabel: "Plans",
    exact: true,
    icon: "star",
  },
  {
    href: "/student/payment/orders",
    label: "Orders",
    shortLabel: "Orders",
    icon: "orders",
  },
  {
    href: "/student/payment/card",
    label: "Payment card",
    shortLabel: "Card",
    icon: "payment",
  },
];

export function PaymentSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Payment sections"
      className="flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-2.5 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
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
              "font-sans inline-flex min-h-9 shrink-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium tracking-[0.01em] transition sm:min-h-10 sm:flex-none sm:gap-2 sm:px-4 sm:text-sm",
              active
                ? "bg-[#DDE466] text-[#152744]"
                : "border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-[color:var(--dash-text)] hover:border-[#DDE466]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <SidebarSvgIcon
              name={link.icon}
              size={15}
              strokeWidth={1.9}
              className={active ? "text-[#152744]" : "text-[color:var(--dash-muted)]"}
            />
            <span className="sm:hidden">{link.shortLabel}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
