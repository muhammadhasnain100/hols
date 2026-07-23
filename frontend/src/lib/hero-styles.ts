import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * Hero overlay layout & component tokens
 * ─────────────────────────────────────
 * Single source of truth for landing hero spacing, gutters, and button styles.
 *
 * Gutters (horizontal):
 *   mobile  → 20px  (px-5)
 *   tablet  → 24px  (md:px-6)
 *   desktop → 32px  (lg:px-8)
 */
export const heroLayout = {
  gutterX: "px-5 md:px-6 lg:px-8",
  nav: {
    shell: "px-5 py-5 md:px-6 md:py-6 lg:px-8",
  },
  content: {
    shell:
      "px-5 pb-6 pt-24 sm:px-5 sm:pb-8 sm:pt-28 md:px-6 md:pb-10 lg:px-8 lg:pb-12",
    gap: "gap-6 sm:gap-8 md:gap-10 lg:gap-12",
  },
  trustStrip: {
    shell: "px-5 pb-8 sm:pb-10 md:px-6 md:pb-14 lg:px-8",
  },
} as const;

const navy = brand.colors.primary.prussianBlue;
const lemon = brand.colors.accent.lemonLime;
const white = brand.colors.neutral.white;

/** Capsule button sizing — shared across nav & hero CTAs */
export const heroButtonSize = "min-h-11 px-6 py-2.5";

export const heroButtonBase =
  "relative isolate inline-flex items-center justify-center overflow-hidden rounded-full font-sans text-sm font-semibold tracking-[0.01em]";

export const heroFocusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50";

export type HeroButtonVariant = "primary" | "secondary" | "ghost" | "icon";

/**
 * GSAP spread-hover colors — same interaction model as login `Button`.
 * Resting surfaces use `.hols-hero-btn-*` in globals.css; hover is animated via useSpreadHover.
 */
export const heroButtonHoverSpread = {
  primary: { fill: navy, textDefault: navy, textHover: white },
  secondary: { fill: lemon, textDefault: white, textHover: navy },
  ghost: { fill: lemon, textDefault: white, textHover: navy },
  icon: { fill: lemon, textDefault: white, textHover: navy },
} as const;

/**
 * Brand-driven hero button resting styles (see globals.css):
 *   primary   — lemon lime capsule (matches login primary)
 *   secondary — frosted glass → yellow on hover (Book a Demo)
 *   ghost     — frosted glass → yellow on hover (Log in)
 *   icon      — square glass menu trigger
 */
export const heroButtonVariants: Record<HeroButtonVariant, string> = {
  primary: "hols-hero-btn-primary",
  secondary: "hols-hero-btn-secondary",
  ghost: "hols-hero-btn-ghost",
  icon: "hols-hero-btn-icon",
};

export function getHeroButtonClass(
  variant: HeroButtonVariant = "primary",
  className?: string,
) {
  return cn(
    heroButtonBase,
    variant === "icon" ? "h-11 w-11 p-0" : heroButtonSize,
    heroButtonVariants[variant],
    heroFocusRing,
    className,
  );
}

export const heroCtaSeparator = "text-sm text-white/35";

/** Center nav — glassmorphism capsule on dark hero overlay */
export const heroNavCapsule =
  "glass-capsule-overlay flex items-center gap-0.5 rounded-full p-1.5 md:gap-1 md:p-2";

export const heroNavCapsuleLink =
  "rounded-full px-4 py-2 font-sans text-sm font-medium tracking-[0.01em] transition-colors duration-300 md:px-5 md:py-2.5";

export function getHeroNavCapsuleLinkClass(isActive: boolean, className?: string) {
  return cn(
    heroNavCapsuleLink,
    isActive
      ? "bg-white/15 text-white shadow-sm"
      : "text-white/80 hover:bg-white/10 hover:text-white",
    className,
  );
}

export const heroNavLinkBase =
  "font-sans text-sm font-medium tracking-[0.01em] transition-colors duration-300";

export function getHeroNavLinkClass(isActive: boolean, className?: string) {
  return cn(
    heroNavLinkBase,
    isActive ? "text-white" : "text-white/80 hover:text-white",
    className,
  );
}

export const heroWelcome = {
  eyebrow: "text-brand-caption uppercase tracking-[0.08em] text-white/90",
  tagline:
    "mt-2 font-sans text-[1.125rem] font-normal leading-[1.15] tracking-[0.005em] text-white/90 sm:text-xl md:mt-3 md:text-[2.125rem] md:leading-[1.1]",
  motto: "text-brand-caption mt-2 hidden text-white/65 md:block",
} as const;

/** Brand guideline typography for hero headline block */
export const heroTypography = {
  headline:
    "font-sans text-[1.875rem] font-bold leading-[1.05] tracking-[0.01em] text-white sm:text-[2.25rem] md:text-[3.75rem]",
  subhead:
    "font-sans mt-3 text-lg font-normal leading-[1.12] tracking-[0.005em] text-white/90 sm:text-xl md:mt-5 md:max-w-xl md:text-[2.125rem] md:leading-[1.1] lg:max-w-2xl",
  body: "text-brand-body mt-4 max-w-lg text-white/85 sm:mt-5 md:mt-6 md:max-w-xl",
  trustStrip: "text-brand-caption leading-relaxed text-white/70 sm:leading-normal",
} as const;

export const heroGlassPanel = "glass-capsule-overlay";
