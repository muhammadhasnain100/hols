/**
 * Hexarelin serum-vial artwork adapted from the editable vector SVG.
 * Drawn in source coords (vial around x≈258.5, y 35–335), then scaled into
 * the calculator viewBox via `HEXARELIN_VIAL_TRANSFORM`.
 *
 * Branding corrected to HOLS. / house of life science (generator had placeholders).
 */

import type { ReactNode, Ref } from "react";
import { cylinderLabelPath } from "@/components/platform/provider/student/calculator/cylinderLabel";

export type HexarelinVialTheme = "navy" | "bac-water-pink";

type HexarelinVialArtProps = {
  uid: string;
  /** Printed product name on the label (e.g. "Bacteriostatic water", "Medication vial"). */
  productName: string;
  /**
   * Label / flip-cap theme.
   * - navy: default HOLS medication vial
   * - bac-water-pink: bacteriostatic water — Hospira-inspired pink label, HOLS branding kept
   */
  theme?: HexarelinVialTheme;
  showBack?: boolean;
  showFront?: boolean;
  frontGlass?: boolean;
  powder?: boolean;
  empty?: boolean;
  gsapDriven?: boolean;
  /** Lecture cover hero — sharper strokes, higher glass contrast, no muddy soft edges. */
  coverMode?: boolean;
  /** Liquid/powder vertical offset in source SVG units (not CSS px). */
  fillOffsetY?: number;
  liquidLayer: ReactNode;
  powderLayer: ReactNode;
  liquidLayerRef?: Ref<SVGGElement>;
  powderLayerRef?: Ref<SVGGElement>;
  surfaceRef?: Ref<SVGCircleElement>;
  powderSurfaceY?: number;
};

type VialChrome = {
  label0: string;
  labelMid: string;
  label1: string;
  cap0: string;
  capMid: string;
  cap1: string;
  capHighlight: string;
  capLip: string;
  brandMark: string;
  brandSub: string;
  productPrimary: string;
  productAccent: string;
  badgeBg: string;
  badgeMuted: string;
  badgeCircle: string;
  /** Hospira-style pink band on white label (bac-water only). */
  accentBand?: string;
  metaText?: string;
};

/** Source-space vial center / top used by the outer scale transform. */
export const HEXARELIN_SRC = {
  cx: 258.5,
  top: 35,
  bottom: 335,
  /** Rubber/metal interface — needle target in source coords. */
  stopperY: 48,
  powderSurfaceY: 308,
  interiorTop: 148,
  interiorHeight: 155,
} as const;

/** Fits the source vial into viewBox 0 0 120 205, centered on x=60. */
export const HEXARELIN_VIAL_SCALE = 0.63;
/**
 * Top offset seats the bottle base on the viewBox floor so it shares a
 * surface with the bac-water bottle (xMidYMax) instead of floating.
 * Paired with SCALE 0.63 so the silhouette reads the same height as water.
 */
export const HEXARELIN_VIAL_TOP = 16;
export const HEXARELIN_VIAL_TRANSFORM = `translate(60 ${HEXARELIN_VIAL_TOP}) scale(${HEXARELIN_VIAL_SCALE}) translate(${-HEXARELIN_SRC.cx} ${-HEXARELIN_SRC.top})`;

/** Map a source Y into the outer 120×205 viewBox (for geometry constants). */
export function hexarelinSourceYToViewBox(sourceY: number): number {
  return HEXARELIN_VIAL_TOP + HEXARELIN_VIAL_SCALE * (sourceY - HEXARELIN_SRC.top);
}

function vialChrome(theme: HexarelinVialTheme, coverMode: boolean): VialChrome {
  if (theme === "bac-water-pink") {
    return {
      // White clinical label + magenta accents (vector twin of the product bottle).
      label0: "#ffffff",
      labelMid: "#f7f8fa",
      label1: "#eef0f3",
      cap0: "#ff4fa3",
      capMid: "#e0167a",
      cap1: "#b0105e",
      capHighlight: "#ffb0d8",
      capLip: "#8e0d4c",
      brandMark: coverMode ? "#142644" : "#142644",
      brandSub: "#3853A4",
      productPrimary: "#0a0a0a",
      productAccent: "#0a0a0a",
      badgeBg: "#f3f4f6",
      badgeMuted: "#6b7280",
      badgeCircle: "#e0167a",
      accentBand: "#e0167a",
      metaText: "#111827",
    };
  }

  return {
    label0: "#18263e",
    labelMid: "#101d34",
    label1: "#09172d",
    cap0: "#22334b",
    capMid: "#0d2038",
    cap1: "#07162a",
    capHighlight: "#5e7189",
    capLip: "#071425",
    brandMark: coverMode ? "#e4ec55" : "#d9e84b",
    brandSub: "#ffffff",
    productPrimary: "#ffffff",
    productAccent: "#d9e84b",
    badgeBg: "#29436d",
    badgeMuted: "#8ed8e6",
    badgeCircle: "#345a91",
  };
}

