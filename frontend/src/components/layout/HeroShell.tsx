import { HeroBackground } from "@/components/hero/HeroBackground";
import { HeroNavbar } from "@/components/hero/HeroNavbar";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

type HeroShellProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  fullHeight?: boolean;
  contained?: boolean;
  variant?: "page" | "landing";
  backgroundVariant?: "sky" | "photo";
  navbarVariant?: "landing" | "overlay" | "page";
  showNavbar?: boolean;
};

export function HeroShell({
  children,
  className,
  contentClassName,
  fullHeight = false,
  contained = true,
  variant = "page",
  backgroundVariant = "sky",
  navbarVariant,
  showNavbar = true,
}: HeroShellProps) {
  const isLandingStyle = variant === "landing";
  const resolvedNavbarVariant =
    navbarVariant ?? (backgroundVariant === "photo" ? "overlay" : "landing");

  if (isLandingStyle) {
    return (
      <section
        className={cn(
          "relative overflow-hidden",
          fullHeight ? "min-h-svh" : "min-h-[52vh] md:min-h-[58vh]",
          className,
        )}
      >
        <HeroBackground variant={backgroundVariant} />
        {backgroundVariant === "photo" ? (
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(21,39,68,0.62)_0%,rgba(21,39,68,0.38)_42%,rgba(21,39,68,0.65)_100%)]"
            aria-hidden
          />
        ) : null}
        {showNavbar ? <HeroNavbar variant={resolvedNavbarVariant} /> : null}

        <div
          className={cn(
            "relative z-10 flex flex-col justify-center",
            fullHeight
              ? showNavbar
                ? "min-h-svh pt-28 pb-20 md:pt-32 md:pb-28"
                : "min-h-svh py-16 md:py-20"
              : showNavbar
                ? "min-h-[52vh] pt-28 pb-14 md:min-h-[58vh] md:pt-32 md:pb-16"
                : "min-h-[52vh] py-14 md:min-h-[58vh] md:py-16",
            contentClassName,
          )}
        >
          {contained ? <Container>{children}</Container> : children}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-science-haze",
        fullHeight && "min-h-svh",
        className,
      )}
    >
      {showNavbar ? <HeroNavbar variant="page" /> : null}

      <div
        className={cn(
          "relative",
          fullHeight
            ? showNavbar
              ? "flex min-h-svh flex-col justify-center pt-16 pb-20 md:pt-20 md:pb-28"
              : "flex min-h-svh flex-col justify-center py-16 md:py-20"
            : showNavbar
              ? "pt-24 pb-16 md:pt-28 md:pb-20"
              : "py-16 md:py-20",
          contentClassName,
        )}
      >
        {contained ? <Container>{children}</Container> : children}
      </div>
    </section>
  );
}
