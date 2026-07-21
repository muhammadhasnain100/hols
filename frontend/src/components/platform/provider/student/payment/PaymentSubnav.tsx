"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { portalSubnavItemClass } from "@/components/platform/provider/portal-styles";
import { cn } from "@/lib/utils";

type PaymentSubnavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

const LINKS: readonly PaymentSubnavLink[] = [
  { href: "/student/payment", label: "Membership", exact: true },
  { href: "/student/payment/orders", label: "Orders" },
  { href: "/student/payment/card", label: "Payment card" },
];

export function PaymentSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Payment sections"
      className="flex flex-wrap gap-1.5 rounded-2xl bg-primary/[0.04] p-1.5"
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
              portalSubnavItemClass,
              "transition",
              active
                ? "bg-white text-primary shadow-[0_1px_3px_rgba(21,39,68,0.08)]"
                : "text-primary/50 hover:bg-white/70 hover:text-primary",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
