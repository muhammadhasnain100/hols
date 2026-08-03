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
  medEmpty?: boolean;
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
  gsapDriven?: boolean;
  className?: string;
};

/** Overview vials — larger reading size. */
const vialSizeClass = "w-[4.35rem] sm:w-[4.9rem] md:w-[5.4rem]";
/**
 * Draw column is wider than the vial art so captions don't collide;
 * vial art stays compact for the animation fit.
 */
const drawColumnClass = "w-[5.5rem] sm:w-[6.25rem] md:w-[6.75rem]";
const drawVialArtClass = "w-[3.25rem] sm:w-[3.6rem] md:w-[3.9rem]";
/**
 * Back (liquid) + front (glass) overlays MUST share this exact flex layout.
 * Top padding reserves room for the syringe; composition sits lower in the card.
 */
const vialRowClass =
  "flex items-end justify-center gap-4 pb-3 pt-[7.25rem] sm:gap-6 sm:pb-4 sm:pt-[8rem] md:gap-8 md:pt-[8.5rem]";

type DrawVialProps = {
  variant: "water" | "peptide";
  fillRatio: number;
  empty?: boolean;
  powder?: boolean;
  peptideUnit?: MassUnit;
  instantFill: boolean;
  gsapDriven: boolean;
  renderLayer: "full" | "back" | "front";
  caption?: string;
  captionHidden?: boolean;
  rootAttrs?: Record<string, string>;
  /** Outer column width (labels). Defaults to draw layout. */
  columnClass?: string;
  /** Inner vial art width. Defaults to compact draw art. */
  artClass?: string;
};

