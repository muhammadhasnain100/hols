import { cn } from "@/lib/utils";

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-brand-caption font-medium uppercase tracking-[0.2em] text-primary-light",
        className,
      )}
    >
      {children}
    </p>
  );
}
