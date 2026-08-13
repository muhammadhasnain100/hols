/**
 * Hexarelin serum-vial artwork adapted from the editable vector SVG.
 * Drawn in source coords (vial around x≈258.5, y 35–335), then scaled into
 * the calculator viewBox via `HEXARELIN_VIAL_TRANSFORM`.
 *
 * Branding corrected to HOLS. / house of life science (generator had placeholders).
 */

import type { ReactNode, Ref } from "react";

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
export const HEXARELIN_VIAL_SCALE = 0.56;
/** Top offset chosen so the bottle base sits near the viewBox bottom (pairs with bac-water). */
export const HEXARELIN_VIAL_TOP = 30;
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
        <linearGradient id={labelGrad} x1="0" y1="0" x2="1" y2=".1">
          <stop offset="0" stopColor={chrome.label0} />
          <stop offset=".48" stopColor={chrome.labelMid} />
          <stop offset="1" stopColor={chrome.label1} />
        </linearGradient>
        <linearGradient id={labelSheen} x1="0" y1="0" x2="1" y2="0">
          <stop
            offset="0"
            stopColor="#ffffff"
            stopOpacity={theme === "bac-water-pink" ? ".28" : ".15"}
          />
          <stop
            offset=".17"
            stopColor="#ffffff"
            stopOpacity={theme === "bac-water-pink" ? ".08" : ".03"}
          />
          <stop offset=".76" stopColor="#ffffff" stopOpacity="0" />
          <stop
            offset="1"
            stopColor="#ffffff"
            stopOpacity={theme === "bac-water-pink" ? ".12" : ".05"}
          />
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
          <rect x="194" y="145" width="130" height="174" rx="4" />
        </clipPath>
        <clipPath id={flagClip}>
          <circle cx="257.5" cy="298.5" r="7.1" />
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
              <g data-vial-liquid-layer data-vial-powder="true" transform={fillTransform}>
                {powderLayer}
              </g>
            ) : (
              <g
                ref={liquidLayerRef}
                data-vial-liquid-layer
                transform={empty ? `translate(0 ${HEXARELIN_SRC.interiorHeight - 6})` : fillTransform}
                opacity={empty ? 0 : 1}
              >
                {liquidLayer}
              </g>
            )}
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
              transform={gsapDriven ? undefined : empty ? `translate(0 ${HEXARELIN_SRC.interiorHeight - 6})` : fillTransform}
            />
          )}
        </>
      ) : null}

      {showFront ? (
        <g opacity={frontGlass ? 0.92 : 1}>
          <path
            d={bodyPath}
            fill={`url(#${glassBody})`}
            stroke="#7e858c"
            strokeOpacity={coverMode ? 0.58 : 0.46}
            strokeWidth={glassStroke}
          />

          <path
            d="M197 299 C197 315 205 323 220 326 C240 330 278 330 298 326 C313 323 320 315 320 299 L320 310 C320 324 312 331 298 334 C278 338 240 338 220 334 C206 331 197 324 197 310 Z"
            fill={`url(#${glassShade})`}
            opacity={coverMode ? 0.88 : 0.8}
          />
          <ellipse cx="258.5" cy="318" rx="60.5" ry="11" fill="#4e565e" opacity={coverMode ? 0.2 : 0.17} />
          <ellipse cx="258.5" cy="318" rx="55" ry="8.2" fill="#ffffff" opacity={coverMode ? 0.28 : 0.22} />

          {/* Label */}
          <rect x="194" y="145" width="130" height="174" rx="4" fill={`url(#${labelGrad})`} />
          <rect x="194" y="145" width="130" height="174" rx="4" fill={`url(#${labelSheen})`} />
          {theme === "bac-water-pink" ? (
            <rect
              x="194"
              y="145"
              width="130"
              height="174"
              rx="4"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="1.2"
            />
          ) : (
            <>
              <path d="M198 149 L214 149 L214 315 L199 315 Z" fill="#ffffff" opacity="0.035" />
              <path d="M320 149 L324 149 L324 315 L320 315 Z" fill="#ffffff" opacity="0.035" />
            </>
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
              <rect x="194" y="206" width="130" height="62" fill={chrome.accentBand ?? "#e0167a"} />
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
                y="292"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="5"
                fontWeight="500"
                fill={chrome.badgeMuted}
              >
                Manufactured in the USA
              </text>
              <circle cx="304" cy="298" r="7.5" fill={chrome.badgeCircle} />
              <circle cx="304" cy="298" r="3.2" fill="#ffffff" opacity="0.9" />
            </>
          ) : (
            <>
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
                      y="219"
                      fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                      fontSize="15"
                      fontWeight="500"
                      letterSpacing="-0.6"
                      fill={chrome.productPrimary}
                    >
                      {productName.slice(0, productName.lastIndexOf(" "))}
                    </text>
                    <text
                      x="198"
                      y="238"
                      fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                      fontSize="15"
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
                    y="226"
                    fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
                    fontSize="16"
                    fontWeight="500"
                    letterSpacing="-0.6"
                    fill={chrome.productPrimary}
                  >
                    {productName}
                  </text>
                )
              ) : null}

              <g clipPath={`url(#${planetClip})`}>
                <circle cx="334" cy="275" r="54" fill={`url(#${planet})`} />
                <circle cx="334" cy="275" r="54" fill="none" stroke="#6fc4d7" strokeOpacity="0.42" />
                <path
                  d="M310 238 C314 228 326 224 335 231 C341 236 341 245 337 251 C333 256 326 257 319 253 C313 250 307 246 310 238 Z"
                  fill={`url(#${continent})`}
                />
                <path
                  d="M330 235 C336 232 343 235 346 240 C348 245 346 250 341 253 C337 255 332 252 330 248 C328 244 327 239 330 235 Z"
                  fill="#dce947"
                  opacity="0.8"
                />
                <path
                  d="M303 265 C311 257 322 256 330 263 C337 269 336 279 329 285 C321 292 310 290 304 281 C300 276 299 270 303 265 Z"
                  fill="#234d9b"
                  opacity="0.45"
                />
                <ellipse
                  cx="315"
                  cy="250"
                  rx="12"
                  ry="20"
                  fill="#ffffff"
                  opacity="0.08"
                  transform="rotate(24 315 250)"
                />
              </g>

              <rect x="199" y="286" width="55" height="25" rx="7" fill={chrome.badgeBg} opacity="0.82" />
              <text
                x="204"
                y="295"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="5"
                fontWeight="400"
                fill={chrome.badgeMuted}
              >
                Manufactured
              </text>
              <text
                x="204"
                y="301.5"
                fontFamily="var(--font-secondary-stack, Arial, Helvetica, sans-serif)"
                fontSize="5"
                fontWeight="400"
                fill="#ffffff"
              >
                in the USA
              </text>
              <circle cx="257.5" cy="298.5" r="8.4" fill={chrome.badgeCircle} />
              <g clipPath={`url(#${flagClip})`}>
                <rect x="250.2" y="291.2" width="14.6" height="14.6" fill="#ffffff" />
                <g stroke="#e95d61" strokeWidth="1.1">
                  <line x1="250" y1="292.2" x2="265" y2="292.2" />
                  <line x1="250" y1="294.4" x2="265" y2="294.4" />
                  <line x1="250" y1="296.6" x2="265" y2="296.6" />
                  <line x1="250" y1="298.8" x2="265" y2="298.8" />
                  <line x1="250" y1="301" x2="265" y2="301" />
                  <line x1="250" y1="303.2" x2="265" y2="303.2" />
                  <line x1="250" y1="305.4" x2="265" y2="305.4" />
                </g>
                <rect x="250.2" y="291.2" width="6.3" height="6.2" fill="#294c85" />
                <g fill="#ffffff" opacity="0.9">
                  <circle cx="251.8" cy="292.6" r="0.25" />
                  <circle cx="253.4" cy="292.6" r="0.25" />
                  <circle cx="255" cy="292.6" r="0.25" />
                  <circle cx="252.6" cy="294" r="0.25" />
                  <circle cx="254.2" cy="294" r="0.25" />
                  <circle cx="251.8" cy="295.4" r="0.25" />
                  <circle cx="253.4" cy="295.4" r="0.25" />
                  <circle cx="255" cy="295.4" r="0.25" />
                </g>
              </g>
            </>
          )}

          {/* Reflections */}
          <g clipPath={`url(#${bottleClip})`}>
            <path
              d="M205 103 C201 128 202 157 203 186 L203 291 C203 305 208 315 216 321 L224 323 C216 306 215 285 215 260 L215 136 C215 121 218 111 226 104 Z"
              fill="#ffffff"
              opacity={coverMode ? 0.28 : 0.23}
            />
            <path
              d="M292 102 C305 118 311 132 312 149 L312 297 C312 311 306 322 298 326 L294 326 C299 309 300 290 300 266 L300 131 C300 118 297 109 292 102 Z"
              fill="#ffffff"
              opacity={coverMode ? 0.19 : 0.15}
            />
            <ellipse cx="260" cy="127" rx="50" ry="14" fill="#ffffff" opacity={coverMode ? 0.2 : 0.15} />
            {coverMode ? (
              <path
                d="M210 118 L210 290"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeOpacity="0.14"
                strokeLinecap="round"
              />
            ) : null}
          </g>

          <path
            d="M205 120 C221 126 295 126 312 120"
            fill="none"
            stroke="#ffffff"
            strokeOpacity={coverMode ? 0.52 : 0.42}
            strokeWidth={rimStroke}
          />
          <path
            d="M205 121 C221 128 295 128 312 121"
            fill="none"
            stroke="#727980"
            strokeOpacity={coverMode ? 0.36 : 0.28}
            strokeWidth={coverMode ? 1 : 0.8}
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
      ) : null}
    </g>
  );
}

/** Powder cake in Hexarelin source coordinates (inside bottle clip). */
export function HexarelinPowderCake({ fillRatio = 0.2 }: { fillRatio?: number }) {
  const clamped = Math.min(0.95, Math.max(0.06, fillRatio));
  const h = 28 + clamped * 22;
  const topY = 318 - h;
  return (
    <>
      <path
        d={`M200 ${topY} C200 ${topY + 8} 317 ${topY + 8} 317 ${topY} L317 316 C317 324 298 330 258.5 330 C219 330 200 324 200 316 Z`}
        fill="#f8fafc"
      />
      <ellipse cx="258.5" cy={topY} rx="56" ry="6" fill="#ffffff" />
      <ellipse cx="258.5" cy={topY + 2} rx="44" ry="3.5" fill="#e2e8f0" opacity="0.5" />
    </>
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
