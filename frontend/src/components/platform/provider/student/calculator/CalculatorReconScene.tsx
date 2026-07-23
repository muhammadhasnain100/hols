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

const vialSizeClass = "w-[3.75rem] sm:w-[4.5rem] md:w-[5.25rem]";

export function CalculatorReconScene({
  layout,
  syringeMl,
  syringeFill = 0.12,
  waterFill = 0.8,
  waterEmpty = false,
  medFill = 0.14,
  medPowder = false,
  peptideUnit = "mg",
  waterActive: _waterActive = false,
  medActive: _medActive = false,
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
      <div
        className={cn(
          "mx-auto flex w-full max-w-[15rem] flex-col items-center gap-3 px-1 py-2 sm:max-w-[17rem] sm:gap-4 sm:px-2 sm:py-3 md:max-w-xs md:gap-5 md:py-4",
          className,
        )}
      >
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
            className="w-full origin-center scale-[0.88] sm:scale-[0.95] md:scale-100"
          />
        ) : null}

        <div className="flex w-full items-start justify-center gap-4 sm:gap-6 md:gap-8">
          <AssetVial
            label="Bacteriostatic water"
            fillRatio={waterFill}
            variant="water"
            empty={waterEmpty}
            active={false}
            showGlow={false}
            instantFill={instantFill}
            className={vialSizeClass}
          />
          <AssetVial
            label="Medication vial"
            fillRatio={medFill}
            variant="peptide"
            peptideUnit={peptideUnit}
            powder={medPowder}
            active={false}
            showGlow={false}
            instantFill={instantFill}
            className={vialSizeClass}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sceneRef}
      className={cn(
        "relative mx-auto w-full max-w-sm overflow-visible px-0.5 sm:max-w-md sm:px-2 md:max-w-lg",
        drawSyringeLarge
          ? "min-h-[19.5rem] sm:min-h-[25rem] md:min-h-[26rem]"
          : "min-h-[18rem] sm:min-h-[23rem]",
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

      <div className="flex items-start justify-center gap-4 pb-2 pt-[9.5rem] sm:gap-8 sm:pt-[12rem] md:gap-10 md:pt-[13rem]">
        <div
          className={cn("flex shrink-0 flex-col items-center", vialSizeClass)}
          data-vial="water"
          data-vial-root="water"
        >
          <div className="relative w-full">
            <AssetVial
              label=""
              fillRatio={waterFill}
              variant="water"
              empty={waterEmpty}
              active={false}
              showGlow={false}
              instantFill={instantFill}
              className="w-full"
            />
          </div>
          <p className="mt-1.5 max-w-[7.5rem] text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--dash-muted)] sm:mt-2 sm:text-[10px]">
            Bacteriostatic water
          </p>
        </div>

        <div
          className={cn("flex shrink-0 flex-col items-center", vialSizeClass)}
          data-vial="med"
          data-vial-root="med"
        >
          <div className="relative w-full">
            <AssetVial
              label=""
              fillRatio={medFill}
              variant="peptide"
              peptideUnit={peptideUnit}
              powder={medPowder}
              active={false}
              showGlow={false}
              instantFill={instantFill}
              className="w-full"
            />
          </div>
          <p className="mt-1.5 max-w-[7.5rem] text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--dash-muted)] sm:mt-2 sm:text-[10px]">
            Medication vial
          </p>
        </div>
      </div>

      {syringeLabel ? (
        <p className="mt-2 text-center text-xs font-medium text-[color:var(--dash-muted)] sm:text-sm">
          {syringeLabel}
        </p>
      ) : null}
    </div>
  );
}