function DrawVialColumn({
  variant,
  fillRatio,
  empty,
  powder,
  peptideUnit,
  instantFill,
  gsapDriven,
  renderLayer,
  caption,
  captionHidden,
  rootAttrs,
  columnClass = drawColumnClass,
  artClass = drawVialArtClass,
  active = false,
  dimmed = false,
}: DrawVialProps & { active?: boolean; dimmed?: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center transition-[opacity,filter] duration-500",
        dimmed && "opacity-[0.58] brightness-[0.94] saturate-[0.88]",
        active && "opacity-100 brightness-100 saturate-100",
        columnClass,
      )}
      {...rootAttrs}
    >
      <div className={cn("relative mx-auto", artClass)}>
        <AssetVial
          label=""
          fillRatio={fillRatio}
          variant={variant}
          peptideUnit={peptideUnit}
          powder={powder}
          empty={empty}
          active={false}
          instantFill={instantFill}
          gsapDriven={gsapDriven}
          renderLayer={renderLayer}
          className="w-full"
        />
      </div>
      {caption ? (
        <p
          className={cn(
            "mt-1.5 w-full whitespace-pre-line px-0.5 text-center text-[8px] font-semibold uppercase leading-[1.25] tracking-[0.06em] text-[color:var(--dash-text)] sm:mt-2 sm:text-[9px] sm:tracking-[0.08em]",
            captionHidden && "invisible",
          )}
          aria-hidden={captionHidden}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}

export function CalculatorReconScene({
  layout,
  syringeMl,
  syringeFill = 0,
  waterFill = 0.8,
  waterEmpty = false,
  medFill = 0.14,
  medEmpty = false,
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
  gsapDriven = false,
  className,
}: CalculatorReconSceneProps) {
  const syringeCommon = {
    syringeMl,
    fillRatio: syringeFill,
    showFill: showSyringeFill,
    active: false as const,
    instantFill,
    gsapDriven,
    vertical: true as const,
    needleDown: true as const,
    large: drawSyringeLarge,
  };

  const useLayeredDraw = layout === "draw" && showSyringe && drawSyringeLarge;

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
            gsapDriven={gsapDriven}
            label={syringeLabel}
            className="w-full origin-center scale-[0.92] sm:scale-[0.96] md:scale-100"
          />
        ) : null}

        <div className="flex w-full items-end justify-center gap-4 sm:gap-6 md:gap-8">
          <AssetVial
            label="Bacteriostatic water"
            fillRatio={waterFill}
            variant="water"
            empty={waterEmpty}
            active={false}
            instantFill={instantFill}
            gsapDriven={gsapDriven}
            className={vialSizeClass}
          />
          <AssetVial
            label="Medication vial"
            fillRatio={medFill}
            variant="peptide"
            peptideUnit={peptideUnit}
            powder={medPowder}
            empty={medEmpty}
            active={false}
            instantFill={instantFill}
            gsapDriven={gsapDriven}
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
        // Clip to the section; smaller assets + lower composition keep the full
        // (plunger-out) syringe inside these bounds.
        "relative mx-auto w-full max-w-sm overflow-hidden px-0.5 sm:max-w-md sm:px-2 md:max-w-lg",
        drawSyringeLarge
          ? "min-h-[17.5rem] sm:min-h-[19rem] md:min-h-[20rem]"
          : "min-h-[14rem] sm:min-h-[16rem]",
        className,
      )}
    >
      {/* Soft radial spotlight behind the vial pair */}
      <div
        className="pointer-events-none absolute inset-x-[8%] top-[28%] z-0 h-[52%] rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(141,195,225,0.14) 0%, rgba(56,83,164,0.06) 42%, transparent 72%)",
        }}
        aria-hidden
      />

      {showSyringe ? (
        <>
          {/* Contact shadow — follows syringe via GSAP */}
          <div
            data-syringe-contact-shadow
            className="pointer-events-none absolute z-[4] h-3 w-14 rounded-full opacity-0"
            style={{
              background: "radial-gradient(ellipse, rgba(20,38,68,0.22) 0%, transparent 72%)",
              filter: "blur(2px)",
            }}
            aria-hidden
          />
          <div
            ref={syringeWrapRef}
            className={cn(
              "pointer-events-none absolute left-0 top-0 will-change-transform",
              useLayeredDraw ? "z-[5]" : "z-30",
            )}
          >
            <AssetSyringe {...syringeCommon} part="full" />
          </div>
        </>
      ) : null}

      {/*
        Front glass must share this exact box with the back fill layer.
        A scene-sized absolute overlay (different gap/pt/height) shifts liquid
        beside the bottle silhouette.
      */}
      <div className="relative z-10">
        <div className={vialRowClass}>
          <DrawVialColumn
            variant="water"
            fillRatio={waterFill}
            empty={waterEmpty}
            instantFill={instantFill}
            gsapDriven={gsapDriven}
            renderLayer={useLayeredDraw ? "back" : "full"}
            caption={"Bacteriostatic\nwater"}
            active={waterActive}
            dimmed={medActive && !waterActive}
            rootAttrs={{ "data-vial": "water", "data-vial-root": "water", "data-vial-column": "water" }}
          />
          <DrawVialColumn
            variant="peptide"
            fillRatio={medFill}
            powder={medPowder}
            peptideUnit={peptideUnit}
            instantFill={instantFill}
            gsapDriven={gsapDriven}
            renderLayer={useLayeredDraw ? "back" : "full"}
            caption={"Medication\nvial"}
            active={medActive}
            dimmed={waterActive && !medActive}
            rootAttrs={{ "data-vial": "med", "data-vial-root": "med", "data-vial-column": "med" }}
          />
        </div>

        {useLayeredDraw ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-20",
              vialRowClass,
            )}
          >
            <DrawVialColumn
              variant="water"
              fillRatio={waterFill}
              empty={waterEmpty}
              instantFill={instantFill}
              gsapDriven={gsapDriven}
              renderLayer="front"
              caption={"Bacteriostatic\nwater"}
              captionHidden
              active={waterActive}
              dimmed={medActive && !waterActive}
              rootAttrs={{ "data-vial-column": "water-front" }}
            />
            <DrawVialColumn
              variant="peptide"
              fillRatio={medFill}
              powder={medPowder}
              peptideUnit={peptideUnit}
              instantFill={instantFill}
              gsapDriven={gsapDriven}
              renderLayer="front"
              caption={"Medication\nvial"}
              captionHidden
              active={medActive}
              dimmed={waterActive && !medActive}
              rootAttrs={{ "data-vial-column": "med-front" }}
            />
          </div>
        ) : null}
      </div>

      {syringeLabel ? (
        <p className="mt-2 text-center text-xs font-medium text-[color:var(--dash-text)] sm:text-sm">
          {syringeLabel}
        </p>
      ) : null}
    </div>
  );
}
