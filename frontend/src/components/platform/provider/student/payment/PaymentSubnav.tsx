"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, CreditCard, Icon, Star } from "@/components/icons";
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
    icon: <Icon icon={Star} size={16} />,
  },
  {
    href: "/student/payment/orders",
    label: "Orders",
    shortLabel: "Orders",
    icon: <Icon icon={ClipboardList} size={16} />,
  },
  {
    href: "/student/payment/card",
    label: "Payment card",
    shortLabel: "Card",
    icon: <Icon icon={CreditCard} size={16} />,
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
