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
  /** When set, glass/spread hover is scoped to this control (not the parent card link). */
  onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
};

/**
 * Button appearance for link cards.
 * Pass hover handlers here so fill runs on the control only; omit them and keep
 * `pointer-events-none` when the parent link drives hover instead.
 */
export function PortalCardButtonDisplay({
  variant = "primary",
  size = "md",
  className,
  children,
  containerRef,
  fillRef,
  labelRef,
  onMouseEnter,
  onMouseLeave,
}: PortalCardButtonDisplayProps) {
  const spread = buttonHoverSpread[variant];
  const selfHover = Boolean(onMouseEnter || onMouseLeave);

  return (
    <span
      ref={containerRef as React.RefObject<HTMLSpanElement>}
      className={getButtonClassName(
        variant,
        cn(
          "w-full justify-center",
          selfHover ? "group/cta pointer-events-auto" : "pointer-events-none",
          className,
        ),
        size,
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
