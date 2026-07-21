"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type ProfileLearningVisualProps = {
  className?: string;
};

export function ProfileLearningVisual({ className }: ProfileLearningVisualProps) {
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
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        Lectures
      </span>

      <span className="profile-learning-badge profile-learning-badge-delay absolute bottom-1 right-0 hidden scale-90 items-center gap-1 rounded-full bg-[#152744] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_2px_8px_rgba(21,39,68,0.15)] sm:inline-flex">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41" />
        </svg>
        Science
      </span>
    </div>
  );
}
