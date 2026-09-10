import type { MassUnit } from "@/lib/integrate/provider/student/calculator";
import { toMcg } from "@/lib/integrate/provider/student/calculator/math";

const MIN_FILL = 0.08;
const MAX_FILL = 0.92;

/** Visual capacity of the bacteriostatic water supply vial (ml). */
export const WATER_SUPPLY_VIAL_ML = 30;

/**
 * Visual span for reconstitution water amounts — chosen ml maps across most of
 * the bottle height so 1 ml vs 5 ml is obviously different (stock bottle is 30 ml).
 */
const WATER_VISUAL_SPAN_ML = 10;

/** Max dry peptide mass the medication vial can visually hold (15 mg). */
export const MED_VIAL_CAPACITY_MCG = 15_000;

/** Max reconstitution water the med vial interior can show when filled. */
export const MED_VIAL_MAX_WATER_ML = 5;

function clampFill(value: number): number {
  return Math.min(MAX_FILL, Math.max(MIN_FILL, value));
}

/** Parse a wizard amount field — blank or non-positive values mean “no amount yet”. */
export function parsePositiveAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/** Map entered bac-water volume (reconstitution ml) to supply-vial starting level. */
export function waterFillFromVolume(ml: number): number {
  if (!Number.isFinite(ml) || ml <= 0) return 0;
  const ratio = Math.min(1, ml / WATER_VISUAL_SPAN_ML);
  return clampFill(MIN_FILL + ratio * (MAX_FILL - MIN_FILL));
}

/** Map dry peptide amount to lyophilized powder fill in the med vial. */
export function medPowderFillFromAmount(amount: number, unit: MassUnit): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const mcg = toMcg(amount, unit);
  const ratio = Math.min(1, mcg / MED_VIAL_CAPACITY_MCG);
  // Ease mid-range so typical 2–10 mg doses read clearly.
  const eased = Math.pow(ratio, 0.85);
  return clampFill(0.14 + eased * (MAX_FILL - 0.14));
}

/** Reconstituted liquid level after adding bac water. */
export function medLiquidFillFromWaterVolume(waterMl: number): number {
  if (!Number.isFinite(waterMl) || waterMl <= 0) return 0;
  const ratio = Math.min(1, waterMl / MED_VIAL_MAX_WATER_ML);
  return clampFill(0.22 + ratio * (MAX_FILL - 0.22));
}

/** Syringe barrel fill ratio for a drawn volume. */
export function syringeFillFromDrawVolume(drawMl: number, syringeMl: number): number {
  if (!Number.isFinite(drawMl) || drawMl <= 0 || syringeMl <= 0) return 0;
  return Math.min(0.98, Math.max(0.06, (drawMl / syringeMl) * 0.96));
}

/** Volume drawn from the supply vial during reconstitution (one syringe load max). */
export function reconstitutionDrawVolumeMl(waterMl: number, syringeMl: number): number {
  if (!Number.isFinite(waterMl) || waterMl <= 0) return 0;
  if (!Number.isFinite(syringeMl) || syringeMl <= 0) return waterMl;
  return Math.min(waterMl, syringeMl);
}

/**
 * Water supply vial level after removing volume.
 *
 * Reconstitution passes `drawMl === supplyMl` so the bottle empties with the
 * transfer into the medication vial. Partial draws (if used elsewhere) drop the
 * meniscus in proportion to the visible starting fill.
 */
export function waterFillAfterDraw(
  supplyFill: number,
  drawMl: number,
  /** Chosen reconstitution volume the bottle currently represents. */
  supplyMl?: number,
): number {
  if (!Number.isFinite(drawMl) || drawMl <= 0) return supplyFill;
  const total = supplyMl && supplyMl > 0 ? supplyMl : WATER_VISUAL_SPAN_ML;
  const taken = Math.min(drawMl, total);
  const remainingMl = Math.max(0, total - taken);
  if (remainingMl <= 0.01) return 0;
  const fractionLeft = remainingMl / total;
  const proportional = supplyFill * fractionLeft;
  return Math.min(supplyFill, clampFill(Math.max(MIN_FILL, proportional)));
}

/** True when the supply bottle should render as drained. */
export function isWaterSupplyEmpty(fillRatio: number): boolean {
  return !Number.isFinite(fillRatio) || fillRatio <= 0.02;
}

/** Reconstituted med vial level after injecting water. */
export function medFillAfterReconstitution(waterMl: number, peptideAmount: number, unit: MassUnit): number {
  const liquid = medLiquidFillFromWaterVolume(waterMl);
  const powder = medPowderFillFromAmount(peptideAmount, unit);
  return clampFill(Math.max(liquid, powder * 0.45 + 0.2));
}
