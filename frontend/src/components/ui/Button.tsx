import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent";

type ButtonProps = {
  href?: string;
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-light border border-transparent",
  secondary:
    "bg-white text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/5",
  ghost: "bg-transparent text-primary hover:bg-primary/5 border border-transparent",
  accent:
    "bg-accent text-primary border border-transparent hover:brightness-95",
};

export function Button({
  href,
  variant = "primary",
  children,
  className,
  type = "button",
  onClick,
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors duration-200",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
