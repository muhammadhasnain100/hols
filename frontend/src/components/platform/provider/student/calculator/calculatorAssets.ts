import type { SyringeSizeMl } from "@/lib/integrate/provider/student/calculator";

export const CALCULATOR_ASSETS = {
  vial: "/assets/calculator/vial.svg",
  syringe: "/assets/calculator/syringe.svg",
} as const;

/** HOLS brand palette — from brand guidelines 2026. */
export const HOLS_BRAND = {
  prussianBlue: "#142644",
  duskBlue: "#3853A4",
  lemonLime: "#DDE466",
  babyBlue: "#8DC3E1",
  charcoal: "#383838",
  white: "#FFFFFF",
  black: "#000000",
} as const;

/** Logo assets for calculator vial labels. */
export const HOLS_VIAL_BRAND = {
  mark: "/assets/logo/hols-logo-mark.png",
  wordmark: "/assets/logo/hols-logo.png",
} as const;

/** Visual scale for each syringe capacity — balanced for overview + draw-scene fit. */
export const SYRINGE_IMAGE_SCALE: Record<SyringeSizeMl, number> = {
  0.25: 0.58,
  0.5: 0.68,
  1: 0.8,
  2: 0.9,
  3: 0.98,
};

/**
 * Rendered width (in rem) of the horizontal syringe SVG, per syringe capacity.
 * Chosen with a *dramatic* spread so users can clearly see the syringe grow
 * when they pick a larger size on the "Syringe" step. Used in BOTH overview
 * (selection) and draw (animation) modes so the animation reads at the same
 * scale users just saw.
 */
export const SYRINGE_DISPLAY_WIDTH_REM: Record<SyringeSizeMl, number> = {
  0.25: 15,
  0.5: 17,
  1: 20,
  2: 22.5,
  3: 25,
};

/**
 * Narrow-viewport widths — fit draw/overview scenes inside ~320–390px columns
 * (portal padding + card chrome) without horizontal scroll or clipped syringes.
 */
export const SYRINGE_DISPLAY_WIDTH_REM_COMPACT: Record<SyringeSizeMl, number> = {
  0.25: 7.5,
  0.5: 8.5,
  1: 9.5,
  2: 10.5,
  3: 11.5,
};

export function syringeDisplayWidthRem(
  syringeMl: SyringeSizeMl,
  compact = false,
): number {
  const table = compact ? SYRINGE_DISPLAY_WIDTH_REM_COMPACT : SYRINGE_DISPLAY_WIDTH_REM;
  return table[syringeMl] ?? (compact ? 14 : 20);
}

/**
 * Vertical padding (px) needed above the vials in draw mode so the syringe's
 * fully-retracted plunger doesn't clip the top of the animation card.
 *
 * Derived from the syringe's rendered width — the retracted thumb pad sits
 * ~568 SVG-units above the needle tip, and SVG scale = widthPx / 520. Subtract
 * the vial-top-to-stopper offset (~22 px avg) and add ~24 px breathing room.
 */
export function syringeDrawScenePaddingPx(
  syringeMl: SyringeSizeMl,
  compact = false,
): number {
  const widthRem = syringeDisplayWidthRem(syringeMl, compact);
  const widthPx = widthRem * 16;
  // Extra headroom so the vertical hover pose never clips the card top.
  return Math.ceil((568 * widthPx) / 520 - 22 + 48);
}
