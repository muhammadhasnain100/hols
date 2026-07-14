"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/student/payment", label: "Membership", exact: true },
  { href: "/student/payment/orders", label: "Orders" },
  { href: "/student/payment/card", label: "Card" },
] as const;

export function PaymentSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Payment sections"
      className="flex flex-wrap gap-1 rounded-xl border border-black/[0.06] bg-white p-1"
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
              "rounded-lg px-3.5 py-2 text-[13px] font-medium transition",
              active
                ? "bg-primary text-white"
                : "text-primary/50 hover:bg-black/[0.03] hover:text-primary",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
