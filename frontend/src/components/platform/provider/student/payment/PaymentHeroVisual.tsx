"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type PaymentVisualVariant = "membership" | "orders" | "card";

type PaymentHeroVisualProps = {
  variant: PaymentVisualVariant;
  className?: string;
};

const VARIANT_CONFIG: Record<
  PaymentVisualVariant,
  { primary: string; secondary: string; primaryIcon: ReactNode; secondaryIcon: ReactNode }
> = {
  membership: {
    primary: "Plans",
    secondary: "Access",
    primaryIcon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
    secondaryIcon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  orders: {
    primary: "Orders",
    secondary: "Receipts",
    primaryIcon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    secondaryIcon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  card: {
    primary: "Secure",
    secondary: "Billing",
    primaryIcon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    secondaryIcon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
};

export function PaymentHeroVisual({ variant, className }: PaymentHeroVisualProps) {
  const config = VARIANT_CONFIG[variant];

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
        {config.primaryIcon}
        {config.primary}
      </span>

      <span className="profile-learning-badge profile-learning-badge-delay absolute bottom-1 right-0 hidden scale-90 items-center gap-1 rounded-full bg-[#152744] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_2px_8px_rgba(21,39,68,0.15)] sm:inline-flex">
        {config.secondaryIcon}
        {config.secondary}
      </span>
    </div>
  );
}
