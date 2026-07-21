"use client";

import {
  AssetSyringe,
  AssetVial,
} from "@/components/platform/provider/student/calculator/CalculatorAssetIllustrations";
import { cn } from "@/lib/utils";

type CalculatorHeroVisualProps = {
  className?: string;
};

export function CalculatorHeroVisual({ className }: CalculatorHeroVisualProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "profile-learning-visual relative isolate flex h-[7rem] w-[11.5rem] shrink-0 items-center justify-center sm:h-[7.75rem] sm:w-[13rem] md:h-[8rem] md:w-[14rem]",
        className,
      )}
    >
      <div className="profile-learning-ring pointer-events-none absolute inset-[8%] rounded-full border border-[#8DC3E1]/35" />
      <div className="profile-learning-ring profile-learning-ring-delay pointer-events-none absolute inset-[18%] rounded-full border border-dashed border-[#3853A4]/20" />
      <div className="profile-learning-glow pointer-events-none absolute inset-[24%] rounded-full bg-[#8DC3E1]/12 blur-xl" />

      <span className="absolute left-2 top-2 z-30 inline-flex items-center rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#3853A4] shadow-[0_2px_8px_rgba(21,39,68,0.08)]">
        Vial
      </span>

      <span className="absolute bottom-2 left-1/2 z-30 inline-flex -translate-x-1/2 items-center rounded-full bg-[#152744] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_2px_8px_rgba(21,39,68,0.15)]">
        Syringe
      </span>

      <div className="profile-learning-float relative z-10 flex items-end justify-center gap-1.5 pb-1 pt-4">
        <AssetVial label="" mini fillRatio={0.55} variant="water" />
        <AssetSyringe syringeMl={1} fillRatio={0.28} horizontal compact showFill={false} />
        <AssetVial label="" mini fillRatio={0.42} variant="peptide" powder />
      </div>
    </div>
  );
}
