import { cn } from "@/lib/utils";

type PageHeroProps = {
  headline: string;
  subhead?: string;
  eyebrow?: string;
  className?: string;
  centered?: boolean;
};

export function PageHero({
  headline,
  subhead,
  eyebrow,
  className,
  centered = true,
}: PageHeroProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        centered && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-4 text-brand-caption font-medium uppercase tracking-[0.2em] text-primary-light">
          {eyebrow}
        </p>
      )}
      <h1 className="text-brand-heading text-primary">{headline}</h1>
      {subhead && (
        <p className="mt-6 text-brand-body text-muted">{subhead}</p>
      )}
    </div>
  );
}
