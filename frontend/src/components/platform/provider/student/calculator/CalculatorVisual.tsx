"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { GlassSyringe, GlassVial } from "@/components/platform/provider/student/calculator/GlassIllustrations";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type CalculatorVisualProps = {
  mode: "syringe" | "peptide" | "water" | "dose" | "result";
  syringeMl?: number;
  unitsPerDose?: number;
  maxUnits?: number;
  waterFilled?: boolean;
  medicationFilled?: boolean;
};

export function CalculatorVisual({
  mode,
  syringeMl = 1,
  unitsPerDose = 0,
  maxUnits = 100,
  waterFilled = true,
  medicationFilled = true,
}: CalculatorVisualProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const unitRatio = maxUnits > 0 ? Math.min(1, Math.max(0, unitsPerDose / maxUnits)) : 0;
  const syringeFill =
    mode === "result" ? Math.max(0.18, unitRatio) : mode === "dose" ? 0.32 : mode === "water" ? 0.58 : 0.12;

  const waterFill = mode === "syringe" ? 0.12 : waterFilled ? 0.8 : 0.12;
  const medFill =
    mode === "peptide" ? 0.14 : medicationFilled ? (mode === "result" ? 0.84 : 0.72) : 0.1;
  const medPowder = mode === "peptide";

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
    { scope: rootRef, dependencies: [mode] },
  );

  return (
    <div
      ref={rootRef}
      className="relative mx-auto mt-8 w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-[#9ED6D4]/40 bg-[radial-gradient(ellipse_at_50%_0%,#F7FCFB_0%,#FFFFFF_48%,#EAF7F6_100%)] px-3 py-7 sm:px-8 sm:py-9"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#9ED6D4]/70 to-transparent"
        aria-hidden
      />

      <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-end sm:gap-4 md:gap-8">
        <GlassVial
          label="Bacteriostatic water"
          fillRatio={waterFill}
          variant="water"
          active={mode === "water"}
        />

        <div className="relative order-first sm:order-none">
          <div
            className={cn(
              "pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] blur-2xl transition duration-500",
              mode === "result" ? "bg-[#88D8E8]/30" : "bg-[#9ED6D4]/20",
            )}
          />
          <GlassSyringe
            fillRatio={syringeFill}
            active={mode === "syringe" || mode === "dose" || mode === "result"}
            label={
              mode === "result"
                ? `${unitsPerDose.toFixed(2)} units · ${syringeMl} ml`
                : `${syringeMl} ml syringe`
            }
          />
        </div>

        <GlassVial
          label="Medication vial"
          fillRatio={medFill}
          variant="peptide"
          powder={medPowder}
          active={mode === "peptide" || mode === "dose"}
        />
      </div>
    </div>
  );
}
