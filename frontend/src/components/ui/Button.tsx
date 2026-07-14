"use client";

import Link from "next/link";
import { useSpreadHover } from "@/hooks/useSpreadHover";
import {
  buttonHoverSpread,
  getButtonClassName,
  type ButtonVariant,
  buttonSizes,
} from "@/lib/button-styles";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href?: string;
  variant?: ButtonVariant;
  size?: keyof typeof buttonSizes;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  href,
  variant = "primary",
  size = "md",
  children,
  className,
  type = "button",
  disabled = false,
  onClick,
}: ButtonProps) {
  const spread = buttonHoverSpread[variant];
  const { containerRef, fillRef, labelRef, onMouseEnter, onMouseLeave } =
    useSpreadHover({
      fillColor: spread.fill,
      defaultColor: spread.textDefault,
      hoverColor: spread.textHover,
    });

  const classes = getButtonClassName(
    variant,
    disabled ? cn("pointer-events-none opacity-60", className) : className,
    size,
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
    >
      {inner}
    </button>
  );
}
