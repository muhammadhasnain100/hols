"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/content/navigation";
import { getNavCapsuleLinkClassName, navCapsuleSizes } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

export function HeroNavCapsule() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={cn("nav-capsule-inner flex items-center", navCapsuleSizes.container)}
    >
      {mainNav.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={getNavCapsuleLinkClassName(isActive)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
