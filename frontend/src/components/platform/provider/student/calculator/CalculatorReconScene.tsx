"use client";

import {
  AssetSyringe,
  AssetVial,
} from "@/components/platform/provider/student/calculator/CalculatorAssetIllustrations";
import { syringeDrawScenePaddingPx } from "@/components/platform/provider/student/calculator/calculatorAssets";
import { useCompactCalculatorScene } from "@/components/platform/provider/student/calculator/useCompactCalculatorScene";
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

/**
 * Overview vials — bacteriostatic water is a 30 mL stock bottle; the medication
 * vial is a small (~2–10 mL) peptide vial. It should render visibly smaller.
 * Width ratio (~0.63 med/water) is kept across breakpoints so mobile matches
 * the corrected desktop proportion; `md` restores full desktop drama.
 *
 * Peptide SVG (120×205) is taller per-rem than water (160×210), so med width
 * must stay proportionally smaller or it reads as the larger bottle.
 */
const vialSizeClass = "w-[4.25rem] sm:w-[5.5rem] md:w-[8.55rem]";
const waterVialSizeClass = "w-[6.75rem] sm:w-[8.75rem] md:w-[13.5rem]";
/**
 * Draw (animation) column + art widths — follow overview proportions so the
 * reconstitution scene matches the dose-selection preview on every breakpoint.
 */
const drawColumnClass = "w-[6.75rem] sm:w-[8.75rem] md:w-[14rem]";
const drawVialArtClass = "w-[4.25rem] sm:w-[5.5rem] md:w-[8.55rem]";
const drawWaterVialArtClass = "w-[6.75rem] sm:w-[8.75rem] md:w-[13.5rem]";
/**
 * Back (liquid) + front (glass) overlays MUST share this exact flex layout.
 * Top padding is applied inline as `paddingTop` based on the selected syringe
 * size (see `syringeDrawScenePaddingPx`) — small syringes get less empty
 * space above the vials, large ones get just enough headroom for the fully
 * retracted plunger in vertical pose.
 */
const vialRowClass =
  "flex items-end justify-center gap-3 pb-2 sm:gap-5 sm:pb-4 md:gap-12 md:pb-6";

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
        "flex shrink-0 flex-col items-center justify-end self-end transition-[opacity,filter] duration-500",
        dimmed && "opacity-[0.58] brightness-[0.94] saturate-[0.88]",
        active && "opacity-100 brightness-100 saturate-100",
        columnClass,
      )}
      {...rootAttrs}
    >
      <div
        className={cn(
          "relative mx-auto",
          variant === "water" ? drawWaterVialArtClass : artClass,
        )}
      >
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
  const compact = useCompactCalculatorScene();
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
  // Dynamic top padding: sized to the actual retracted-plunger reach for
  // the *selected* syringe capacity. Larger syringes → taller plunger swing.
  const drawScenePaddingTop = drawSyringeLarge
    ? `${syringeDrawScenePaddingPx(syringeMl, compact)}px`
    : undefined;

  if (layout === "overview") {
    return (
      <div
        className={cn(
          "mx-auto flex w-full max-w-[18rem] flex-col items-center gap-2 px-1 py-2 sm:max-w-[24rem] sm:gap-5 sm:px-2 sm:py-3 md:max-w-lg md:gap-8 md:py-5",
          className,
        )}
      >
        {showSyringe ? (
          <div className="flex w-full min-w-0 items-center justify-center px-1 sm:px-3">
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
              className="w-full min-w-0"
            />
          </div>
        ) : null}

        <div className="flex w-full min-w-0 items-end justify-center gap-3 sm:gap-6 md:gap-12">
          <AssetVial
            label="Bacteriostatic water"
            fillRatio={waterFill}
            variant="water"
            empty={waterEmpty}
            active={false}
            instantFill={instantFill}
            gsapDriven={gsapDriven}
            className={cn(waterVialSizeClass, "self-end")}
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
            className={cn(vialSizeClass, "self-end")}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={sceneRef}
      className={cn(
        // Scene is clipped so the syringe never pokes outside the card.
        // The paddingTop + vial height gives enough room for the full plunger.
        "relative mx-auto w-full max-w-lg overflow-hidden px-0 sm:max-w-2xl sm:px-4 md:max-w-3xl md:px-6",
        // min-h: paddingTop + vial column + bottom pad. Compact syringe keeps
        // everything proportional to the desktop layout.
        drawSyringeLarge
          ? "min-h-[22rem] sm:min-h-[30rem] md:min-h-[38rem]"
          : "min-h-[10rem] sm:min-h-[14rem] md:min-h-[16rem]",
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
              // Keep syringe above vial art during travel so it never paints
              // "under" the card content; needle still reads through the stopper
              // via the vial front/back layers.
              "z-30",
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
        <div className={vialRowClass} style={{ paddingTop: drawScenePaddingTop }}>
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
            style={{ paddingTop: drawScenePaddingTop }}
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
