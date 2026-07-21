"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type DashboardHeroVisualProps = {
  className?: string;
};

export function DashboardHeroVisual({ className }: DashboardHeroVisualProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "profile-learning-visual relative flex h-[5.5rem] w-[9.5rem] shrink-0 items-center justify-center sm:h-[6.25rem] sm:w-[11rem] md:h-[6.75rem] md:w-[12.5rem] lg:h-[7.25rem] lg:w-[14rem]",
        className,
      )}
    >
      <div className="profile-learning-ring absolute inset-[4%] rounded-full border border-[#8DC3E1]/35" />
      <div className="profile-learning-ring profile-learning-ring-delay absolute inset-[14%] rounded-full border border-dashed border-[#3853A4]/20" />
      <div className="profile-learning-glow absolute inset-[20%] rounded-full bg-[#8DC3E1]/12 blur-xl" />

      <div className="profile-learning-float relative z-10 h-[72%] w-[72%]">
        <Image
          src="/assets/hols-auth-illustration.svg"
          alt=""
          width={200}
          height={200}
          className="h-full w-full object-contain drop-shadow-[0_8px_20px_rgba(21,39,68,0.1)]"
          priority
        />
      </div>

      <span className="profile-learning-badge absolute left-0 top-1 hidden scale-90 items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#3853A4] shadow-[0_2px_8px_rgba(21,39,68,0.08)] sm:inline-flex">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Overview
      </span>

      <span className="profile-learning-badge profile-learning-badge-delay absolute bottom-1 right-0 hidden scale-90 items-center gap-1 rounded-full bg-[#152744] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_2px_8px_rgba(21,39,68,0.15)] sm:inline-flex">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Account
      </span>
    </div>
  );
}
