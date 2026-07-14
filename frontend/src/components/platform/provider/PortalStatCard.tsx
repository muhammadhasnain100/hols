import { cn } from "@/lib/utils";

type PortalStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  className?: string;
};

export function PortalStatCard({ label, value, hint, trend, className }: PortalStatCardProps) {
  return (
    <div className={cn("glass-panel rounded-3xl p-5 md:p-6", className)}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 font-sans text-3xl font-semibold text-primary">{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
      {trend ? (
        <p className="mt-3 inline-flex rounded-full bg-accent/30 px-3 py-1 text-xs font-medium text-primary">
          {trend}
        </p>
      ) : null}
    </div>
  );
}
