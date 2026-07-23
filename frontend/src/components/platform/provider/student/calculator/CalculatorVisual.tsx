"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { CalculatorReconScene } from "@/components/platform/provider/student/calculator/CalculatorReconScene";
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
};

export function CalculatorVisual({
  mode,
  syringeMl = 1,
  unitsPerDose = 0,
  maxUnits = 100,
  waterFilled = true,
  medicationFilled = true,
  peptideUnit = "mg",
}: CalculatorVisualProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  const unitRatio = maxUnits > 0 ? Math.min(1, Math.max(0, unitsPerDose / maxUnits)) : 0;

  const waterEmpty = mode === "result";
  const waterFill = waterEmpty
    ? 0
    : mode === "dose"
      ? 0.55
      : mode === "water" && waterFilled
        ? 0.55
        : mode === "syringe" || mode === "peptide" || mode === "water"
          ? 0.42
          : waterFilled
            ? 0.8
            : 0.12;

  const medFill = mode === "result" ? 0.78 : 0.14;
  const medPowder = mode !== "result";

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
      className="dashboard-glass-card relative mx-auto w-full max-w-sm overflow-visible rounded-2xl px-2 py-3 sm:max-w-md sm:px-6 sm:py-5 md:px-8 md:py-6 lg:mt-0 lg:max-w-none"
    >
      <div ref={sceneRef}>
        <CalculatorReconScene
          layout="overview"
          syringeMl={syringeMl}
          syringeFill={mode === "result" ? Math.max(0.18, unitRatio) : 0.12}
          waterFill={waterFill}
          waterEmpty={waterEmpty}
          medFill={medFill}
          medPowder={medPowder}
          peptideUnit={peptideUnit}
          syringeActive={mode === "syringe" || mode === "dose"}
          waterActive={mode === "water"}
          medActive={mode === "peptide" || mode === "result"}
          showSyringeFill={mode === "result"}
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
