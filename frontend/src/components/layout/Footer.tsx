"use client";

import Link from "next/link";
import {
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type SVGProps,
} from "react";
import { HeroButton } from "@/components/hero/HeroButton";
import { Logo } from "@/components/brand/Logo";
import { brand } from "@/config/brand";
import { footerNav } from "@/content/navigation";
import { heroLayout } from "@/lib/hero-styles";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

/** Same surface as Six Pillars / FAQs — do not change */
const FOOTER_BG = "#E5E5E5";

type SocialLabel = (typeof footerNav.social)[number]["label"];

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
      { label: "Medical Disclaimer", href: "/legal/medical-disclaimer" },
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

const SOCIAL_COLORS: Record<SocialLabel, string> = {
  LinkedIn: "#0A66C2",
  Instagram: "#E1306C",
  Facebook: "#1877F2",
  YouTube: "#FF0000",
  TikTok: "#111111",
  X: "#111111",
};

function IconInstagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="footer-ig" x1="0" y1="24" x2="24" y2="0">
          <stop stopColor="#F58529" />
          <stop offset="0.4" stopColor="#DD2A7B" />
          <stop offset="0.7" stopColor="#8134AF" />
          <stop offset="1" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#footer-ig)" strokeWidth="1.85" />
      <circle cx="12" cy="12" r="4" stroke="url(#footer-ig)" strokeWidth="1.85" />
      <circle cx="17.5" cy="6.5" r="1.15" fill="url(#footer-ig)" />
    </svg>
  );
}

function IconFacebook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z" />
    </svg>
  );
}

function IconX(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.6 10.5 19.2 4h-1.6l-4.4 5.1L9.5 4H4.8l5.9 8.5L4.8 20h1.6l4.7-5.5L14.5 20h4.7l-6-9.5Zm-1.7 2-.5-.8-4.2-6h2l3.3 4.8.5.8 4.4 6.3h-2l-3.5-5.3Z" />
    </svg>
  );
}

function IconLinkedIn(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M6.5 9.5H4V20h2.5V9.5ZM5.2 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM20 20h-2.5v-5.6c0-1.5-.5-2.5-1.8-2.5-1 0-1.5.7-1.8 1.3-.1.3-.1.6-.1.9V20H11V9.5h2.4v1.4c.5-.8 1.4-1.8 3.3-1.8 2.4 0 4.2 1.6 4.2 5V20Z" />
    </svg>
  );
}

function IconYouTube(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M21.6 8.2a2.7 2.7 0 0 0-1.9-1.9C17.9 6 12 6 12 6s-5.9 0-7.7.3A2.7 2.7 0 0 0 2.4 8.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 3.8 2.7 2.7 0 0 0 1.9 1.9C6.1 18 12 18 12 18s5.9 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-3.8ZM10 14.8V9.2L15 12l-5 2.8Z" />
    </svg>
  );
}

function IconTikTok(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#25F4EE"
        d="M16.5 4c.4 1.8 1.6 3.2 3.4 3.7v2.4a6.6 6.6 0 0 1-3.4-1v6.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.6a3.1 3.1 0 1 0 2.2 3V4h2.6Z"
        opacity="0.85"
        transform="translate(-0.6 0.4)"
      />
      <path
        fill="#FE2C55"
        d="M16.5 4c.4 1.8 1.6 3.2 3.4 3.7v2.4a6.6 6.6 0 0 1-3.4-1v6.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.6a3.1 3.1 0 1 0 2.2 3V4h2.6Z"
        opacity="0.85"
        transform="translate(0.6 -0.4)"
      />
      <path
        fill="#111111"
        d="M16.5 4c.4 1.8 1.6 3.2 3.4 3.7v2.4a6.6 6.6 0 0 1-3.4-1v6.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.6a3.1 3.1 0 1 0 2.2 3V4h2.6Z"
      />
    </svg>
  );
}

const SOCIAL_ICONS: Record<
  SocialLabel,
  (props: SVGProps<SVGSVGElement>) => ReactNode
> = {
  Instagram: IconInstagram,
  Facebook: IconFacebook,
  X: IconX,
  LinkedIn: IconLinkedIn,
  YouTube: IconYouTube,
  TikTok: IconTikTok,
};

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-brand-caption font-semibold tracking-[0.01em] text-primary">
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
        "text-brand-body text-primary/70 transition-colors duration-200 hover:text-primary",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function SocialIconLink({
  href,
  label,
}: {
  href: string;
  label: SocialLabel;
}) {
  const Icon = SOCIAL_ICONS[label];
  const color = SOCIAL_COLORS[label];
  const isGradientBrand = label === "Instagram" || label === "TikTok";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white",
        "transition-all duration-200 hover:-translate-y-0.5",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
      )}
      style={isGradientBrand ? undefined : { color }}
    >
      <Icon className="h-[1.125rem] w-[1.125rem]" />
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
    <div className="w-full">
      <p className="text-brand-body text-primary/70">
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
          className="mt-4 flex w-full flex-col gap-2.5 sm:flex-row sm:items-center"
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
              "min-h-11 w-full min-w-0 flex-1 rounded-full border border-primary/12 bg-white px-4",
              "font-sans text-sm text-primary placeholder:text-primary/40",
              "outline-none transition-[border-color,box-shadow] duration-200",
              "focus:border-primary/30 focus:shadow-[0_0_0_3px_rgba(21,39,68,0.08)]",
            )}
          />
          <HeroButton
            type="submit"
            variant="primary"
            className="w-full shrink-0 focus-visible:outline-primary/40 sm:w-auto"
          >
            Subscribe
          </HeroButton>
        </form>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {footerNav.social.map((item) => (
          <SocialIconLink
            key={item.href}
            href={item.href}
            label={item.label}
          />
        ))}
      </div>
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
              <span className="text-brand-body cursor-default text-primary/70">
                {item.label}
              </span>
            ) : (
              <FooterLink
                href={item.href}
                external={item.external}
                className={
                  item.label.includes("@") ? "break-all" : undefined
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
      data-nav-surface="light"
      className="relative z-10 w-full text-primary"
      style={{ backgroundColor: FOOTER_BG }}
    >
      <div
        className={cn(
          "w-full py-10 sm:py-12 md:py-14 lg:py-16",
          heroLayout.gutterX,
        )}
      >
        {/* Brand block sits above the columns */}
        <div className="mb-10 max-w-md sm:mb-12 lg:mb-14">
          <Logo variant="dark" className="h-8 sm:h-9 md:h-10" />
          <p className="text-brand-body mt-3 max-w-sm text-primary/60 sm:mt-4">
            {footerNav.disclaimer}
          </p>
        </div>

        {/* Explore | Help | HOLS | Newsletter — evenly spread */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-8 xl:gap-x-12">
          {linkColumns.map((column) => (
            <LinkColumn
              key={column.title}
              title={column.title}
              links={column.links}
            />
          ))}

          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <NewsletterSignup />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-primary/10 pt-5 sm:mt-12 sm:pt-6 md:mt-14 md:flex-row md:items-center md:justify-between md:gap-6 md:pt-8">
          <p className="text-brand-caption text-primary/50">
            © {year} {brand.name}. All Rights Reserved
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footerNav.legal.map((item) => (
              <FooterLink
                key={item.href}
                href={item.href}
                className="text-brand-caption text-primary/70"
              >
                {item.label}
              </FooterLink>
            ))}
            <button
              type="button"
              onClick={scrollToTop}
              className={cn(
                "text-brand-caption text-primary/70 transition-colors duration-200",
                "hover:text-primary",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40",
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
