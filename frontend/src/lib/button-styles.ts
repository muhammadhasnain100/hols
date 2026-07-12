import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const navy = brand.colors.primary.prussianBlue;
const lemon = brand.colors.accent.lemonLime;
const white = brand.colors.neutral.white;

export const buttonHoverSpread = {
  primary: { fill: navy, textDefault: navy, textHover: white },
  accent: { fill: navy, textDefault: navy, textHover: white },
  secondary: { fill: lemon, textDefault: navy, textHover: navy },
  ghost: { fill: "rgba(221, 228, 102, 0.35)", textDefault: navy, textHover: navy },
  glass: { fill: lemon, textDefault: navy, textHover: navy },
} as const;

/** Shared size used by hero CTAs and navbar buttons */
export const buttonSizes = {
  sm: "min-h-10 px-4 py-2 text-xs",
  md: "min-h-11 px-6 py-3 text-sm",
  lg: "min-h-[3.25rem] px-8 py-3.5 text-sm",
} as const;

export const navCapsuleSizes = {
  container: "gap-1 rounded-full border border-primary/10 bg-white/70 p-1.5 shadow-sm backdrop-blur-sm",
  link: "min-h-[3.25rem] rounded-full px-5 py-3.5 text-sm font-medium transition-colors duration-300 ease-out",
  linkActive: "bg-white text-primary shadow-sm",
  linkInactive: "text-primary/70 hover:bg-white/80 hover:text-primary",
};

export type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "glass";

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-primary border border-transparent shadow-sm",
  accent: "bg-accent text-primary border border-transparent shadow-sm",
  secondary: "bg-white/85 text-primary border border-primary/20",
  ghost: "bg-transparent text-primary border border-transparent",
  glass: "glass-button text-primary shadow-sm",
};

export function getButtonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
  size: keyof typeof buttonSizes = "md",
) {
  return cn(
    "relative isolate inline-flex items-center justify-center overflow-hidden rounded-full font-medium",
    buttonSizes[size],
    buttonVariants[variant],
    className,
  );
}

export function getNavCapsuleLinkClassName(isActive: boolean, className?: string) {
  return cn(
    navCapsuleSizes.link,
    "inline-flex items-center justify-center",
    isActive ? navCapsuleSizes.linkActive : navCapsuleSizes.linkInactive,
    className,
  );
}
