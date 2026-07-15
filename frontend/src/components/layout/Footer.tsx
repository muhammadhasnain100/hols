import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "@/components/brand/Logo";
import { footerNav } from "@/content/navigation";
import { Container } from "@/components/ui/Container";

type SocialLabel = (typeof footerNav.social)[number]["label"];

function SocialIcon({ label }: { label: SocialLabel }) {
  const className = "h-4 w-4 shrink-0";

  switch (label) {
    case "LinkedIn":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.35 8.25h4.3V24H.35V8.25ZM8.17 8.25h4.12v2.16h.06c.57-1.08 1.98-2.22 4.07-2.22 4.35 0 5.16 2.86 5.16 6.58V24h-4.3v-8.18c0-1.95-.04-4.46-2.72-4.46-2.72 0-3.14 2.13-3.14 4.32V24H8.17V8.25Z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "Facebook":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M14.2 8.3V6.6c0-.8.54-1 1.03-1H18V1.1L14.2 1C10.08 1 9.15 4.08 9.15 6.05V8.3H6v4.65h3.15V23h5.05V12.95h3.42l.55-4.65H14.2Z" />
        </svg>
      );
    case "YouTube":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.52 3.58 12 3.58 12 3.58s-7.52 0-9.4.5A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.88.5 9.4.5 9.4.5s7.52 0 9.4-.5a3 3 0 0 0 2.1-2.12c.5-1.88.5-5.8.5-5.8s0-3.92-.5-5.8ZM9.6 15.55v-7.1L15.85 12 9.6 15.55Z" />
        </svg>
      );
    case "TikTok":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16.6 1.5c.33 2.83 1.92 4.52 4.7 4.7v4.03a8.03 8.03 0 0 1-4.63-1.45v6.95c0 4.43-2.76 6.77-6.46 6.77-3.48 0-6.13-2.42-6.13-5.86 0-3.77 2.9-6.17 6.95-5.9v4.1c-1.56-.24-2.86.49-2.86 1.8 0 1.08.86 1.78 1.96 1.78 1.28 0 2.2-.74 2.2-2.68V1.5h4.27Z" />
        </svg>
      );
    case "X":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.9 2h3.42l-7.47 8.54L23.64 22h-6.88l-5.38-7.04L5.2 22H1.78l7.99-9.13L1.34 2h7.05l4.87 6.43L18.9 2Zm-1.2 17.98h1.9L7.35 3.91H5.31l12.38 16.07Z" />
        </svg>
      );
  }
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <Container className="py-20 md:py-24 lg:py-28">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:justify-between lg:gap-20">
          <div className="max-w-md">
            <Logo variant="light" className="h-12 md:h-14" />
            <p className="mt-6 font-sans text-lg font-semibold text-white md:text-xl">
              {brand.name}
            </p>
            <p className="mt-3 text-base leading-relaxed text-white/65 md:text-lg md:leading-relaxed">
              {brand.description}
            </p>
          </div>

          <div className="grid flex-1 gap-12 sm:grid-cols-2 sm:gap-14 lg:grid-cols-[minmax(120px,0.8fr)_minmax(120px,0.8fr)_minmax(260px,1.4fr)] lg:gap-16 lg:pl-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                Explore
              </p>
              <ul className="mt-6 space-y-4">
                {footerNav.main.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-base text-white/85 transition-colors hover:text-accent md:text-lg"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                Legal
              </p>
              <ul className="mt-6 space-y-4">
                {footerNav.legal.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-base text-white/85 transition-colors hover:text-accent md:text-lg"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <p className="text-base text-white/70 md:text-lg">
                Practical insights for your clinic.
              </p>
              <form className="mt-6 grid gap-3" action="#" method="post">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  className="w-full rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-base text-white placeholder:text-white/45 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40 md:py-4"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-accent px-8 py-3.5 text-base font-medium text-primary transition-opacity hover:opacity-90 md:py-4"
                >
                  Join
                </button>
              </form>

              <div className="mt-10">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                  Social
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {footerNav.social.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-accent/35 hover:bg-accent/10 hover:text-accent"
                    >
                      <SocialIcon label={item.label} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-10 text-sm text-white/50 md:mt-20 md:pt-12 md:text-base lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="text-white/40">
            {brand.name} · {footerNav.main.map((l) => l.label).join(" · ")} · Legal ·
            Newsletter · Social
          </p>
        </div>
      </Container>
    </footer>
  );
}
