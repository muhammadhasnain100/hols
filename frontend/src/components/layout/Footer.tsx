import Link from "next/link";
import { brand } from "@/config/brand";
import { footerNav } from "@/content/navigation";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-primary text-white">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-sans text-lg font-semibold">{brand.name}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              {brand.description}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {footerNav.main.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/80 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Legal
            </p>
            <ul className="mt-4 space-y-3">
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/80 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Newsletter</p>
            <p className="mt-1 text-sm text-white/70">
              Practical insights for your clinic.
            </p>
          </div>

          <div className="flex gap-4">
            {footerNav.social.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-white/50">
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
