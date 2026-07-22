"use client";

import {
  CALCULATOR_ASSETS,
  SYRINGE_IMAGE_SCALE,
} from "@/components/platform/provider/student/calculator/calculatorAssets";
import {
  SYRINGE_SVG,
} from "@/components/platform/provider/student/calculator/calculatorGeometry";
import type { MassUnit, SyringeSizeMl } from "@/lib/integrate/provider/student/calculator";
import { cn } from "@/lib/utils";

function peptideVialColors(unit: MassUnit = "mg") {
  switch (unit) {
    case "g":
      return {
        liquid: "bg-gradient-to-t from-[#9B7FD4] to-[#E8DCFF]",
        powder: "bg-[#E8D4FF]/90",
        glow: "bg-[#C4A8F0]/25",
      };
    case "mcg":
      return {
        liquid: "bg-gradient-to-t from-[#F5A962] to-[#FFE8D6]",
        powder: "bg-[#FFD8A8]/90",
        glow: "bg-[#FFC896]/25",
      };
    default:
      return {
        liquid: "bg-gradient-to-t from-[#75D6CB] to-[#DDFCF4]",
        powder: "bg-[#FFF1B8]/90",
        glow: "bg-[#9ED6D4]/25",
      };
  }
}

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

export function AssetVial({
  label,
  fillRatio = 0.75,
  variant = "water",
  peptideUnit = "mg",
  powder = false,
  empty = false,
  mini = false,
  active = false,
  showGlow = true,
  instantFill = false,
  className,
}: AssetVialProps) {
  const isEmpty = empty || (!powder && fillRatio <= 0.1);
  const clamped = isEmpty ? 0 : Math.min(0.92, Math.max(0.08, fillRatio));
  const liquidHeight = `${clamped * 42}%`;
  const peptideColors = peptideVialColors(peptideUnit);
  const waterEmpty = variant === "water" && isEmpty;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "relative transition duration-500",
          active ? "scale-105" : "scale-100",
        )}
      >
        {active && showGlow && !waterEmpty ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-[8%] -z-10 rounded-full blur-2xl",
              variant === "peptide" ? peptideColors.glow : "bg-[#9ED6D4]/25",
            )}
            aria-hidden
          />
        ) : null}

        <div
          className={cn(
            "relative",
            mini ? "h-24 w-10 sm:h-28 sm:w-11" : "h-44 w-[4.5rem] sm:h-52 sm:w-[5.25rem]",
          )}
        >
          {powder ? (
            <div
              className={cn(
                "absolute bottom-[18%] left-[22%] right-[22%] h-[10%] rounded-full",
                peptideColors.powder,
                instantFill ? "" : "transition-all duration-700 ease-out",
              )}
            />
          ) : !isEmpty ? (
            <div
              className={cn(
                "absolute bottom-[14%] left-[18%] right-[18%] overflow-hidden rounded-b-[1.4rem]",
                instantFill ? "" : "transition-all duration-700 ease-out",
              )}
              style={{ height: liquidHeight }}
            >
              <div
                className={cn(
                  "h-full w-full opacity-80",
                  variant === "water"
                    ? "bg-gradient-to-t from-[#88D8E8] to-[#EFFFFA]"
                    : peptideColors.liquid,
                )}
              />
            </div>
          ) : null}

          {waterEmpty ? (
            <div
              className="pointer-events-none absolute bottom-[14%] left-[18%] right-[18%] top-[28%] rounded-b-[1.4rem] bg-gradient-to-b from-[#F4F6F8]/20 to-[#D8DEE4]/35"
              aria-hidden
            />
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CALCULATOR_ASSETS.vial}
            alt=""
            data-vial-image
            className={cn(
              "relative z-[1] h-full w-full object-contain drop-shadow-[0_18px_24px_rgba(21,50,56,0.12)] transition duration-500",
              waterEmpty && "saturate-[0.35] brightness-[1.03] hue-rotate-[190deg]",
            )}
          />
        </div>
      </div>

      {label ? (
        <p
          className={cn(
            "mt-2 max-w-[7.5rem] text-center text-[10px] font-semibold uppercase tracking-[0.12em]",
            waterEmpty ? "text-primary/30" : "text-primary/50",
          )}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}

export function AssetSyringe({
  syringeMl = 1,
  fillRatio = 0.35,
  label,
  active = false,
  compact = false,
  large = false,
  horizontal = false,
  showFill = true,
  instantFill = false,
  vertical = false,
  needleDown = false,
  className,
}: AssetSyringeProps) {
  const scale = SYRINGE_IMAGE_SCALE[syringeMl];
  const clamped = Math.min(1, Math.max(0.05, fillRatio));
  const liquidHeight = `${clamped * 38}%`;

  if (horizontal) {
    const length = Math.round((large ? 280 : compact ? 136 : 200) * scale);
    const boxClass = compact
      ? "flex h-12 w-[5.25rem] items-center justify-center sm:h-[3.25rem] sm:w-[5.75rem]"
      : "relative flex h-20 w-full max-w-[16rem] items-center justify-center sm:h-24 sm:max-w-[18rem]";

    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div className={cn("relative flex items-center justify-center", boxClass)}>
          {active ? (
            <div
              className="pointer-events-none absolute inset-[8%] -z-10 rounded-full bg-[#88D8E8]/25 blur-2xl"
              aria-hidden
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CALCULATOR_ASSETS.syringe}
            alt=""
            className="max-w-[92%] object-contain drop-shadow-[0_20px_28px_rgba(21,50,56,0.12)]"
            style={{
              width: length,
              height: "auto",
              transform: `rotate(${SYRINGE_SVG.horizontalCssRotationDeg}deg)`,
              transformOrigin: "center center",
            }}
          />
        </div>

        {label ? (
          <p className="mt-3 max-w-[11rem] text-center text-sm font-medium text-primary/55">{label}</p>
        ) : null}
      </div>
    );
  }

  const baseWidth = large ? 96 : compact ? 40 : 88;
  const baseHeight = large ? 300 : compact ? 96 : 256;
  const width = Math.round(baseWidth * scale);
  const height = Math.round(baseHeight * scale);
  const showLiquidFill = showFill && !needleDown;
  const drawRotation = needleDown ? SYRINGE_SVG.drawCssRotationDeg : vertical ? SYRINGE_SVG.drawCssRotationDeg : 0;
  const drawBox = needleDown
    ? {
        width: Math.round(width * 1.18),
        height: Math.round(height * 1.12),
      }
    : { width, height };

  return (
    <div className={cn("flex flex-col items-center", className)} data-syringe-box={needleDown ? "draw" : undefined}>
      <div
        className={cn(
          "relative transition duration-500",
          active && !compact && !needleDown ? "scale-[1.04]" : "scale-100",
        )}
      >
        {active && !needleDown ? (
          <div
            className="pointer-events-none absolute inset-[4%] -z-10 rounded-full bg-[#88D8E8]/25 blur-2xl"
            aria-hidden
          />
        ) : null}

        <div
          className="relative overflow-visible"
          style={{ width: drawBox.width, height: drawBox.height }}
        >
          <div
            data-syringe-rotator
            className="absolute left-1/2 top-1/2"
            style={{
              width,
              height,
              transform: `translate(-50%, -50%) rotate(${drawRotation}deg)`,
              transformOrigin: "50% 50%",
            }}
          >
            {showLiquidFill ? (
              <div
                className={cn(
                  "absolute left-[34%] right-[34%] top-[18%] z-0 overflow-hidden rounded-b-md",
                  instantFill ? "" : "transition-all duration-700 ease-out",
                )}
                style={{ height: liquidHeight }}
              >
                <div className="h-full w-full bg-gradient-to-b from-[#EFFFFA] to-[#88D8E8] opacity-85" />
              </div>
            ) : null}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CALCULATOR_ASSETS.syringe}
              alt=""
              className="relative z-[1] h-full w-full object-contain drop-shadow-[0_16px_22px_rgba(21,50,56,0.18)]"
            />
          </div>
        </div>
      </div>

      {label ? (
        <p
          className={cn(
            "max-w-[11rem] text-center font-medium text-primary/55",
            large ? "mt-4 text-sm" : "mt-2 text-[11px]",
          )}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}

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
        "relative z-10 min-w-[4.75rem] rounded-2xl border-2 px-5 py-3.5 text-lg font-semibold transition duration-200",
        selected
          ? "border-[#DDE466] bg-[#DDE466]/20 text-[color:var(--dash-text)] shadow-[0_0_0_6px_rgba(221,228,102,0.25)]"
          : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)] hover:border-[color:var(--dash-dim)] hover:text-[color:var(--dash-muted)]",
      )}
      aria-pressed={selected}
    >
      {size} ml
    </button>
  );
}
