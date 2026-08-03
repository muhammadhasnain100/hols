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
