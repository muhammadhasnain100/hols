"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  CreditCard,
  FileText,
  Icon,
  Lock,
  Shield,
  ShoppingBag,
  Star,
} from "@/components/icons";
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
    primaryIcon: <Icon icon={Star} size={10} strokeWidth={2} />,
    secondaryIcon: <Icon icon={Lock} size={10} strokeWidth={2} />,
  },
  orders: {
    primary: "Orders",
    secondary: "Receipts",
    primaryIcon: <Icon icon={ShoppingBag} size={10} strokeWidth={2} />,
    secondaryIcon: <Icon icon={FileText} size={10} strokeWidth={2} />,
  },
  card: {
    primary: "Secure",
    secondary: "Billing",
    primaryIcon: <Icon icon={CreditCard} size={10} strokeWidth={2} />,
    secondaryIcon: <Icon icon={Shield} size={10} strokeWidth={2} />,
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
