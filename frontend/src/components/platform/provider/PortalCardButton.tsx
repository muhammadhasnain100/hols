"use client";

import { useSpreadHover } from "@/hooks/useSpreadHover";
import {
  buttonHoverSpread,
  getButtonClassName,
  type ButtonVariant,
  buttonSizes,
} from "@/lib/button-styles";
import { cn } from "@/lib/utils";

export function usePortalCardButtonHover(variant: ButtonVariant = "primary") {
  const spread = buttonHoverSpread[variant];
  return useSpreadHover({
    fillColor: spread.fill,
    defaultColor: spread.textDefault,
    hoverColor: spread.textHover,
  });
}

type PortalCardButtonDisplayProps = {
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
  className?: string;
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLElement | null>;
  fillRef: React.RefObject<HTMLSpanElement | null>;
  labelRef: React.RefObject<HTMLSpanElement | null>;
};

/** Button appearance for link cards — attach hover handlers from `usePortalCardButtonHover` to the parent Link. */
export function PortalCardButtonDisplay({
  variant = "primary",
  size = "md",
  className,
  children,
  containerRef,
  fillRef,
  labelRef,
}: PortalCardButtonDisplayProps) {
  const spread = buttonHoverSpread[variant];

  return (
    <span
      ref={containerRef as React.RefObject<HTMLSpanElement>}
      className={getButtonClassName(
        variant,
        cn("pointer-events-none w-full justify-center", className),
        size,
      )}
    >
      <span
        ref={fillRef}
        aria-hidden
        className="pointer-events-none absolute z-0 rounded-full will-change-transform"
      />
      <span
        ref={labelRef}
        className="relative z-10 inline-flex items-center justify-center gap-2"
        style={{ color: spread.textDefault }}
      >
        {children}
      </span>
    </span>
  );
}
