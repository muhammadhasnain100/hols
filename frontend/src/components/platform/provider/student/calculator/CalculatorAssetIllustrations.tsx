"use client";

import { useId } from "react";
import { SYRINGE_IMAGE_SCALE } from "@/components/platform/provider/student/calculator/calculatorAssets";
import type { MassUnit, SyringeSizeMl } from "@/lib/integrate/provider/student/calculator";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Colour palettes                                                            */
/* -------------------------------------------------------------------------- */

type LiquidPalette = {
  top: string;
  bottom: string;
  edge: string;
  powder: string;
  cap: string;
  capDark: string;
  glow: string;
};

function peptidePalette(unit: MassUnit = "mg"): LiquidPalette {
  switch (unit) {
    case "g":
      return {
        top: "#ede1ff",
        bottom: "#9a78e0",
        edge: "#7d59c9",
        powder: "#ece2fb",
        cap: "#8f6fd6",
        capDark: "#6f4fbd",
        glow: "rgba(159,126,224,0.35)",
      };
    case "mcg":
      return {
        top: "#ffe6cf",
        bottom: "#f0a15a",
        edge: "#d67f36",
        powder: "#f7ead2",
        cap: "#ef9a4f",
        capDark: "#cf7a30",
        glow: "rgba(240,161,90,0.35)",
      };
    default:
      return {
        top: "#d9f6ef",
        bottom: "#48bfae",
        edge: "#2f9c8c",
        powder: "#f1eccf",
        cap: "#3fb8a6",
        capDark: "#2c9587",
        glow: "rgba(72,191,174,0.35)",
      };
  }
}

const WATER_PALETTE: LiquidPalette = {
  top: "#dcf5fb",
  bottom: "#6cc6dd",
  edge: "#3fa7c4",
  powder: "#dcf5fb",
  cap: "#5aa8d8",
  capDark: "#3d84bb",
  glow: "rgba(108,198,221,0.35)",
};

const LIQUID_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

/* -------------------------------------------------------------------------- */
/*  Vial                                                                       */
/* -------------------------------------------------------------------------- */

type AssetVialProps = {
  label: string;
  fillRatio?: number;
  variant?: "water" | "peptide";
  peptideUnit?: MassUnit;
  powder?: boolean;
  empty?: boolean;
  mini?: boolean;
  active?: boolean;
  showGlow?: boolean;
  instantFill?: boolean;
  className?: string;
};

// Vial glass interior bounds (viewBox 0 0 100 250).
const VIAL_INTERIOR_TOP = 80;
const VIAL_INTERIOR_HEIGHT = 153;