export function HexarelinVialArt({
  uid,
  productName,
  theme = "navy",
  showBack = true,
  showFront = true,
  frontGlass = false,
  powder = false,
  empty = false,
  gsapDriven = false,
  coverMode = false,
  fillOffsetY = 0,
  liquidLayer,
  powderLayer,
  liquidLayerRef,
  powderLayerRef,
  surfaceRef,
  powderSurfaceY = HEXARELIN_SRC.powderSurfaceY,
}: HexarelinVialArtProps) {
  const glassStroke = coverMode ? 1.65 : 1.2;
  const rimStroke = coverMode ? 1.45 : 1.2;
  const neckStroke = coverMode ? 0.48 : 0.35;
  const collarStroke = coverMode ? 0.68 : 0.55;
  const textRender = coverMode ? "geometricPrecision" : undefined;
  const shapeRender = coverMode ? "geometricPrecision" : undefined;
  const fillTransform = gsapDriven ? undefined : `translate(0 ${fillOffsetY})`;
  const chrome = vialChrome(theme, coverMode);
  const glassBody = `hx-glass-${uid}`;
  const glassShade = `hx-shade-${uid}`;
  const labelGrad = `hx-label-${uid}`;
  const labelSheen = `hx-label-sheen-${uid}`;
  const metal = `hx-metal-${uid}`;
  const metalDark = `hx-metal-dark-${uid}`;
  const cap = `hx-cap-${uid}`;
  const planet = `hx-planet-${uid}`;
  const continent = `hx-continent-${uid}`;
  const bottleClip = `hx-bottle-clip-${uid}`;
  const planetClip = `hx-planet-clip-${uid}`;
  const flagClip = `hx-flag-clip-${uid}`;
  const labelClip = `hx-label-clip-${uid}`;
  const labelWrapShade = `hx-label-wrap-${uid}`;
  const labelPath = cylinderLabelPath(194, 145, 130, 126, 4.5);

  const bodyPath =
    "M219 86 L219 105 C219 111 211 116 205 120 C197 125 193 136 193 148 L193 301 C193 318 202 328 218 331 C238 335 280 335 300 331 C316 328 324 318 324 301 L324 148 C324 136 320 125 312 120 C306 116 298 111 298 105 L298 86 Z";

  return (
    <g transform={HEXARELIN_VIAL_TRANSFORM} shapeRendering={shapeRender}>
      <defs>
        <linearGradient id={glassBody} x1="0" y1="0" x2="1" y2="0">
          {coverMode ? (
            <>
              <stop offset="0" stopColor="#7a848e" stopOpacity=".52" />
              <stop offset=".06" stopColor="#ffffff" stopOpacity=".92" />
              <stop offset=".18" stopColor="#e8ecef" stopOpacity=".34" />
              <stop offset=".42" stopColor="#ffffff" stopOpacity=".18" />
              <stop offset=".68" stopColor="#c8cdd2" stopOpacity=".32" />
              <stop offset=".88" stopColor="#ffffff" stopOpacity=".82" />
              <stop offset="1" stopColor="#727b84" stopOpacity=".54" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#88919b" stopOpacity=".48" />
              <stop offset=".08" stopColor="#ffffff" stopOpacity=".8" />
              <stop offset=".22" stopColor="#d8dde1" stopOpacity=".26" />
              <stop offset=".48" stopColor="#ffffff" stopOpacity=".12" />
              <stop offset=".76" stopColor="#d5d9dc" stopOpacity=".28" />
              <stop offset=".92" stopColor="#ffffff" stopOpacity=".72" />
              <stop offset="1" stopColor="#7a838c" stopOpacity=".48" />
            </>
          )}
        </linearGradient>
        <linearGradient id={glassShade} x1="0" y1="0" x2="0" y2="1">
          {coverMode ? (
            <>
              <stop offset="0" stopColor="#ffffff" stopOpacity=".52" />
              <stop offset=".24" stopColor="#b8bec4" stopOpacity=".12" />
              <stop offset=".72" stopColor="#1e252c" stopOpacity=".1" />
              <stop offset="1" stopColor="#0a0e12" stopOpacity=".28" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#ffffff" stopOpacity=".45" />
              <stop offset=".28" stopColor="#a9b0b7" stopOpacity=".14" />
              <stop offset=".78" stopColor="#2a3138" stopOpacity=".08" />
              <stop offset="1" stopColor="#13181d" stopOpacity=".22" />
            </>
          )}
        </linearGradient>
        <linearGradient id={labelGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={chrome.label1} />
          <stop offset=".16" stopColor={chrome.label0} />
          <stop offset=".5" stopColor={chrome.labelMid} />
          <stop offset=".84" stopColor={chrome.label0} />
          <stop offset="1" stopColor={chrome.label1} />
        </linearGradient>
        <linearGradient id={labelSheen} x1="0" y1="0" x2="1" y2="0">
          <stop
            offset="0"
            stopColor={theme === "bac-water-pink" ? "#0f172a" : "#000000"}
            stopOpacity={theme === "bac-water-pink" ? ".14" : ".22"}
          />
          <stop
            offset=".18"
            stopColor="#ffffff"
            stopOpacity={theme === "bac-water-pink" ? ".1" : ".04"}
          />
          <stop offset=".5" stopColor="#ffffff" stopOpacity={theme === "bac-water-pink" ? ".2" : ".08"} />
          <stop
            offset=".82"
            stopColor="#ffffff"
            stopOpacity={theme === "bac-water-pink" ? ".08" : ".03"}
          />
          <stop
            offset="1"
            stopColor={theme === "bac-water-pink" ? "#0f172a" : "#000000"}
            stopOpacity={theme === "bac-water-pink" ? ".16" : ".24"}
          />
        </linearGradient>
        <linearGradient id={labelWrapShade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity=".18" />
          <stop offset=".12" stopColor="#000000" stopOpacity=".05" />
          <stop offset=".5" stopColor="#ffffff" stopOpacity=".06" />
          <stop offset=".88" stopColor="#000000" stopOpacity=".05" />
          <stop offset="1" stopColor="#000000" stopOpacity=".2" />
        </linearGradient>
        <linearGradient id={metal} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a7a7a7" />
          <stop offset=".1" stopColor="#f2f2f2" />
          <stop offset=".27" stopColor="#b9b9b9" />
          <stop offset=".43" stopColor="#ffffff" />
          <stop offset=".62" stopColor="#b8b8b8" />
          <stop offset=".78" stopColor="#f3f3f3" />
          <stop offset="1" stopColor="#999999" />
        </linearGradient>
        <linearGradient id={metalDark} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8f8f8" />
          <stop offset=".45" stopColor="#bebebe" />
          <stop offset="1" stopColor="#787878" />
        </linearGradient>
        <linearGradient id={cap} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={chrome.cap0} />
          <stop offset=".55" stopColor={chrome.capMid} />
          <stop offset="1" stopColor={chrome.cap1} />
        </linearGradient>
        <radialGradient id={planet} cx=".38" cy=".35" r=".76">
          <stop offset="0" stopColor="#31acc9" />
          <stop offset=".44" stopColor="#2862ac" />
          <stop offset=".78" stopColor="#252d7c" />
          <stop offset="1" stopColor="#151a54" />
        </radialGradient>
        <radialGradient id={continent} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#edf45a" />
          <stop offset=".4" stopColor="#a8ca2f" />
          <stop offset="1" stopColor="#557f21" />
        </radialGradient>
        <clipPath id={bottleClip}>
          <path d={bodyPath} />
        </clipPath>
        <clipPath id={planetClip}>
          <path d={labelPath} />
        </clipPath>
        <clipPath id={labelClip}>
          <path d={labelPath} />
        </clipPath>
        <clipPath id={flagClip}>
          <circle cx="257.5" cy="254.5" r="7.1" />
        </clipPath>
      </defs>

      {showBack ? (
        <>
          <ellipse cx="258" cy="328" rx="67" ry="10" fill="#111827" opacity="0.2" />

          {/*
            Clip stays on an outer group with NO CSS transform / will-change.
            Motion lives on the inner <g> via SVG transform only — otherwise
            Chrome lets the fill rectangle escape the bottle silhouette.
          */}
          <g clipPath={`url(#${bottleClip})`}>
            {gsapDriven ? (
              <>
                <g
                  ref={liquidLayerRef}
                  data-vial-liquid-layer
                  opacity={powder || empty ? 0 : 1}
                >
                  {liquidLayer}
                  {/* Bubbles live inside the liquid layer so they rise with the fill */}
                  <HexarelinMixBubbles />
                </g>
                {/*
                  Always paint an opaque label plate above liquid/powder in the
                  label band. Front labels can be dimmed by focus(); this plate
                  stops liquid from reading through the paper.
                */}
                <g transform="translate(0 18)" pointerEvents="none" data-vial-label-mask>
                  <path d={labelPath} fill="#09172d" />
                </g>
                <g
                  ref={powderLayerRef}
                  data-vial-powder-layer
                  opacity={powder && !empty ? 1 : 0}
                >
                  {powderLayer}
                </g>
              </>
            ) : powder && !empty ? (
              <>
                {/* Powder stays under glass, then a second pass above the base
                    shade so the cake reads clearly in the bottom window. */}
                <g data-vial-powder-layer {...(fillTransform ? { transform: fillTransform } : {})}>
                  {powderLayer}
                </g>
              </>
            ) : (
              <g
                ref={liquidLayerRef}
                data-vial-liquid-layer
                {...(empty
                  ? { transform: `translate(0 ${HEXARELIN_SRC.interiorHeight - 6})` }
                  : fillTransform
                    ? { transform: fillTransform }
                    : {})}
                opacity={empty ? 0 : 1}
              >
                {liquidLayer}
              </g>
            )}
            {/* Mask liquid behind the label area in non-gsap liquid mode too */}
            {!gsapDriven && !powder && !empty ? (
              <g transform="translate(0 18)" pointerEvents="none">
                <path d={labelPath} fill="#09172d" />
              </g>
            ) : null}
            {/* Bubbles render on the front layer during animation (see showFront). */}
          </g>

          <circle data-vial-stopper cx={HEXARELIN_SRC.cx} cy={HEXARELIN_SRC.stopperY} r="2" fill="transparent" />
          {powder && !gsapDriven ? (
            <circle
              ref={surfaceRef}
              data-vial-liquid-surface
              cx={HEXARELIN_SRC.cx}
              cy={powderSurfaceY}
              r="2"
              fill="transparent"
            />
          ) : (
            <circle
              ref={surfaceRef}
              data-vial-liquid-surface
              cx={HEXARELIN_SRC.cx}
              cy={HEXARELIN_SRC.interiorTop + 1}
              r="2"
              fill="transparent"
              {...(!gsapDriven
                ? {
                    transform: empty
                      ? `translate(0 ${HEXARELIN_SRC.interiorHeight - 6})`
                      : fillTransform,
                  }
                : {})}
            />
          )}
        </>
      ) : null}

      {showFront ? (
        <>
          {/* Glass chrome — keep at full opacity; soft glass comes from the gradient itself */}
          <g opacity={1}>
            <path
              d={bodyPath}
              fill={`url(#${glassBody})`}
              stroke="#7e858c"
              strokeOpacity={coverMode ? 0.58 : 0.46}
              strokeWidth={glassStroke}
            />

            {/* Base glass weight — muted in powder mode so it doesn't read as liquid */}
            <path
              d="M197 299 C197 315 205 323 220 326 C240 330 278 330 298 326 C313 323 320 315 320 299 L320 310 C320 324 312 331 298 334 C278 338 240 338 220 334 C206 331 197 324 197 310 Z"
              fill={`url(#${glassShade})`}
              opacity={powder ? (coverMode ? 0.28 : 0.18) : coverMode ? 0.88 : 0.8}
            />
            <ellipse cx="258.5" cy="318" rx="60.5" ry="11" fill="#4e565e" opacity={powder ? 0.08 : coverMode ? 0.2 : 0.17} />
            <ellipse cx="258.5" cy="318" rx="55" ry="8.2" fill="#ffffff" opacity={powder ? 0.1 : coverMode ? 0.28 : 0.22} />

            {/* Dry cake painted above base glass so it stays visible under the label */}
            {powder && !empty && !gsapDriven ? (
              <g clipPath={`url(#${bottleClip})`} data-vial-powder-front>
                {powderLayer}
              </g>
            ) : null}

            {/*
              Glass reflections MUST render BEFORE the label so the paper label
              fully covers the shine strips inside its rect. Reflections above
              the label (shoulder) and below the label (base) remain visible.
            */}
            <g clipPath={`url(#${bottleClip})`}>
              {/* Broad left-side refraction wash */}
              <path
                d="M205 103 C201 128 202 157 203 186 L203 291 C203 305 208 315 216 321 L224 323 C216 306 215 285 215 260 L215 136 C215 121 218 111 226 104 Z"
                fill="#ffffff"
                opacity={coverMode ? 0.32 : 0.28}
              />
              {/* Right-side softer refraction */}
              <path
                d="M292 102 C305 118 311 132 312 149 L312 297 C312 311 306 322 298 326 L294 326 C299 309 300 290 300 266 L300 131 C300 118 297 109 292 102 Z"
                fill="#ffffff"
                opacity={coverMode ? 0.21 : 0.17}
              />
              {/* Bright specular shine strip on the visible left glass */}
              <path
                d="M208 122 L212 122 L212 320 L208 320 Z"
                fill="#ffffff"
                opacity="0.55"
              />
              {/* Softer secondary shine */}
              <path
                d="M216 122 L219 122 L219 320 L216 320 Z"
                fill="#ffffff"
                opacity="0.22"
              />
              {/* Right-side highlight edge */}
              <path
                d="M303 122 L306 122 L306 320 L303 320 Z"
                fill="#ffffff"
                opacity="0.28"
              />
              {/* Shoulder crown reflection */}
              <ellipse cx="260" cy="127" rx="50" ry="12" fill="#ffffff" opacity={coverMode ? 0.24 : 0.2} />
              <ellipse cx="260" cy="124" rx="38" ry="4" fill="#ffffff" opacity="0.55" />
              {/* Base curve reflection */}
              <ellipse cx="260" cy="322" rx="52" ry="7" fill="#ffffff" opacity="0.18" />
              <ellipse cx="260" cy="329" rx="46" ry="3" fill="#0f172a" opacity="0.22" />
            </g>
          </g>

          {/* Label + branding — wrapped on the cylinder; opaque so liquid never shows through */}
          <g opacity="1" fillOpacity="1" data-vial-label-layer>
          {theme === "bac-water-pink" ? (
            <>
              <path d={labelPath} fill="#ffffff" />
              <path d={labelPath} fill={`url(#${labelGrad})`} />
              <path d={labelPath} fill={`url(#${labelSheen})`} />
              <path d={labelPath} fill={`url(#${labelWrapShade})`} />
              <path d={labelPath} fill="none" stroke="#d1d5db" strokeWidth="1.2" />
            </>
          ) : (
            <g transform="translate(0 18)">
              {/* Double solid backing — liquid must never read through the paper */}
              <path d={labelPath} fill="#09172d" />
              <path d={labelPath} fill="#0c1a30" />
              <path d={labelPath} fill={`url(#${labelGrad})`} />
              <path d={labelPath} fill={`url(#${labelSheen})`} />
              <path d={labelPath} fill={`url(#${labelWrapShade})`} />
            </g>
          )}

          {theme === "bac-water-pink" ? (
            <>
              <text
                x="200"
                y="168"
                fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                fontSize="16"
                fontWeight="800"
                letterSpacing="-1"
                fill={chrome.brandMark}
                textRendering={textRender}
              >
                HOLS.
              </text>
              <text
                x="200"
                y="180"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="5.2"
                fontWeight="600"
                fill={chrome.brandSub}
                textRendering={textRender}
              >
                house of life science
              </text>
              <text
                x="200"
                y="196"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="5.4"
                fontWeight="700"
                fill={chrome.metaText ?? "#111827"}
              >
                30 mL Multiple-dose
              </text>
              <path
                d={cylinderLabelPath(194, 206, 130, 62, 2.8)}
                fill={chrome.accentBand ?? "#e0167a"}
              />
              <path
                d={cylinderLabelPath(194, 206, 130, 62, 2.8)}
                fill={`url(#${labelWrapShade})`}
              />
              <text
                x="200"
                y="230"
                fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                fontSize="11.5"
                fontWeight="800"
                letterSpacing="-0.35"
                fill="#0a0a0a"
              >
                BACTERIOSTATIC
              </text>
              <text
                x="200"
                y="248"
                fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                fontSize="15.5"
                fontWeight="800"
                letterSpacing="-0.5"
                fill="#0a0a0a"
              >
                WATER
              </text>
              <text
                x="200"
                y="261"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="6.2"
                fontWeight="500"
                fill="#111827"
              >
                for Injection, USP
              </text>
              <text
                x="200"
                y="272"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="5"
                fontWeight="500"
                fill={chrome.badgeMuted}
              >
                Manufactured in the USA
              </text>
              <circle cx="304" cy="278" r="7.5" fill={chrome.badgeCircle} />
              <circle cx="304" cy="278" r="3.2" fill="#ffffff" opacity="0.9" />
            </>
          ) : (
            <g transform="translate(0 18)">
              <text
                x="198"
                y="178"
                fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                fontSize={coverMode ? "19.5" : "19"}
                fontWeight="800"
                letterSpacing={coverMode ? "-1" : "-1.2"}
                fill={chrome.brandMark}
                textRendering={textRender}
              >
                HOLS.
              </text>
              <text
                x="250"
                y="168.5"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize={coverMode ? "5.4" : "5.1"}
                fontWeight="700"
                fill={chrome.brandSub}
                textRendering={textRender}
              >
                house of
              </text>
              <text
                x="250"
                y="175"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize={coverMode ? "5.4" : "5.1"}
                fontWeight="700"
                fill={chrome.brandSub}
                textRendering={textRender}
              >
                life science
              </text>

              {productName ? (
                productName.includes(" ") ? (
                  <>
                    <text
                      x="198"
                      y="210"
                      fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                      fontSize="14"
                      fontWeight="500"
                      letterSpacing="-0.6"
                      fill={chrome.productPrimary}
                    >
                      {productName.slice(0, productName.lastIndexOf(" "))}
                    </text>
                    <text
                      x="198"
                      y="228"
                      fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                      fontSize="14"
                      fontWeight="500"
                      letterSpacing="-0.6"
                      fill={chrome.productAccent}
                    >
                      {productName.slice(productName.lastIndexOf(" ") + 1)}
                    </text>
                  </>
                ) : (
                  <text
                    x="198"
                    y="215"
                    fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                    fontSize="15"
                    fontWeight="500"
                    letterSpacing="-0.6"
                    fill={chrome.productPrimary}
                  >
                    {productName}
                  </text>
                )
              ) : null}

              <g clipPath={`url(#${planetClip})`}>
                <circle cx="334" cy="251" r="54" fill={`url(#${planet})`} />
                <circle cx="334" cy="251" r="54" fill="none" stroke="#6fc4d7" strokeOpacity="0.42" />
                <path
                  d="M310 214 C314 204 326 200 335 207 C341 212 341 221 337 227 C333 232 326 233 319 229 C313 226 307 222 310 214 Z"
                  fill={`url(#${continent})`}
                />
                <path
                  d="M330 211 C336 208 343 211 346 216 C348 221 346 226 341 229 C337 231 332 228 330 224 C328 220 327 215 330 211 Z"
                  fill="#dce947"
                  opacity="0.8"
                />
                <path
                  d="M303 241 C311 233 322 232 330 239 C337 245 336 255 329 261 C321 268 310 266 304 257 C300 252 299 246 303 241 Z"
                  fill="#234d9b"
                  opacity="0.45"
                />
                <ellipse
                  cx="315"
                  cy="226"
                  rx="12"
                  ry="20"
                  fill="#ffffff"
                  opacity="0.08"
                  transform="rotate(24 315 226)"
                />
              </g>

              <rect x="199" y="242" width="55" height="25" rx="7" fill={chrome.badgeBg} opacity="0.82" />
              <text
                x="204"
                y="251"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="5"
                fontWeight="400"
                fill={chrome.badgeMuted}
              >
                Manufactured
              </text>
              <text
                x="204"
                y="257.5"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="5"
                fontWeight="400"
                fill="#ffffff"
              >
                in the USA
              </text>
              <circle cx="257.5" cy="254.5" r="8.4" fill={chrome.badgeCircle} />
              <g clipPath={`url(#${flagClip})`}>
                <rect x="250.2" y="247.2" width="14.6" height="14.6" fill="#ffffff" />
                <g stroke="#e95d61" strokeWidth="1.1">
                  <line x1="250" y1="248.2" x2="265" y2="248.2" />
                  <line x1="250" y1="250.4" x2="265" y2="250.4" />
                  <line x1="250" y1="252.6" x2="265" y2="252.6" />
                  <line x1="250" y1="254.8" x2="265" y2="254.8" />
                  <line x1="250" y1="257" x2="265" y2="257" />
                  <line x1="250" y1="259.2" x2="265" y2="259.2" />
                  <line x1="250" y1="261.4" x2="265" y2="261.4" />
                </g>
                <rect x="250.2" y="247.2" width="6.3" height="6.2" fill="#294c85" />
                <g fill="#ffffff" opacity="0.9">
                  <circle cx="251.8" cy="248.6" r="0.25" />
                  <circle cx="253.4" cy="248.6" r="0.25" />
                  <circle cx="255" cy="248.6" r="0.25" />
                  <circle cx="252.6" cy="250" r="0.25" />
                  <circle cx="254.2" cy="250" r="0.25" />
                  <circle cx="251.8" cy="251.4" r="0.25" />
                  <circle cx="253.4" cy="251.4" r="0.25" />
                  <circle cx="255" cy="251.4" r="0.25" />
                </g>
              </g>
            </g>
          )}

          {/* Top rim (glass-to-collar seam) */}
          <path
            d="M205 120 C221 126 295 126 312 120"
            fill="none"
            stroke="#ffffff"
            strokeOpacity={coverMode ? 0.65 : 0.55}
            strokeWidth={rimStroke + 0.2}
          />
          <path
            d="M205 121 C221 128 295 128 312 121"
            fill="none"
            stroke="#5b6169"
            strokeOpacity={coverMode ? 0.4 : 0.32}
            strokeWidth={coverMode ? 1 : 0.85}
          />

          {/* Neck */}
          <rect
            x="220"
            y="82"
            width="78"
            height="34"
            rx="4"
            fill={`url(#${glassBody})`}
            stroke="#8c9298"
            strokeOpacity={neckStroke + 0.12}
            strokeWidth={coverMode ? 1.1 : 1}
          />
          <ellipse cx="259" cy="87" rx="39" ry="6" fill="#ffffff" opacity={coverMode ? 0.5 : 0.42} />
          <ellipse cx="259" cy="107" rx="37" ry="5" fill="#9ca3aa" opacity={coverMode ? 0.22 : 0.18} />

          {/* Aluminum collar */}
          <rect
            x="201"
            y="51"
            width="115"
            height="38"
            rx="5"
            fill={`url(#${metal})`}
            stroke="#909090"
            strokeOpacity={collarStroke}
            strokeWidth={coverMode ? 1.15 : 1}
          />
          <rect x="201" y="55" width="115" height="5" rx="2.5" fill="#ffffff" opacity={coverMode ? 0.52 : 0.45} />
          <rect x="201" y="82" width="115" height="6" rx="3" fill={`url(#${metalDark})`} opacity={coverMode ? 0.95 : 0.9} />
          <g opacity={coverMode ? 0.26 : 0.2} stroke="#5f5f5f" strokeWidth={coverMode ? 0.72 : 0.6}>
            {Array.from({ length: 26 }).map((_, i) => {
              const x = 207 + i * 4;
              return <line key={x} x1={x} y1="58" x2={x} y2="84" />;
            })}
          </g>

          {/* Flip-cap (navy med / pink bac-water) */}
          <rect x="194" y="35" width="129" height="21" rx="5.5" fill={`url(#${cap})`} />
          <rect
            x="199"
            y="36.5"
            width="119"
            height="3.5"
            rx="2"
            fill={chrome.capHighlight}
            opacity={coverMode ? 0.32 : 0.25}
          />
          <rect
            x="194"
            y="52"
            width="129"
            height="4"
            rx="2"
            fill={chrome.capLip}
            opacity={coverMode ? 0.42 : 0.36}
          />
          {coverMode ? (
            <path
              d="M194 35.5 H323"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.18"
              strokeWidth="0.9"
            />
          ) : null}
          </g>
        </>
      ) : null}
    </g>
  );
}

/** Powder cake — kept in the clear glass band BELOW the label so the dry
 *  cake is visible. Uneven cream surface so it never reads as liquid. */
export function HexarelinPowderCake({ fillRatio = 0.2 }: { fillRatio?: number }) {
  const clamped = Math.min(0.95, Math.max(0.08, fillRatio));
  // Label (after +18 shift) ends ~289; base cake sits ~318. Visible window ≈ 289–318.
  const baseY = 318;
  const maxVisibleH = 26;
  const h = 7 + clamped * maxVisibleH;
  const topY = baseY - h;
  return (
    <g data-vial-powder-cake>
      <path
        d={`M202 ${topY + 2}
            C210 ${topY - 3} 222 ${topY + 5} 236 ${topY - 1}
            C248 ${topY - 4} 258 ${topY + 3} 270 ${topY - 2}
            C282 ${topY - 5} 295 ${topY + 4} 314 ${topY + 1}
            L314 316 C314 324 296 330 258.5 330 C221 330 202 324 202 316 Z`}
        fill="#efe6d6"
      />
      <path
        d={`M208 ${topY + 3}
            C220 ${topY - 1} 235 ${topY + 6} 250 ${topY + 1}
            C262 ${topY - 2} 278 ${topY + 5} 308 ${topY + 2}
            L308 ${topY + 12} L208 ${topY + 12} Z`}
        fill="#faf6ee"
        opacity="0.95"
      />
      {/* Clumpy highlights — reads as lyophilized cake, not a meniscus */}
      <ellipse cx="232" cy={topY + 4} rx="9" ry="3.2" fill="#fffdf8" opacity="0.85" />
      <ellipse cx="258" cy={topY + 2} rx="11" ry="3.6" fill="#e5dcc8" opacity="0.7" />
      <ellipse cx="286" cy={topY + 5} rx="8" ry="2.8" fill="#fffdf8" opacity="0.75" />
      <circle cx="244" cy={topY + 8} r="1.4" fill="#d9d0be" opacity="0.8" />
      <circle cx="267" cy={topY + 9} r="1.1" fill="#d9d0be" opacity="0.7" />
      <circle cx="278" cy={topY + 7} r="1.3" fill="#cfc5b2" opacity="0.65" />
      <circle cx="225" cy={topY + 10} r="1" fill="#cfc5b2" opacity="0.6" />
    </g>
  );
}

/** Small reconstitution bubbles — drawn inside the liquid layer (below the meniscus). */
export function HexarelinMixBubbles() {
  const { interiorTop, cx } = HEXARELIN_SRC;
  // Prefer the lower liquid band (below the label mask ~289) so bubbles stay
  // visible in clear glass as the vial fills. A few sit nearer the meniscus
  // for the early low-fill moments.
  const bubbles = [
    { cx: cx - 26, cy: interiorTop + 22, r: 1.8 },
    { cx: cx + 10, cy: interiorTop + 30, r: 1.4 },
    { cx: cx - 8, cy: interiorTop + 48, r: 2.0 },
    { cx: cx + 24, cy: interiorTop + 56, r: 1.3 },
    { cx: cx - 22, cy: interiorTop + 100, r: 2.2 },
    { cx: cx + 6, cy: interiorTop + 108, r: 1.6 },
    { cx: cx - 14, cy: interiorTop + 118, r: 1.9 },
    { cx: cx + 20, cy: interiorTop + 126, r: 1.5 },
    { cx: cx - 30, cy: interiorTop + 134, r: 1.2 },
    { cx: cx + 14, cy: interiorTop + 140, r: 2.1 },
    { cx: cx - 4, cy: interiorTop + 148, r: 1.7 },
    { cx: cx + 28, cy: interiorTop + 152, r: 1.3 },
    { cx: cx - 18, cy: interiorTop + 158, r: 1.5 },
    { cx: cx + 8, cy: interiorTop + 164, r: 1.8 },
  ];
  return (
    <g data-vial-mix-bubbles opacity="0" pointerEvents="none">
      {bubbles.map((b, i) => (
        <circle
          key={i}
          data-vial-mix-bubble
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          fill="#ffffff"
          opacity="0.75"
          stroke="#8ebfd4"
          strokeWidth="0.5"
          strokeOpacity="0.55"
        />
      ))}
    </g>
  );
}

/** Liquid column in Hexarelin source coordinates. */
export function HexarelinLiquidFill({
  paletteTop,
  paletteBottom,
  paletteEdge,
  coverMode = false,
}: {
  paletteTop: string;
  paletteBottom: string;
  paletteEdge: string;
  coverMode?: boolean;
}) {
  const { interiorTop, interiorHeight, cx } = HEXARELIN_SRC;
  /** Slightly inset so fill never kisses the glass stroke even if clip is late. */
  const x = 198;
  const w = 121;
  const bottomOpacity = coverMode ? 0.92 : 0.85;
  const topOpacity = coverMode ? 0.42 : 0.35;
  const surfaceOpacity = coverMode ? 0.82 : 0.7;
  return (
    <>
      <rect x={x} y={interiorTop} width={w} height={interiorHeight + 20} fill={paletteBottom} opacity={bottomOpacity} />
      <rect x={x} y={interiorTop} width={w} height={interiorHeight + 20} fill={paletteTop} opacity={topOpacity} />
      <ellipse cx={cx} cy={interiorTop + 1} rx="54" ry="5" fill={paletteTop} opacity={surfaceOpacity} />
      <path
        d={`M202 ${interiorTop + 2} Q${cx} ${interiorTop - 4} 314 ${interiorTop + 2}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={coverMode ? 1.65 : 1.4}
        opacity={coverMode ? 0.45 : 0.35}
      />
      <ellipse cx={cx} cy={interiorTop + interiorHeight} rx="54" ry="6" fill={paletteEdge} opacity={coverMode ? 0.32 : 0.25} />
    </>
  );
}
