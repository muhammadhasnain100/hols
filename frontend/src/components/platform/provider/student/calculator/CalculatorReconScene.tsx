"use client";

import {
  AssetSyringe,
  AssetVial,
} from "@/components/platform/provider/student/calculator/CalculatorAssetIllustrations";
import type { MassUnit, SyringeSizeMl } from "@/lib/integrate/provider/student/calculator";
import { cn } from "@/lib/utils";
import type { RefObject } from "react";

export type ReconSceneLayout = "overview" | "draw";

type CalculatorReconSceneProps = {
  layout: ReconSceneLayout;
  syringeMl: SyringeSizeMl;
  syringeFill?: number;
  waterFill?: number;
  waterEmpty?: boolean;
  medFill?: number;
  medPowder?: boolean;
  peptideUnit?: MassUnit;
  waterActive?: boolean;
  medActive?: boolean;
  syringeActive?: boolean;
  showSyringe?: boolean;
  showSyringeFill?: boolean;
  syringeHorizontal?: boolean;
  syringeLabel?: string;
  sceneRef?: RefObject<HTMLDivElement | null>;
  syringeWrapRef?: RefObject<HTMLDivElement | null>;
  drawSyringeLarge?: boolean;
  instantFill?: boolean;
  className?: string;
};

export function CalculatorReconScene({
  layout,
  syringeMl,
  syringeFill = 0.12,
  waterFill = 0.8,
  waterEmpty = false,
  medFill = 0.14,
  medPowder = false,
  peptideUnit = "mg",
  waterActive = false,
  medActive = false,
  syringeActive = false,
  showSyringe = true,
  showSyringeFill = false,
  syringeLabel,
  sceneRef,
  syringeWrapRef,
  drawSyringeLarge = false,
  instantFill = false,
  className,
}: CalculatorReconSceneProps) {
  if (layout === "overview") {
    return (
      <div className={cn("mx-auto flex w-full max-w-[17rem] flex-col items-center gap-4 py-2 sm:max-w-xs sm:gap-5", className)}>
        {showSyringe ? (
          <AssetSyringe
            syringeMl={syringeMl}
            fillRatio={syringeFill}
            large
            horizontal
            showFill={showSyringeFill}
            active={syringeActive}
            instantFill={instantFill}
            label={syringeLabel}
            className="w-full scale-[0.92] sm:scale-100"
          />
        ) : null}

        <div className="flex items-end justify-center gap-6 sm:gap-8">
          <AssetVial
            label="Bacteriostatic water"
            fillRatio={waterFill}
            variant="water"
            empty={waterEmpty}
            active={waterActive}
            instantFill={instantFill}
          />
          <AssetVial
            label="Medication vial"
            fillRatio={medFill}
            variant="peptide"
            peptideUnit={peptideUnit}
            powder={medPowder}
            active={medActive}
            instantFill={instantFill}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sceneRef}
      className={cn(
        "relative mx-auto w-full max-w-md overflow-visible px-2 sm:max-w-lg",
        drawSyringeLarge ? "min-h-[19rem] sm:min-h-[21rem]" : "min-h-[18rem]",
        className,
      )}
    >
      {showSyringe ? (
        <div
          ref={syringeWrapRef}
          className="pointer-events-none absolute left-0 top-0 z-30 will-change-transform"
        >
          <AssetSyringe
            syringeMl={syringeMl}
            fillRatio={syringeFill}
            showFill={showSyringeFill}
            active={false}
            instantFill={instantFill}
            vertical
            needleDown
            large={drawSyringeLarge}
          />
        </div>
      ) : null}

      <div className="flex items-end justify-center gap-6 pb-2 pt-24 sm:gap-8 sm:pt-28">
        <div className="flex shrink-0 flex-col items-center" data-vial="water" data-vial-root="water">
          <div className="relative">
            <AssetVial
              label=""
              fillRatio={waterFill}
              variant="water"
              empty={waterEmpty}
              active={waterActive}
              showGlow={false}
              instantFill={instantFill}
            />
          </div>
          <p className="mt-2 max-w-[7.5rem] text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/50">
            Bacteriostatic water
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center" data-vial="med" data-vial-root="med">
          <div className="relative">
            <AssetVial
              label=""
              fillRatio={medFill}
              variant="peptide"
              peptideUnit={peptideUnit}
              powder={medPowder}
              active={medActive}
              showGlow={false}
              instantFill={instantFill}
            />
          </div>
          <p className="mt-2 max-w-[7.5rem] text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/50">
            Medication vial
          </p>
        </div>
      </div>

      {syringeLabel ? (
        <p className="mt-2 text-center text-sm font-medium text-primary/55">{syringeLabel}</p>
      ) : null}
    </div>
  );
}
