import Link from "next/link";
import { brand } from "@/config/brand";
import { mainNav } from "@/content/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { NavbarMobile } from "@/components/layout/NavbarMobile";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-sans text-sm font-semibold tracking-tight text-primary md:text-base"
        >
          {brand.name}
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/login" variant="ghost" className="px-4 py-2">
            Log in
          </Button>
          <Button href="/contact" variant="primary" className="px-5 py-2">
            Get Started
          </Button>
        </div>

        <NavbarMobile />
      </Container>
    </header>
  );
}
