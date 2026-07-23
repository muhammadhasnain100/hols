"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Clean teal syringe illustration with liquid moving inside the barrel. */
export function GlassSyringe({
  fillRatio = 0.45,
  className,
  label,
  active: _active = false,
}: {
  fillRatio?: number;
  className?: string;
  label?: string;
  active?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const clamped = Math.min(1, Math.max(0.05, fillRatio));
  const liquidHeight = 74 * clamped;
  const liquidY = 64 + (74 - liquidHeight);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        className,
      )}
    >
      <svg viewBox="0 0 120 240" className="h-52 w-auto drop-shadow-[0_20px_28px_rgba(21,50,56,0.12)] sm:h-64" aria-hidden>
        <defs>
          <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#E7F8F8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#BEECEF" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id={`liquid-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EFFFFA" />
            <stop offset="100%" stopColor="#88D8E8" />
          </linearGradient>
          <clipPath id={`barrel-${uid}`}>
            <rect x="42" y="64" width="36" height="74" rx="7" />
          </clipPath>
        </defs>

        <g>
          <line x1="60" y1="4" x2="60" y2="40" stroke="#153238" strokeWidth="4" strokeLinecap="round" />
          <line x1="43" y1="4" x2="77" y2="4" stroke="#153238" strokeWidth="4" strokeLinecap="round" />
          <rect x="38" y="40" width="44" height="11" rx="4" fill="#F7FCFC" stroke="#153238" strokeWidth="4" />
          <rect x="42" y="51" width="36" height="98" rx="9" fill={`url(#glass-${uid})`} stroke="#153238" strokeWidth="4" />
          <g clipPath={`url(#barrel-${uid})`}>
            <rect
              x="43"
              y={liquidY}
              width="34"
              height={liquidHeight}
              fill={`url(#liquid-${uid})`}
              className="transition-all duration-700 ease-out"
            />
            <circle cx="55" cy={liquidY + liquidHeight * 0.34} r="2" fill="#2E6670" opacity="0.7" />
            <circle cx="67" cy={liquidY + liquidHeight * 0.64} r="1.6" fill="#2E6670" opacity="0.6" />
          </g>
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1={48}
              y1={60 + i * 10}
              x2={i % 2 === 0 ? 58 : 54}
              y2={60 + i * 10}
              stroke="#153238"
              strokeWidth="1.4"
            />
          ))}
          <line x1="60" y1="149" x2="60" y2="168" stroke="#153238" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="168" x2="60" y2="210" stroke="#153238" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="42" y="208" width="36" height="12" rx="5" fill="#F7FCFC" stroke="#153238" strokeWidth="4" />
        </g>
      </svg>

      {label ? (
        <p className="mt-2 max-w-[11rem] text-center text-[11px] font-medium text-[color:var(--dash-muted)]">
          {label}
        </p>
      ) : null}
    </div>
  );
}

/** Clean transparent vial illustration matching the preparation animation. */
export function GlassVial({
  fillRatio = 0.75,
  variant = "teal",
  powder = false,
  active: _active = false,
  label,
  className,
}: {
  fillRatio?: number;
  variant?: "teal" | "water" | "peptide";
  powder?: boolean;
  active?: boolean;
  label?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const clamped = Math.min(0.95, Math.max(0.08, fillRatio));
  const liquidHeight = 66 * clamped;
  const liquidY = 158 - liquidHeight;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        className,
      )}
    >
      <svg viewBox="0 0 120 180" className="h-44 w-auto drop-shadow-[0_18px_24px_rgba(21,50,56,0.12)] sm:h-52" aria-hidden>
        <defs>
          <linearGradient id={`vialGlass-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="54%" stopColor="#E8F8F9" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#BFECEF" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id={`vialLiquid-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={variant === "water" ? "#EFFFFA" : "#DDFCF4"} />
            <stop offset="100%" stopColor={variant === "water" ? "#88D8E8" : "#75D6CB"} />
          </linearGradient>
          <clipPath id={`vialClip-${uid}`}>
            <path d="M32 70 Q32 80 24 88 L24 157 Q24 170 37 170 H83 Q96 170 96 157 V88 Q88 80 88 70 Z" />
          </clipPath>
        </defs>

        <rect x="24" y="56" width="72" height="14" rx="5" fill="#F7FCFC" stroke="#153238" strokeWidth="4" />
        <path
          d="M32 70 Q32 80 24 88 L24 157 Q24 170 37 170 H83 Q96 170 96 157 V88 Q88 80 88 70 Z"
          fill={`url(#vialGlass-${uid})`}
          stroke="#153238"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {!powder ? (
          <g clipPath={`url(#vialClip-${uid})`}>
            <rect
              x="24"
              y={liquidY}
              width="72"
              height={liquidHeight}
              fill={`url(#vialLiquid-${uid})`}
              className="transition-all duration-700 ease-out"
            />
            <path
              d={`M24 ${liquidY} Q60 ${liquidY - 6} 96 ${liquidY}`}
              fill="none"
              stroke="#EFFFFA"
              strokeWidth="4"
              opacity="0.9"
              className="transition-all duration-700 ease-out"
            />
          </g>
        ) : (
          <ellipse cx="60" cy="154" rx="24" ry="7" fill="#FFF1B8" opacity="0.9" />
        )}
        <rect x="32" y="108" width="56" height="33" fill="#FFF1B8" opacity="0.78" />
        <text x="38" y="122" fill="#153238" fontSize="7" fontWeight="700">
          {label?.toLowerCase().includes("medication") ? "MEDICATION" : "BACTERIOSTATIC"}
        </text>
        <text x="38" y="132" fill="#153238" fontSize="7" fontWeight="700">
          {label?.toLowerCase().includes("medication") ? "VIAL" : "WATER"}
        </text>
      </svg>

      {label ? (
        <p className="mt-1.5 max-w-[7.5rem] text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--dash-muted)]">
          {label}
        </p>
      ) : null}
    </div>
  );
}
