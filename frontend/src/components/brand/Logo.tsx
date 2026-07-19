import Link from "next/link";
import { cn } from "@/lib/utils";

const logos = {
  dark: "/assets/logo/hols-logo.png",
  light: "/assets/logo/hols-logo-light.png",
  mark: "/assets/logo/hols-logo-mark.png",
  markLight: "/assets/logo/hols-logo-mark-light.png",
} as const;

type LogoProps = {
  variant?: "dark" | "light" | "mark";
  href?: string;
  className?: string;
  compact?: boolean;
};

export function Logo({
  variant = "dark",
  href = "/",
  className,
  compact = false,
}: LogoProps) {
  const src = compact
    ? variant === "light"
      ? logos.markLight
      : logos.mark
    : logos[variant];

  const image = (
    <img
      src={src}
      alt="HOLS house of life science"
      width={compact ? 40 : 210}
      height={compact ? 40 : 39}
      className={cn(
        compact ? "h-8 w-8 object-contain" : "h-8 w-auto object-contain md:h-9",
        className,
      )}
    />
  );

  if (!href) return image;

  return (
    <Link
      href={href}
      aria-label="House of Life Sciences home"
      className="group inline-flex items-center p-0 transition-opacity hover:opacity-90"
    >
      {image}
    </Link>
  );
}
