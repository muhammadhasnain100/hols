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
};

export function HeroShell({
  children,
  className,
  contentClassName,
  fullHeight = false,
  contained = true,
  variant = "page",
}: HeroShellProps) {
  const isLandingStyle = variant === "landing";

  if (isLandingStyle) {
    return (
      <section
        className={cn(
          "relative overflow-hidden",
          fullHeight ? "min-h-svh" : "min-h-[52vh] md:min-h-[58vh]",
          className,
        )}
      >
        <HeroBackground />
        <HeroNavbar variant="landing" />

        <div
          className={cn(
            "relative z-10 flex flex-col justify-center",
            fullHeight ? "min-h-svh pt-28 pb-20 md:pt-32 md:pb-28" : "min-h-[52vh] pt-28 pb-14 md:min-h-[58vh] md:pt-32 md:pb-16",
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
      <HeroNavbar variant="page" />

      <div
        className={cn(
          "relative",
          fullHeight
            ? "flex min-h-svh flex-col justify-center pt-16 pb-20 md:pt-20 md:pb-28"
            : "pt-24 pb-16 md:pt-28 md:pb-20",
          contentClassName,
        )}
      >
        {contained ? <Container>{children}</Container> : children}
      </div>
    </section>
  );
}
