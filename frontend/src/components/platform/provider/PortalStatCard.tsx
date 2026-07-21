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
    <div
      className={cn(
        "rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(21,39,68,0.04)] md:p-6",
        className,
      )}
    >
      <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-primary/40">{label}</p>
      <p className="mt-2.5 text-2xl font-semibold tracking-tight text-primary md:text-[1.75rem]">{value}</p>
      {hint ? <p className="mt-1.5 text-[13px] text-primary/45">{hint}</p> : null}
      {trend ? (
        <p className="mt-3 inline-flex rounded-full bg-primary/[0.06] px-2.5 py-1 text-[11px] font-medium text-primary/70">
          {trend}
        </p>
      ) : null}
    </div>
  );
}
