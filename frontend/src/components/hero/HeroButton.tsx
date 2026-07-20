"use client";

import Link from "next/link";
import { useSpreadHover } from "@/hooks/useSpreadHover";
import {
  getHeroButtonClass,
  heroButtonHoverSpread,
  type HeroButtonVariant,
} from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

type HeroButtonProps = {
  href?: string;
  variant?: HeroButtonVariant;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
};

export function HeroButton({
  href,
  variant = "primary",
  children,
  className,
  type = "button",
  disabled = false,
  onClick,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
}: HeroButtonProps) {
  const spread = heroButtonHoverSpread[variant];
  const { containerRef, fillRef, labelRef, onMouseEnter, onMouseLeave } =
    useSpreadHover({
      fillColor: spread.fill,
      defaultColor: spread.textDefault,
      hoverColor: spread.textHover,
    });

  const classes = getHeroButtonClass(
    variant,
    disabled ? cn("pointer-events-none opacity-60", className) : className,
  );

  const inner = (
    <>
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
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        ref={containerRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        className={classes}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-label={ariaLabel}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      ref={containerRef as React.RefObject<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      onMouseLeave={disabled ? undefined : onMouseLeave}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
    >
      {inner}
    </button>
  );
}
