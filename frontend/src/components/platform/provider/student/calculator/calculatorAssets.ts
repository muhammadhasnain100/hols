import type { SyringeSizeMl } from "@/lib/integrate/provider/student/calculator";

export const CALCULATOR_ASSETS = {
  vial: "/assets/calculator/vial.svg",
  syringe: "/assets/calculator/syringe.svg",
} as const;

/** Visual scale for each syringe capacity — larger ml = taller syringe illustration. */
export const SYRINGE_IMAGE_SCALE: Record<SyringeSizeMl, number> = {
  0.25: 0.56,
  0.5: 0.68,
  1: 0.82,
  2: 0.98,
  3: 1.12,
};
