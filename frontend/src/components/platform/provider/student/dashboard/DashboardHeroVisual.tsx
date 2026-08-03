"use client";

import Image from "next/image";
import { Icon, LayoutDashboard, User } from "@/components/icons";
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
        <Icon icon={LayoutDashboard} size={10} strokeWidth={2} />
        Overview
      </span>

      <span className="profile-learning-badge profile-learning-badge-delay absolute bottom-1 right-0 hidden scale-90 items-center gap-1 rounded-full bg-[#152744] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_2px_8px_rgba(21,39,68,0.15)] sm:inline-flex">
        <Icon icon={User} size={10} strokeWidth={2} />
        Account
      </span>
    </div>
  );
}
