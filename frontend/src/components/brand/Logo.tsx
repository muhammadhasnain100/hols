import Link from "next/link";
import { cn } from "@/lib/utils";

const logos = {
  dark: "/asset/hols-logo.svg",
  light: "/asset/hols-logo-light.svg",
  mark: "/asset/hols-logo-mark.svg",
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
  const src = compact ? logos.mark : logos[variant];

  const image = (
    <img
      src={src}
      alt="HOLS house of life science"
      width={compact ? 120 : 180}
      height={compact ? 32 : 36}
      className={cn("h-8 w-auto object-contain md:h-9", className)}
    />
  );

  if (!href) return image;

  return (
    <Link
      href={href}
      aria-label="House of Life Sciences home"
      className="group inline-flex transition-opacity hover:opacity-90"
    >
      {image}
    </Link>
  );
}
