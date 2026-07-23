"use client";

import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "@/components/brand/Logo";
import { footerNav } from "@/content/navigation";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-primary">
      {children}
    </h3>
  );
}

function FooterLink({
  href,
  children,
  external = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={cn(
        "text-brand-body text-primary/70 transition-colors duration-200 hover:text-primary",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      data-nav-surface="light"
      className="relative w-full overflow-hidden bg-[#F4F5F7] text-primary"
    >
      <div
        className={cn(
          "relative w-full py-10 sm:py-12 md:py-14 lg:py-16",
          heroLayout.gutterX,
        )}
      >
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-6 lg:gap-x-10">
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Logo variant="dark" className="h-8 sm:h-9 md:h-10" />
            <p className="text-brand-body mt-4 max-w-sm text-primary/65 sm:mt-5 md:mt-6">
              {footerNav.disclaimer}
            </p>
          </div>

          <div className="min-w-0">
            <FooterHeading>Address</FooterHeading>
            <p className="text-brand-body mt-3 space-y-0.5 text-primary/70 sm:mt-4">
              {footerNav.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>

            <div className="mt-6 sm:mt-8">
              <FooterHeading>Contact</FooterHeading>
              <div className="mt-3 space-y-2 sm:mt-4">
                <div className="min-w-0">
                  <FooterLink
                    href={`mailto:${footerNav.contact.email}`}
                    className="break-all"
                  >
                    {footerNav.contact.email}
                  </FooterLink>
                </div>
                <div>
                  <FooterLink href={footerNav.contact.href}>Email us</FooterLink>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <FooterHeading>Our Community</FooterHeading>
            <ul className="mt-3 space-y-2.5 sm:mt-4">
              {footerNav.community.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <FooterHeading>Links</FooterHeading>
            <ul className="mt-3 space-y-2.5 sm:mt-4">
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-8 sm:gap-10">
            <div>
              <FooterHeading>Social</FooterHeading>
              <ul className="mt-3 space-y-2.5 sm:mt-4">
                {footerNav.social.slice(0, 4).map((item) => (
                  <li key={item.href}>
                    <FooterLink href={item.href} external>
                      {item.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-brand-caption self-start py-1 text-primary/70 transition-colors duration-200 hover:text-primary lg:self-end"
            >
              Scroll to the top
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-primary/10 pt-5 sm:mt-12 sm:gap-3 sm:pt-6 md:mt-14 md:flex-row md:items-center md:justify-between md:pt-8">
          <p className="text-brand-caption text-primary/50">{brand.tagline}</p>
          <p className="text-brand-caption text-primary/50 md:text-right">
            Copyright © {brand.name} {year}
          </p>
        </div>
      </div>
    </footer>
  );
}
