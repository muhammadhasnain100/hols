import {
  portalStatHintClass,
  portalStatLabelClass,
  portalStatValueClass,
} from "@/components/platform/provider/portal-styles";
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
      <p className={portalStatLabelClass}>{label}</p>
      <p className={portalStatValueClass}>{value}</p>
      {hint ? <p className={portalStatHintClass}>{hint}</p> : null}
      {trend ? (
        <p className="text-brand-caption mt-3 inline-flex rounded-full bg-primary/[0.06] px-2.5 py-1 font-medium text-primary/70">
          {trend}
        </p>
      ) : null}
    </div>
  );
}
