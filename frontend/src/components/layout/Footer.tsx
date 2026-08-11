"use client";

import Link from "next/link";
import {
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { HeroButton } from "@/components/hero/HeroButton";
import { Logo } from "@/components/brand/Logo";
import { brand } from "@/config/brand";
import { footerNav } from "@/content/navigation";
import { heroLayout } from "@/lib/hero-styles";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

/** Brand Prussian Blue — continuous with Final CTA above */
const FOOTER_BG = brand.colors.primary.prussianBlue;

type FooterItem = {
  label: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
};

const linkColumns: Array<{ title: string; links: FooterItem[] }> = [
  {
    title: "Explore",
    links: [
      { label: "Features", href: "/#everything-inside" },
      { label: "Who it's for", href: "/#who-its-for" },
      { label: "Get Started", href: "/register" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    title: "Help",
    links: [
      {
        label: footerNav.contact.email,
        href: footerNav.contact.href,
        external: true,
      },
      { label: "FAQs", href: "/#faqs" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
    ],
  },
  {
    title: "HOLS",
    links: [
      { label: "House of Life Sciences", href: "/" },
      { label: "Clinical Education", href: "/#everything-inside" },
      { label: "Built on precision", disabled: true },
    ],
  },
];

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-sans text-base font-bold leading-tight tracking-[0.01em] text-white sm:text-lg">
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
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const { lenis } = useSmoothScroll();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (external || href === "#") {
      if (href === "#") event.preventDefault();
      return;
    }

    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;

    const path = href.slice(0, hashIndex) || "/";
    const id = href.slice(hashIndex + 1);
    if (!id) return;

    const onHome =
      path === "/" &&
      (window.location.pathname === "/" || window.location.pathname === "");

    if (!onHome) return;

    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: 0 });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Link
      href={href === "#" ? "/" : href}
      onClick={handleClick}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={cn(
        "text-brand-body text-white/70 transition-colors duration-200 hover:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "done">("idle");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("done");
    setEmail("");
  };

  return (
    <div className="w-full min-w-0">
      <FooterHeading>Newsletter</FooterHeading>
      <p className="text-brand-body mt-3 text-white/70 sm:mt-4">
        Get clinical updates and product news from HOLS.
      </p>

      {status === "done" ? (
        <p
          className="mt-4 rounded-full bg-accent px-4 py-3 text-center text-brand-caption font-semibold text-primary"
          role="status"
        >
          Thanks — you’re on the list.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-4 flex w-full flex-col gap-2.5 xl:flex-row xl:items-center"
        >
          <label className="sr-only" htmlFor="footer-newsletter-email">
            Email address
          </label>
          <input
            id="footer-newsletter-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your Email Address"
            className={cn(
              "min-h-11 w-full min-w-0 flex-1 rounded-full border border-white/15 bg-white/95 px-4",
              "font-sans text-sm text-primary placeholder:text-primary/40",
              "outline-none transition-[border-color,box-shadow] duration-200",
              "focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(221,228,102,0.22)]",
            )}
          />
          <HeroButton
            type="submit"
            variant="primary"
            className="w-full shrink-0 focus-visible:outline-accent/40 xl:w-auto"
          >
            Subscribe
          </HeroButton>
        </form>
      )}
    </div>
  );
}

function LinkColumn({ title, links }: { title: string; links: FooterItem[] }) {
  return (
    <div className="min-w-0">
      <FooterHeading>{title}</FooterHeading>
      <ul className="mt-3 space-y-2.5 sm:mt-4">
        {links.map((item) => (
          <li key={`${item.label}-${item.href ?? "text"}`} className="min-w-0">
            {item.disabled || !item.href ? (
              <span className="text-brand-body cursor-default text-white/70">
                {item.label}
              </span>
            ) : (
              <FooterLink
                href={item.href}
                external={item.external}
                className={
                  item.label.includes("@")
                    ? "break-all text-[0.9375rem] leading-snug"
                    : undefined
                }
              >
                {item.label}
              </FooterLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const { lenis } = useSmoothScroll();

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.1 });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer
      data-nav-surface="dark"
      className="relative z-10 w-full overflow-x-hidden text-white"
      style={{ backgroundColor: FOOTER_BG }}
    >
      <div
        className={cn(
          "w-full py-10 sm:py-12 md:py-14 lg:py-16",
          heroLayout.gutterX,
        )}
      >
        {/* Brand */}
        <div className="mb-8 max-w-md sm:mb-10 lg:mb-12">
          <Logo variant="light" className="h-8 sm:h-9 md:h-10" />
          <p className="text-brand-body mt-3 max-w-sm text-pretty text-white/65 sm:mt-4">
            {footerNav.disclaimer}
          </p>
        </div>

        {/*
          Mobile: 1 column (stack)
          sm: 2 columns — Explore | Help, HOLS | Newsletter
          md: 3 columns for links, newsletter full-width below
          lg+: 4 columns in one row
        */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 md:grid-cols-3 md:gap-x-8 lg:grid-cols-4 lg:gap-x-8 xl:gap-x-12">
          {linkColumns.map((column) => (
            <LinkColumn
              key={column.title}
              title={column.title}
              links={column.links}
            />
          ))}

          <div className="min-w-0 md:col-span-3 lg:col-span-1">
            <NewsletterSignup />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/12 pt-5 sm:mt-12 sm:pt-6 md:mt-14 md:flex-row md:items-center md:justify-between md:gap-6 md:pt-8">
          <p className="text-brand-caption text-white/50">
            © {year} {brand.name}. All Rights Reserved
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footerNav.legal.map((item) => (
              <FooterLink
                key={item.label}
                href={item.href}
                className="text-brand-caption text-white/70"
              >
                {item.label}
              </FooterLink>
            ))}
            <button
              type="button"
              onClick={scrollToTop}
              className={cn(
                "text-brand-caption text-white/70 transition-colors duration-200",
                "hover:text-white",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/40",
              )}
            >
              Scroll to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
