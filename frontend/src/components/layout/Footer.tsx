"use client";

import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "@/components/brand/Logo";
import { footerNav } from "@/content/navigation";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-sans text-sm font-semibold text-primary">{children}</h3>
  );
}

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="font-sans text-sm leading-relaxed text-primary/65 transition-colors duration-200 hover:text-primary"
    >
      {children}
    </Link>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-primary/8 bg-[#F4F5F7] text-primary">
      <div className="w-full px-5 py-14 md:px-8 md:py-16 lg:px-10 lg:py-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-10">
          {/* Brand — left */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Logo variant="dark" className="h-9 md:h-10" />
            <p className="font-body mt-6 max-w-sm text-xs leading-relaxed text-primary/55 md:text-[0.8rem] md:leading-[1.55]">
              {footerNav.disclaimer}
            </p>
          </div>

          {/* Address & Contact */}
          <div>
            <FooterHeading>Address</FooterHeading>
            <p className="font-sans mt-4 space-y-0.5 text-sm leading-relaxed text-primary/65">
              {footerNav.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>

            <div className="mt-8">
              <FooterHeading>Contact</FooterHeading>
              <div className="mt-4 space-y-2">
                <div>
                  <FooterLink href={`mailto:${footerNav.contact.email}`}>
                    {footerNav.contact.email}
                  </FooterLink>
                </div>
                <div>
                  <FooterLink href={footerNav.contact.href}>Email us</FooterLink>
                </div>
              </div>
            </div>
          </div>

          {/* Community */}
          <div>
            <FooterHeading>Our Community</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              {footerNav.community.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <FooterHeading>Links</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Social + scroll */}
          <div className="flex flex-col justify-between gap-10">
            <div>
              <FooterHeading>Social</FooterHeading>
              <ul className="mt-4 space-y-2.5">
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
              className="font-sans self-start text-sm text-primary/65 transition-colors duration-200 hover:text-primary lg:self-end"
            >
              Scroll to the top
            </button>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-primary/10 pt-8 md:mt-16 md:flex-row md:items-center md:justify-between">
          <p className="font-sans text-xs text-primary/45 md:text-sm">
            {brand.tagline}
          </p>
          <p className="font-sans text-xs text-primary/45 md:text-right md:text-sm">
            Copyright © {brand.name} {year}
          </p>
        </div>
      </div>

      <div
        className="h-3 w-full opacity-35"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(21,39,68,0.08) 10px, rgba(21,39,68,0.08) 11px), repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(21,39,68,0.08) 10px, rgba(21,39,68,0.08) 11px)",
          backgroundSize: "12px 12px",
        }}
        aria-hidden
      />
    </footer>
  );
}
