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
 * Narrow-viewport widths — keep the same relative scale as desktop so insert
 * depth, needle length, and vial size stay proportional (not crushed for SE).
 */
export const SYRINGE_DISPLAY_WIDTH_REM_COMPACT: Record<SyringeSizeMl, number> = {
  0.25: 8.75,
  0.5: 9.75,
  1: 11,
  2: 12,
  3: 13,
};

export function syringeDisplayWidthRem(
  syringeMl: SyringeSizeMl,
  compact = false,
): number {
  const table = compact ? SYRINGE_DISPLAY_WIDTH_REM_COMPACT : SYRINGE_DISPLAY_WIDTH_REM;
  return table[syringeMl] ?? (compact ? 8.25 : 20);
}

/**
 * Vertical padding (px) needed above the vials in draw mode so the syringe's
 * fully-retracted plunger doesn't clip the top of the animation card.
 *
 * Tuned for SyringeArt (needle-down): tip→thumb span ≈ 546 viewBox units over
 * a ~558-tall viewBox. Rendered height follows the same scale as AssetSyringe.
 */
export function syringeDrawScenePaddingPx(
  syringeMl: SyringeSizeMl,
  compact = false,
): number {
  const rawScale = SYRINGE_IMAGE_SCALE[syringeMl] ?? 0.8;
  const scale = Math.min(
    Math.max(rawScale * (compact ? 0.92 : 1), compact ? 0.68 : 0.78),
    compact ? 0.92 : 1.05,
  );
  const baseHeight = compact ? 280 : 340;
  const heightPx = baseHeight * scale;
  // tipY 404 → thumbTop -142 in a viewBox from -146..412
  const tipToThumbPx = heightPx * (546 / 558);
  const breath = Math.ceil(heightPx * 0.16) + (compact ? 28 : 40);
  return Math.ceil(tipToThumbPx - 22 + breath);
}
