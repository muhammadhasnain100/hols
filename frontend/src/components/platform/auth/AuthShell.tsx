import Link from "next/link";
import { HeroLogo } from "@/components/hero/HeroLogo";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

const AUTH_HIGHLIGHTS = [
  {
    title: "Expert-led training",
    body: "Onboard your team to a shared clinical standard.",
  },
  {
    title: "Dosing tools",
    body: "Precise reconstitution and protocol math, built in.",
  },
  {
    title: "Patient documents",
    body: "Branded handouts and consents ready to use.",
  },
] as const;

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
  const { hero, trustStrip } = landingContent;

  return (
    <div className={cn("relative min-h-svh lg:grid lg:grid-cols-2", className)}>
      <aside className="relative hidden overflow-hidden bg-[#142644] text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-16 xl:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 0%, rgba(255,255,255,0.10), transparent 42%), radial-gradient(circle at 88% 18%, rgba(190,242,100,0.14), transparent 38%), radial-gradient(circle at 50% 100%, rgba(141,195,225,0.12), transparent 45%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(circle at 40% 30%, black, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle at 40% 30%, black, transparent 72%)",
          }}
        />

        <div className="relative">
          <Link href="/" className="inline-flex transition-opacity hover:opacity-90">
            <HeroLogo variant="light" className="h-10" linked={false} />
          </Link>

          <div className="mt-16 max-w-md xl:mt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              House of Life Sciences
            </span>
            <h1 className="mt-6 font-serif text-3xl leading-[1.12] text-white xl:text-4xl">
              {hero.headline}
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-white/70 xl:text-base">
              {hero.subhead}
            </p>
          </div>

          <ul className="mt-12 max-w-md space-y-4">
            {AUTH_HIGHLIGHTS.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <div>
                  <p className="font-sans text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6">
          {trustStrip.map((item) => (
            <span key={item} className="flex items-center gap-2 font-sans text-xs text-white/55">
              <svg
                className="h-3.5 w-3.5 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {item}
            </span>
          ))}
        </div>
      </aside>

      <section className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-science-haze">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% -10%, rgba(141,195,225,0.35), transparent 40%), radial-gradient(circle at 10% 90%, rgba(190,242,100,0.12), transparent 35%)",
          }}
        />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-8 lg:px-10">
          <Link href="/" className="inline-flex lg:hidden">
            <HeroLogo variant="dark" className="h-8" linked={false} />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/70 px-4 py-2 text-sm font-medium text-primary backdrop-blur transition hover:bg-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to site
          </Link>
        </header>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-5 pb-12 pt-4 md:px-8 lg:px-10 xl:px-16">
          <div
            className={cn(
              "mx-auto w-full",
              contentWidth === "lg" ? "max-w-xl" : "max-w-md",
            )}
          >
            <div className="mb-8">
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-primary/50">
                {eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-primary md:text-[2.35rem]">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{subtitle}</p>
              ) : null}
            </div>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
