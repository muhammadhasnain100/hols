"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { CalculatorReconScene } from "@/components/platform/provider/student/calculator/CalculatorReconScene";
import {
  medLiquidFillFromWaterVolume,
  medPowderFillFromAmount,
  parsePositiveAmount,
  waterFillFromVolume,
} from "@/components/platform/provider/student/calculator/calculatorFillLevels";
import type { MassUnit, SyringeSizeMl } from "@/lib/integrate/provider/student/calculator";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

type CalculatorVisualProps = {
  mode: "syringe" | "peptide" | "water" | "dose" | "result";
  syringeMl?: SyringeSizeMl;
  unitsPerDose?: number;
  maxUnits?: number;
  waterFilled?: boolean;
  medicationFilled?: boolean;
  peptideUnit?: MassUnit;
  waterMl?: string;
  peptideAmount?: string;
};

export function CalculatorVisual({
  mode,
  syringeMl = 1,
  unitsPerDose = 0,
  maxUnits = 100,
  peptideUnit = "mg",
  waterMl = "",
  peptideAmount = "",
}: CalculatorVisualProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  const waterAmount = parsePositiveAmount(waterMl);
  const peptideVal = parsePositiveAmount(peptideAmount);
  const hasWater = waterAmount !== null;
  const hasPeptide = peptideVal !== null;

  /**
   * Medication vial state, following user flow (not strict physics):
   * - Syringe step: empty (nothing selected yet)
   * - Medication step: dry powder (peptide mass entered)
   * - Water step: still powder — water is being drawn into the bac bottle,
   *   not yet injected into the med vial
   * - Dose step: liquid — visualise the reconstituted vial so the user can
   *   picture the dose they are about to draw
   * - Result step: liquid — reconstitution complete
   */
  const medReconstituted = mode === "result" || mode === "dose";

  /**
   * Bacteriostatic water bottle:
   * - Empty on Syringe + Medication steps (user hasn't selected water yet).
   * - Filled once the user is on the Water step (with volume entered) or the
   *   Dose step (water already committed).
   * - Empty again at the Result step — the animation has just transferred
   *   the water into the medication vial.
   */
  const isAtOrAfterWaterStep = mode === "water" || mode === "dose";
  const waterEmpty = mode === "result" || !hasWater || !isAtOrAfterWaterStep;
  const medEmpty = !medReconstituted && !hasPeptide;
  const medPowder = !medReconstituted;

  const waterFill = hasWater ? waterFillFromVolume(waterAmount) : 0;
  const medFill = medReconstituted
    ? hasWater
      ? medLiquidFillFromWaterVolume(waterAmount)
      : hasPeptide
        ? medPowderFillFromAmount(peptideVal, peptideUnit)
        : 0
    : hasPeptide
      ? medPowderFillFromAmount(peptideVal, peptideUnit)
      : 0;

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !rootRef.current) return;
      gsap.fromTo(
        rootRef.current,
        { autoAlpha: 0.55, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
      );
    },
    { scope: rootRef, dependencies: [mode, syringeMl] },
  );

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !sceneRef.current) return;

      gsap.fromTo(
        sceneRef.current,
        { autoAlpha: 0.7, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
      );
    },
    { scope: sceneRef, dependencies: [mode] },
  );

  return (
    <div
      ref={rootRef}
      className="dashboard-glass-card relative mx-auto flex h-full w-full max-w-md flex-col justify-center overflow-x-hidden rounded-2xl px-2 py-3 sm:max-w-lg sm:px-5 sm:py-5 md:overflow-visible md:px-8 md:py-7 lg:mt-0 lg:max-w-none"
    >
      <div ref={sceneRef}>
        <CalculatorReconScene
          layout="overview"
          syringeMl={syringeMl}
          syringeFill={0}
          waterFill={waterFill}
          waterEmpty={waterEmpty}
          medFill={medFill}
          medEmpty={medEmpty}
          medPowder={medPowder}
          peptideUnit={peptideUnit}
          syringeActive={mode === "syringe" || mode === "dose"}
          waterActive={mode === "water"}
          medActive={mode === "peptide" || mode === "result"}
          showSyringeFill={false}
          syringeLabel={
            mode === "result"
              ? `${unitsPerDose.toFixed(2)} units · ${syringeMl} ml syringe`
              : undefined
          }
        />
      </div>
    </div>
  );
}
