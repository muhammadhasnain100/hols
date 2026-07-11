import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/Container";

type SectionProps = {
  children: React.ReactNode;
  id?: string;
  className?: string;
  containerClassName?: string;
  variant?: "default" | "muted" | "primary" | "gradient";
};

const variantStyles = {
  default: "bg-background text-foreground",
  muted: "bg-primary/[0.03] text-foreground",
  primary: "bg-primary text-white",
  gradient: "bg-gradient-science-haze text-foreground",
};

export function Section({
  children,
  id,
  className,
  containerClassName,
  variant = "default",
}: SectionProps) {
  return (
    <section id={id} className={cn("py-16 md:py-24", variantStyles[variant], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
