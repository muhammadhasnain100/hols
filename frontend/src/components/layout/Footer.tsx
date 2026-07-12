import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "@/components/brand/Logo";
import { footerNav } from "@/content/navigation";
import { Container } from "@/components/ui/Container";

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

          <div className="grid flex-1 gap-12 sm:grid-cols-2 sm:gap-14 lg:grid-cols-3 lg:gap-16 lg:pl-16">
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
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                Newsletter
              </p>
              <p className="mt-6 text-base text-white/70 md:text-lg">
                Practical insights for your clinic.
              </p>
              <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-3" action="#" method="post">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="you@clinic.com"
                  className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-base text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40 md:py-4"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-accent px-8 py-3.5 text-base font-medium text-primary transition-opacity hover:opacity-90 md:py-4"
                >
                  Join
                </button>
              </form>

              <div className="mt-10">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                  Social
                </p>
                <div className="mt-5 flex flex-wrap gap-6">
                  {footerNav.social.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-white/80 transition-colors hover:text-accent md:text-lg"
                    >
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
