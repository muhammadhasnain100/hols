"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const SYRINGE_SRC = "/assets/calculator/syringe-clear.png";
const VIAL_SRC = "/assets/calculator/vial-clear.png";

/** Transparent teal glass syringe asset. */
export function GlassSyringe({
  fillRatio = 0.45,
  className,
  label,
  active = false,
}: {
  fillRatio?: number;
  className?: string;
  label?: string;
  active?: boolean;
}) {
  const clamped = Math.min(1, Math.max(0.05, fillRatio));

  return (
    <div
      className={cn(
        "relative flex flex-col items-center transition duration-500",
        active && "scale-[1.04]",
        className,
      )}
    >
      <div className="relative h-52 w-[5.5rem] sm:h-64 sm:w-[6.5rem]">
        <Image
          src={SYRINGE_SRC}
          alt="Syringe"
          fill
          priority
          sizes="(max-width: 640px) 88px, 104px"
          className="object-contain drop-shadow-[0_20px_32px_rgba(91,168,166,0.25)]"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[17%] h-[36%] w-[44%] -translate-x-1/2 overflow-hidden rounded-[3px]"
          aria-hidden
        >
          <div
            className="w-full bg-gradient-to-b from-[#FDA4D4] via-[#F472B6] to-[#DB2777] transition-all duration-700 ease-out"
            style={{ height: `${Math.max(8, clamped * 100)}%` }}
          />
        </div>
      </div>

      {label ? (
        <p className="mt-2 max-w-[11rem] text-center text-[11px] font-medium text-primary/55">
          {label}
        </p>
      ) : null}
    </div>
  );
}

/** Transparent photoreal glass vial asset. */
export function GlassVial({
  fillRatio = 0.75,
  variant = "teal",
  powder = false,
  active = false,
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
  const clamped = Math.min(0.95, Math.max(0.08, fillRatio));

  return (
    <div
      className={cn(
        "relative flex flex-col items-center transition duration-500",
        active && "scale-105",
        className,
      )}
    >
      <div className="relative h-44 w-[6.5rem] sm:h-52 sm:w-[7.5rem]">
        <Image
          src={VIAL_SRC}
          alt={label || "Vial"}
          fill
          sizes="(max-width: 640px) 104px, 120px"
          className={cn(
            "object-contain drop-shadow-[0_18px_28px_rgba(107,154,147,0.22)] transition duration-500",
            variant === "water" && "hue-rotate-[12deg] saturate-[1.05]",
            variant === "peptide" && "hue-rotate-[-6deg] saturate-[1.08]",
            powder && "grayscale-[0.4] brightness-[1.06] saturate-[0.65]",
          )}
        />
        {!powder ? (
          <div
            className="pointer-events-none absolute bottom-[11%] left-1/2 h-[55%] w-[50%] -translate-x-1/2 overflow-hidden rounded-b-[1.2rem]"
            aria-hidden
          >
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 bg-gradient-to-b mix-blend-multiply transition-all duration-700 ease-out",
                variant === "water"
                  ? "from-[#7DD3FC]/75 to-[#0EA5E9]/90"
                  : "from-[#A7F3D0]/70 to-[#14B8A6]/90",
              )}
              style={{ height: `${clamped * 100}%` }}
            />
          </div>
        ) : null}

        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 blur-2xl transition duration-500",
            active && "bg-[#9ED6D4]/25 opacity-100",
          )}
        />
      </div>

      {label ? (
        <p className="mt-1.5 max-w-[7.5rem] text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/50">
          {label}
        </p>
      ) : null}
    </div>
  );
}
