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
 * Overview vials — sized so both silhouettes read as the same height on a
 * shared surface. Water uses 160×210 art; med uses 120×205 with a higher
 * internal scale, so med CSS width stays ~0.77× water.
 * `max-[390px]` targets iPhone SE / small phones — keep proportions close to
 * desktop so needle insert depth scales correctly.
 */
const vialSizeClass =
  "w-[3.85rem] max-[390px]:w-[3.6rem] sm:w-[6.05rem] md:w-[9.35rem]";
const waterVialSizeClass =
  "w-[5rem] max-[390px]:w-[4.65rem] sm:w-[7.9rem] md:w-[12.15rem]";
/**
 * Draw (animation) column + art widths — follow overview proportions so the
 * reconstitution scene matches the dose-selection preview on every breakpoint.
 */
const drawColumnClass =
  "w-[5.35rem] max-[390px]:w-[4.85rem] sm:w-[7.9rem] md:w-[12.5rem]";
const drawVialArtClass =
  "w-[3.85rem] max-[390px]:w-[3.55rem] sm:w-[6.05rem] md:w-[9.35rem]";
const drawWaterVialArtClass =
  "w-[5rem] max-[390px]:w-[4.65rem] sm:w-[7.9rem] md:w-[12.15rem]";
/**
 * Back (liquid) + front (glass) overlays MUST share this exact flex layout.
 * Top padding is applied inline as `paddingTop` based on the selected syringe
 * size (see `syringeDrawScenePaddingPx`) — small syringes get less empty
 * space above the vials, large ones get just enough headroom for the fully
 * retracted plunger in vertical pose.
 */
const vialRowClass =
  "flex items-end justify-center gap-3 pb-1 max-[390px]:gap-2.5 max-[390px]:pb-1 sm:gap-5 sm:pb-4 md:gap-12 md:pb-6";

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
            "mt-1.5 w-full max-w-full whitespace-pre-line px-0.5 text-center text-[8px] font-semibold uppercase leading-[1.2] tracking-[0.04em] text-[color:var(--dash-text)] max-[390px]:mt-1 max-[390px]:text-[7px] max-[390px]:tracking-[0.02em] sm:mt-2 sm:text-[9px] sm:tracking-[0.08em]",
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
          "mx-auto flex w-full max-w-[18rem] flex-col items-center gap-2 px-1 py-1.5 max-[390px]:max-w-[17rem] max-[390px]:gap-1.5 max-[390px]:py-1 sm:max-w-[24rem] sm:gap-5 sm:px-2 sm:py-3 md:max-w-lg md:gap-8 md:py-5",
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

        <div className="flex w-full min-w-0 items-end justify-center gap-3 max-[390px]:gap-2.5 sm:gap-6 md:gap-12">
          <AssetVial
            label={compact ? "Bac water" : "Bacteriostatic water"}
            fillRatio={waterFill}
            variant="water"
            empty={waterEmpty}
            active={false}
            instantFill={instantFill}
            gsapDriven={gsapDriven}
            className={cn(waterVialSizeClass, "self-end")}
          />
          <AssetVial
            label={compact ? "Medication" : "Medication vial"}
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
        // everything proportional; SE gets a shorter floor so the card fits.
        drawSyringeLarge
          ? "min-h-[28rem] max-[390px]:min-h-[25rem] sm:min-h-[36rem] md:min-h-[44rem]"
          : "min-h-[9rem] max-[390px]:min-h-[8.5rem] sm:min-h-[14rem] md:min-h-[16rem]",
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
          {/*
            Needle under front caps (z-15); barrel above front (z-25).
            Back vials are z-10, front glass/caps z-20 — same stacking context.
          */}
          <div
            data-syringe-needle-wrap
            className="pointer-events-none absolute left-0 top-0 z-[15] will-change-transform"
            aria-hidden
          >
            <AssetSyringe {...syringeCommon} part="needle" />
          </div>
          <div
            ref={syringeWrapRef}
            className="pointer-events-none absolute left-0 top-0 z-[25] will-change-transform"
          >
            <AssetSyringe {...syringeCommon} part="barrel" />
          </div>
        </>
      ) : null}

      {/*
        Host has NO z-index so back/front z values compete with the syringe.
        Front glass must share this exact box with the back fill layer.
      */}
      <div className="relative">
        <div className={cn(vialRowClass, "relative z-10")} style={{ paddingTop: drawScenePaddingTop }}>
          <DrawVialColumn
            variant="water"
            fillRatio={waterFill}
            empty={waterEmpty}
            instantFill={instantFill}
            gsapDriven={gsapDriven}
            renderLayer={useLayeredDraw ? "back" : "full"}
            caption={compact ? "Bac water" : "Bacteriostatic\nwater"}
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
            caption={compact ? "Medication" : "Medication\nvial"}
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
              caption={compact ? "Bac water" : "Bacteriostatic\nwater"}
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
              caption={compact ? "Medication" : "Medication\nvial"}
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