export function AssetVial({
  label,
  fillRatio = 0.75,
  variant = "water",
  peptideUnit = "mg",
  powder = false,
  empty = false,
  mini = false,
  active: _active = false,
  showGlow: _showGlow = true,
  instantFill = false,
  className,
}: AssetVialProps) {
  const uid = useId().replace(/:/g, "");
  const palette = variant === "water" ? WATER_PALETTE : peptidePalette(peptideUnit);

  const isEmpty = empty || (!powder && fillRatio <= 0.02);
  const clamped = isEmpty ? 0 : Math.min(0.95, Math.max(0.06, fillRatio));
  const offsetY = (1 - clamped) * VIAL_INTERIOR_HEIGHT;
  const waterEmpty = variant === "water" && isEmpty;

  const glassId = `vial-glass-${uid}`;
  const sheenId = `vial-sheen-${uid}`;
  const liquidId = `vial-liquid-${uid}`;
  const capId = `vial-cap-${uid}`;
  const clipId = `vial-clip-${uid}`;

  const transition = instantFill
    ? undefined
    : `transform 0.7s ${LIQUID_EASE}`;

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <div className="relative w-full">
        <div
          className={cn(
            "relative mx-auto w-full shrink-0",
            mini ? "max-w-[2.6rem] sm:max-w-12" : "max-w-none",
          )}
          style={mini ? undefined : { aspectRatio: "100 / 250" }}
        >
          <svg
            viewBox="0 0 100 250"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            className={cn(
              "overflow-visible drop-shadow-[0_10px_16px_rgba(21,50,56,0.18)]",
              mini ? "h-24 w-full sm:h-28" : "absolute inset-0 h-full w-full",
            )}
            role="img"
            aria-hidden
          >
            <defs>
              <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="0.22" stopColor="#eef5f6" stopOpacity="0.55" />
                <stop offset="0.5" stopColor="#e2edef" stopOpacity="0.42" />
                <stop offset="0.8" stopColor="#c7d5d8" stopOpacity="0.5" />
                <stop offset="1" stopColor="#b0c1c4" stopOpacity="0.62" />
              </linearGradient>
              <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="0.14" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="0.72" stopColor="#16302f" stopOpacity="0" />
                <stop offset="0.9" stopColor="#16302f" stopOpacity="0.14" />
                <stop offset="1" stopColor="#16302f" stopOpacity="0.24" />
              </linearGradient>
              <linearGradient id={liquidId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={palette.top} />
                <stop offset="1" stopColor={palette.bottom} />
              </linearGradient>
              <linearGradient id={capId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#f4f6f7" />
                <stop offset="0.3" stopColor="#d7dcde" />
                <stop offset="0.55" stopColor="#eef1f2" />
                <stop offset="0.8" stopColor="#b9c1c3" />
                <stop offset="1" stopColor="#9aa4a6" />
              </linearGradient>
              <clipPath id={clipId}>
                <rect x="27" y={VIAL_INTERIOR_TOP} width="46" height={VIAL_INTERIOR_HEIGHT} rx="8" />
              </clipPath>
            </defs>

            {/* Glass body backdrop */}
            <rect x="24" y="78" width="52" height="158" rx="12" fill={`url(#${glassId})`} />
            <path
              d="M24 86 C24 66 41 60 41 54 L59 54 C59 60 76 66 76 86 Z"
              fill={`url(#${glassId})`}
            />

            {/* Liquid / powder inside the glass */}
            <g clipPath={`url(#${clipId})`}>
              {waterEmpty ? (
                <rect x="27" y={VIAL_INTERIOR_TOP} width="46" height={VIAL_INTERIOR_HEIGHT} fill="#e7eef0" opacity="0.35" />
              ) : null}
              {powder ? (
                <g>
                  <ellipse cx="50" cy="228" rx="21" ry="7" fill={palette.powder} />
                  <path d="M30 229 Q50 214 70 229 Z" fill={palette.powder} />
                  <ellipse cx="50" cy="224" rx="13" ry="4" fill="#ffffff" opacity="0.35" />
                </g>
              ) : !isEmpty ? (
                <g style={{ transform: `translateY(${offsetY}px)`, transition }}>
                  <rect x="27" y={VIAL_INTERIOR_TOP} width="46" height={VIAL_INTERIOR_HEIGHT + 8} fill={`url(#${liquidId})`} />
                  <rect x="27" y={VIAL_INTERIOR_TOP + VIAL_INTERIOR_HEIGHT - 6} width="46" height="10" fill={palette.edge} opacity="0.4" />
                  <ellipse cx="50" cy={VIAL_INTERIOR_TOP} rx="23" ry="3.4" fill="#ffffff" opacity="0.4" />
                  <ellipse cx="43" cy={VIAL_INTERIOR_TOP - 0.5} rx="7" ry="1.6" fill="#ffffff" opacity="0.55" />
                </g>
              ) : null}
            </g>

            {/* Glass curvature + specular highlights (over the liquid) */}
            <rect x="24" y="78" width="52" height="158" rx="12" fill={`url(#${sheenId})`} />
            <rect x="31" y="92" width="5" height="118" rx="2.5" fill="#ffffff" opacity="0.55" />
            <rect x="39" y="96" width="2" height="96" rx="1" fill="#ffffff" opacity="0.3" />

            {/* Outlines */}
            <rect x="24" y="78" width="52" height="158" rx="12" fill="none" stroke="var(--calc-stroke, #5a7278)" strokeWidth="1.1" />
            <path
              d="M24 86 C24 66 41 60 41 54 L59 54 C59 60 76 66 76 86"
              fill="none"
              stroke="var(--calc-stroke, #5a7278)"
              strokeWidth="1.1"
            />

            {/* Neck + rubber stopper */}
            <rect x="41" y="49" width="18" height="8" fill="#cfd6d7" />
            <rect x="40" y="45" width="20" height="7" rx="1.5" fill="#7f8a8c" />

            {/* Aluminium crimp cap */}
            <rect x="35" y="26" width="30" height="21" rx="2.5" fill={`url(#${capId})`} stroke="var(--calc-stroke-soft, #6e858b)" strokeWidth="0.6" />
            <rect x="33" y="42" width="34" height="6" rx="2" fill={`url(#${capId})`} stroke="var(--calc-stroke-soft, #6e858b)" strokeWidth="0.5" />
            {/* Coloured flip-off button */}
            <ellipse cx="50" cy="26" rx="14" ry="4" fill={palette.cap} />
            <ellipse cx="50" cy="25" rx="14" ry="4" fill={palette.cap} />
            <ellipse cx="50" cy="24.4" rx="9" ry="2.2" fill="#ffffff" opacity="0.4" />
            <ellipse cx="50" cy="26" rx="14" ry="4" fill="none" stroke={palette.capDark} strokeWidth="0.6" />

            {/* Needle-entry target (measured, not painted) */}
            <circle data-vial-stopper cx="50" cy="23" r="1" fill="transparent" />
          </svg>
        </div>
      </div>

      {label ? (
        <p
          className={cn(
            "mt-2 max-w-[7.5rem] text-center text-[10px] font-semibold uppercase tracking-[0.12em]",
            waterEmpty
              ? "text-[color:var(--dash-faint)]"
              : "text-[color:var(--dash-muted)]",
          )}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Syringe                                                                    */
/* -------------------------------------------------------------------------- */

type AssetSyringeProps = {
  syringeMl?: SyringeSizeMl;
  fillRatio?: number;
  label?: string;
  active?: boolean;
  compact?: boolean;
  large?: boolean;
  horizontal?: boolean;
  showFill?: boolean;
  instantFill?: boolean;
  vertical?: boolean;
  needleDown?: boolean;
  className?: string;
};

// Syringe barrel travel bounds (viewBox 0 0 80 380).
const SYRINGE_TRAVEL = 196;

export function AssetSyringe({
  syringeMl = 1,
  fillRatio = 0.35,
  label,
  active: _active = false,
  compact = false,
  large = false,
  horizontal = false,
  showFill = true,
  instantFill = false,
  vertical = false,
  needleDown = false,
  className,
}: AssetSyringeProps) {
  const uid = useId().replace(/:/g, "");
  const rawScale = SYRINGE_IMAGE_SCALE[syringeMl] ?? 0.82;
  // Keep the draw-mode syringe within a size band so the full barrel + plunger
  // always fit above the vials across syringe capacities.
  const scale = needleDown ? Math.min(Math.max(rawScale, 0.62), 0.9) : rawScale;

  const clamped = Math.min(0.98, Math.max(0, showFill ? fillRatio : 0));
  const offsetY = (1 - clamped) * SYRINGE_TRAVEL;
  const transition = instantFill ? undefined : `transform 0.7s ${LIQUID_EASE}`;

  const baseHeight = horizontal ? 214 : large ? (needleDown ? 288 : 320) : compact ? 150 : 280;
  const height = Math.round(baseHeight * scale);
  const width = Math.round(height * (80 / 380));

  const rotate = horizontal ? -45 : 0;

  // Layout footprint of the (possibly rotated) syringe so surrounding flex/grid
  // layout reserves the correct space.
  const rad = (Math.abs(rotate) * Math.PI) / 180;
  const boxW = Math.round(Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad)));
  const boxH = Math.round(Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad)));

  const barrelId = `syr-barrel-${uid}`;
  const barrelSheenId = `syr-sheen-${uid}`;
  const liquidId = `syr-liquid-${uid}`;
  const metalId = `syr-metal-${uid}`;
  const rodId = `syr-rod-${uid}`;
  const clipId = `syr-clip-${uid}`;

  const svg = (
    <svg
      viewBox="0 0 80 380"
      width={width}
      height={height}
      className="overflow-visible drop-shadow-[0_10px_18px_rgba(21,50,56,0.28)]"
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={barrelId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="0.3" stopColor="#e8f0f2" stopOpacity="0.55" />
          <stop offset="0.7" stopColor="#c9d8db" stopOpacity="0.5" />
          <stop offset="1" stopColor="#9eb0b4" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={barrelSheenId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="0.2" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.78" stopColor="#16302f" stopOpacity="0" />
          <stop offset="1" stopColor="#16302f" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={liquidId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcf5fb" />
          <stop offset="1" stopColor="#6cc6dd" />
        </linearGradient>
        <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--calc-metal-a, #6a7478)" />
          <stop offset="0.5" stopColor="var(--calc-metal-b, #d5dcdf)" />
          <stop offset="1" stopColor="var(--calc-metal-c, #4e585c)" />
        </linearGradient>
        <linearGradient id={rodId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--calc-rod-a, #e8ecee)" />
          <stop offset="0.5" stopColor="var(--calc-rod-b, #b4bec1)" />
          <stop offset="1" stopColor="var(--calc-rod-c, #8a9599)" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="30" y="98" width="20" height="202" rx="2" />
        </clipPath>
      </defs>

      {/* Needle hub + shaft — thicker/darker so it reads in light mode */}
      <rect
        x="35"
        y="300"
        width="10"
        height="11"
        rx="1"
        fill="var(--calc-needle-hub, #6a767a)"
        stroke="var(--calc-barrel-edge, #2f4a52)"
        strokeWidth="0.8"
      />
      <path
        d="M32.5 311 L47.5 311 L44 330 L36 330 Z"
        fill="var(--calc-needle-hub, #6a767a)"
        stroke="var(--calc-barrel-edge, #2f4a52)"
        strokeWidth="0.8"
      />
      <rect x="38.4" y="328" width="3.2" height="44" rx="0.8" fill={`url(#${metalId})`} />
      <rect
        x="38.4"
        y="328"
        width="3.2"
        height="44"
        rx="0.8"
        fill="none"
        stroke="var(--calc-needle, #3a4a4e)"
        strokeWidth="0.7"
      />
      <path d="M38.4 370 L41.6 370 L40 377 Z" fill="var(--calc-needle, #3a4a4e)" />

      {/* Barrel glass backdrop */}
      <rect x="27" y="94" width="26" height="208" rx="3" fill={`url(#${barrelId})`} />

      {/* Liquid inside the barrel */}
      {clamped > 0 ? (
        <g clipPath={`url(#${clipId})`}>
          <g style={{ transform: `translateY(${offsetY}px)`, transition }}>
            <rect x="30" y="102" width="20" height="200" fill={`url(#${liquidId})`} />
            <rect x="30" y="102" width="20" height="4" fill="#ffffff" opacity="0.4" />
          </g>
        </g>
      ) : null}

      {/* Graduation ticks */}
      <g stroke="var(--calc-barrel-edge, #2f4a52)" strokeWidth="1.15" opacity="0.85">
        {Array.from({ length: 9 }).map((_, i) => {
          const y = 118 + i * 20;
          const long = i % 2 === 0;
          return <line key={i} x1={long ? 45 : 47} y1={y} x2="52.5" y2={y} />;
        })}
      </g>

      {/* Barrel curvature + highlight */}
      <rect x="27" y="94" width="26" height="208" rx="3" fill={`url(#${barrelSheenId})`} />
      <rect x="30" y="100" width="4" height="192" rx="2" fill="#ffffff" opacity="0.45" />
      <rect
        x="27"
        y="94"
        width="26"
        height="208"
        rx="3"
        fill="none"
        stroke="var(--calc-barrel-edge, #2f4a52)"
        strokeWidth="1.6"
      />

      {/* Finger flange */}
      <rect
        x="13"
        y="88"
        width="54"
        height="9"
        rx="3.5"
        fill={`url(#${rodId})`}
        stroke="var(--calc-barrel-edge, #2f4a52)"
        strokeWidth="1"
      />

      {/* Plunger (rod + thumb rest + stopper) */}
      <g style={{ transform: `translateY(${offsetY}px)`, transition }}>
        <rect x="37" y="14" width="6" height="86" fill={`url(#${rodId})`} />
        <rect x="38.4" y="14" width="1.3" height="86" fill="#ffffff" opacity="0.5" />
        <rect
          x="20"
          y="8"
          width="40"
          height="9"
          rx="3.5"
          fill={`url(#${rodId})`}
          stroke="var(--calc-barrel-edge, #2f4a52)"
          strokeWidth="1"
        />
        <rect x="29.4" y="96" width="21.2" height="9" rx="1.6" fill="#2f3336" />
        <rect x="29.4" y="96" width="21.2" height="2.4" rx="1.2" fill="#565b5e" />
        <rect x="29.4" y="101.5" width="21.2" height="2.4" rx="1.2" fill="#1d2022" />
      </g>

      {/* Needle-tip target (measured, not painted) */}
      <circle data-needle-tip cx="40" cy="377" r="0.8" fill="transparent" />
    </svg>
  );

  return (
    <div className={cn("flex flex-col items-center", className)} data-syringe-box={needleDown ? "draw" : undefined}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: boxW, height: boxH }}
      >
        <div
          data-syringe-rotator
          className="absolute left-1/2 top-1/2 flex items-center justify-center"
          style={{
            transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
            transformOrigin: "center center",
          }}
        >
          {svg}
        </div>
      </div>

      {label ? (
        <p
          className={cn(
            "max-w-[12rem] text-center font-medium text-[color:var(--dash-muted)]",
            large ? "mt-3 text-sm" : "mt-2 text-[11px]",
          )}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Syringe size chooser                                                       */
/* -------------------------------------------------------------------------- */

export function SyringeSizeOption({
  size,
  selected,
  onSelect,
}: {
  size: SyringeSizeMl;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative z-10 inline-flex h-8 min-w-[3rem] items-center justify-center rounded-full border px-2 text-[11px] font-medium tracking-[0.01em] transition duration-200 sm:h-9 sm:min-w-[4.1rem] sm:px-3.5 sm:text-sm",
        selected
          ? "border-[#DDE466] bg-[#DDE466] text-[#152744] shadow-[0_2px_10px_rgba(221,228,102,0.3)]"
          : "dashboard-pill-soft border-[color:var(--dash-surface-border)] text-[color:var(--dash-muted)] hover:text-[color:var(--dash-text)]",
      )}
      aria-pressed={selected}
    >
      {size} ml
    </button>
  );
}
