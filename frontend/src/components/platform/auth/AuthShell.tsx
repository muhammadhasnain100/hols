import Link from "next/link";
import { HeroLogo } from "@/components/hero/HeroLogo";
import { authEyebrowClass, authSubtitleClass, authTitleClass } from "@/components/platform/auth/auth-styles";
import { brand } from "@/config/brand";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string;
  contentWidth?: "md" | "lg";
  className?: string;
};

export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
  contentWidth = "md",
  className,
}: AuthShellProps) {
  return (
    <div className={cn("relative min-h-svh bg-white lg:grid lg:grid-cols-2", className)}>
      <aside
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:px-12 lg:py-12 xl:px-16 xl:py-14"
        style={{ backgroundColor: brand.colors.primary.prussianBlue }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 14% 10%, ${brand.colors.accent.babyBlue}47, transparent 34%), radial-gradient(circle at 86% 18%, ${brand.colors.accent.lemonLime}2E, transparent 32%), radial-gradient(circle at 48% 86%, ${brand.colors.primary.duskBlue}33, transparent 42%)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(circle at 50% 36%, black, transparent 74%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 36%, black, transparent 74%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col">
          <Link href="/" className="inline-flex transition-opacity hover:opacity-90">
            <HeroLogo variant="light" className="h-10" linked={false} />
          </Link>

          <div className="flex flex-1 items-center justify-center py-12 xl:py-16">
            <div aria-hidden className="relative aspect-square w-full max-w-[500px]">
              <div className="absolute inset-3 rounded-full border border-white/10" />
              <div className="absolute inset-14 rounded-full border border-dashed border-accent/35" />
              <div
                aria-hidden
                className="absolute -bottom-5 right-2 h-40 w-40 rounded-full blur-3xl"
                style={{ backgroundColor: `${brand.colors.accent.lemonLime}26` }}
              />
              <div
                aria-hidden
                className="absolute -top-3 left-8 h-32 w-32 rounded-full blur-2xl"
                style={{ backgroundColor: `${brand.colors.accent.babyBlue}1A` }}
              />

              <img
                src="/assets/hols-auth-illustration.svg"
                alt=""
                aria-hidden="true"
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_34px_90px_rgba(0,0,0,0.28)]"
              />
            </div>
          </div>

          <div className="mt-auto h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </aside>

      <section className="relative flex min-h-svh flex-col overflow-hidden bg-white">
        <header className={cn("relative z-10 flex items-center justify-between py-5", heroLayout.gutterX, "lg:px-10")}>
          <Link href="/" className="inline-flex lg:hidden">
            <HeroLogo variant="dark" className="h-8" linked={false} />
          </Link>
          <Link
            href="/"
            className="text-brand-caption ml-auto inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-2 font-medium text-primary/75 transition hover:bg-primary/[0.03] hover:text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to site
          </Link>
        </header>

        <div className={cn("relative z-10 flex flex-1 flex-col justify-center pb-12 pt-4", heroLayout.gutterX, "lg:px-10 xl:px-16")}>
          <div
            className={cn(
              "mx-auto w-full",
              contentWidth === "lg" ? "max-w-xl" : "max-w-md",
            )}
          >
            <div className="mb-8">
              <p className={authEyebrowClass}>{eyebrow}</p>
              <h1 className={cn("mt-3", authTitleClass)}>{title}</h1>
              {subtitle ? <p className={authSubtitleClass}>{subtitle}</p> : null}
            </div>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
