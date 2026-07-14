import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

type HeroLogoProps = {
  className?: string;
  variant?: "light" | "dark";
  compact?: boolean;
  linked?: boolean;
};

export function HeroLogo({
  className,
  variant = "dark",
  compact = false,
  linked = true,
}: HeroLogoProps) {
  return (
    <Logo
      variant={variant}
      compact={compact}
      href={linked ? "/" : ""}
      className={cn(compact ? "h-7 md:h-8" : "h-8 md:h-10", className)}
    />
  );
}
