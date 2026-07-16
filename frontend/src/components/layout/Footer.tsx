import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { footerNav } from "@/content/navigation";
import { Container } from "@/components/ui/Container";

type SocialLabel = (typeof footerNav.social)[number]["label"];

const socialBrand: Record<
  SocialLabel,
  { color?: string; gradient?: string; label: string }
> = {
  LinkedIn: { color: "#0A66C2", label: "LinkedIn" },
  Instagram: {
    gradient: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    label: "Instagram",
  },
  Facebook: { color: "#1877F2", label: "Facebook" },
  YouTube: { color: "#FF0000", label: "YouTube" },
  TikTok: { color: "#69C9D0", label: "TikTok" },
  X: { color: "#FFFFFF", label: "X" },
};

function SocialIcon({ label }: { label: SocialLabel }) {
  const className = "h-[18px] w-[18px]";

  switch (label) {
    case "LinkedIn":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1-.004-4.125 2.062 2.062 0 0 1 .004 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      );
    case "Facebook":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
        </svg>
      );
    case "YouTube":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "TikTok":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.03-1.49.26 0 .51 0 .77.02 1.35.07 2.71-.16 3.9-.84 1.03-.58 1.86-1.54 2.27-2.66.18-.5.27-1.03.29-1.56.02-3.71.01-7.42.02-11.13z" />
        </svg>
      );
    case "X":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
  }
}

function SocialLink({ href, label }: { href: string; label: SocialLabel }) {
  const style = socialBrand[label];
  const isX = label === "X";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={style.label}
      title={style.label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg"
      style={
        style.gradient
          ? { background: style.gradient, color: "#FFFFFF" }
          : {
              backgroundColor: isX ? "#141414" : style.color,
              color: "#FFFFFF",
              border: isX ? "1px solid rgba(255,255,255,0.14)" : undefined,
            }
      }
    >
      <SocialIcon label={label} />
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <Container className="pt-24 pb-10 md:pt-28 md:pb-12 lg:pt-32">
        {/* Main content — taller professional layout */}
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* Brand column */}
          <div className="lg:col-span-5">
            <Logo variant="light" className="h-11 md:h-12" />
            {/* Google Sans Semibold */}
            <p className="font-sans mt-8 text-xl font-semibold tracking-[0.01em] text-white md:text-2xl">
              {brand.name}
            </p>
            {/* Body · Gilroy Light · 18px */}
            <p className="font-body text-brand-body mt-5 max-w-md text-white/55">
              {brand.description}
            </p>

            <div className="mt-10">
              <p className="text-brand-caption text-white/40">Follow us</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {footerNav.social.map((item) => (
                  <SocialLink key={item.href} href={item.href} label={item.label} />
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:gap-8 xl:gap-12">
            <div>
              <h3 className="text-brand-caption font-medium text-white">Explore</h3>
              <ul className="mt-6 space-y-4">
                {footerNav.main.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-sans text-base font-medium tracking-[0.01em] text-white/55 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-brand-caption font-medium text-white">Legal</h3>
              <ul className="mt-6 space-y-4">
                {footerNav.legal.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-sans text-base font-medium tracking-[0.01em] text-white/55 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-brand-caption font-medium text-white">Newsletter</h3>
              <p className="font-body text-brand-body mt-6 text-white/50">
                Practical insights for your clinic. No spam.
              </p>
              <form className="mt-6 space-y-3" action="#" method="post">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  className="font-body h-12 w-full rounded-lg border border-white/12 bg-white/[0.04] px-4 text-base font-light tracking-[0.02em] text-white placeholder:text-white/35 outline-none focus:border-white/25"
                />
                {/* Same Button component as hero / other sections */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center rounded-lg"
                >
                  Join
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 flex flex-col gap-4 border-t border-white/10 pt-8 md:mt-24 md:flex-row md:items-center md:justify-between md:pt-10">
          <p className="text-brand-caption text-white/40">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="text-brand-caption text-white/30">{brand.tagline}</p>
        </div>
      </Container>
    </footer>
  );
}
