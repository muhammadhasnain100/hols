"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { CalculatorReconScene } from "@/components/platform/provider/student/calculator/CalculatorReconScene";
import {
  isWaterSupplyEmpty,
  medLiquidFillFromWaterVolume,
  medPowderFillFromAmount,
  parsePositiveAmount,
  waterFillAfterDraw,
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
   * Step visuals (strict — each control only drives its own bottle):
   * - Syringe: both empty
   * - Medication: powder only in med vial (water stays empty)
   * - Water + Dose: water bottle at chosen ml; med stays powder until mix
   * - Result: med vial reconstituted liquid; water shows remaining after draw
   */
  const showWaterSupply = mode === "water" || mode === "dose" || mode === "result";
  const showMedPowder = mode === "peptide" || mode === "water" || mode === "dose";
  const showMedLiquid = mode === "result";

  const supplyFill = hasWater ? waterFillFromVolume(waterAmount) : 0;
  // Result: bottle stays fully drained — same end state as the mix animation.
  const waterFill = !showWaterSupply
    ? 0
    : mode === "result" && hasWater
      ? waterFillAfterDraw(supplyFill, waterAmount, waterAmount)
      : supplyFill;
  const waterEmpty = !showWaterSupply || !hasWater || isWaterSupplyEmpty(waterFill);

  const medEmpty = showMedPowder
    ? !hasPeptide
    : showMedLiquid
      ? !(hasWater || hasPeptide)
      : true;
  const medPowder = showMedPowder;
  const medFill = showMedPowder
    ? hasPeptide
      ? medPowderFillFromAmount(peptideVal, peptideUnit)
      : 0
    : showMedLiquid
      ? hasWater
        ? medLiquidFillFromWaterVolume(waterAmount)
        : hasPeptide
          ? medPowderFillFromAmount(peptideVal, peptideUnit)
          : 0
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
