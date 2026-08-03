import { ChevronLeft, Icon } from "@/components/icons";
import { AuthCreativeAside } from "@/components/platform/auth/AuthCreativeAside";
import { authEyebrowClass, authSubtitleClass, authTitleClass } from "@/components/platform/auth/auth-styles";
import { HeroLogo } from "@/components/hero/HeroLogo";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

/** Same light portal brand gradient as student dashboard (`data-backdrop="brand"`). */
const AUTH_BRAND_BACKDROP =
  "radial-gradient(100% 90% at 100% 0%, rgba(221, 228, 102, 0.75) 0%, transparent 55%), radial-gradient(90% 85% at 0% 100%, rgba(141, 195, 225, 0.7) 0%, transparent 58%), radial-gradient(70% 70% at 70% 80%, rgba(56, 83, 164, 0.28) 0%, transparent 60%), linear-gradient(150deg, #dceaf5 0%, #e8eef8 35%, #eef3d8 70%, #dfe9f4 100%)";

type AuthShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string;
  contentWidth?: "md" | "lg";
  className?: string;
};

export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
  contentWidth = "md",
  className,
}: AuthShellProps) {
  return (
    <div className={cn("relative min-h-svh bg-transparent lg:grid lg:grid-cols-2", className)}>
      <AuthCreativeAside />

      <section className="relative flex min-h-svh flex-col overflow-hidden">
        <div
          aria-hidden
          className="auth-brand-backdrop pointer-events-none absolute inset-0"
          style={{ background: AUTH_BRAND_BACKDROP, backgroundColor: "#e8eef8" }}
        />

        <header className={cn("relative z-10 flex items-center justify-between py-4 sm:py-5", heroLayout.gutterX, "lg:px-10")}>
          <a href="/" className="inline-flex lg:hidden">
            <HeroLogo variant="dark" className="h-8" linked={false} />
          </a>
          <a
            href="/"
            className="text-brand-caption ml-auto inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/45 px-3.5 py-2 font-medium text-primary/80 shadow-[0_8px_24px_rgba(20,38,68,0.08)] backdrop-blur-md transition hover:bg-white/70 hover:text-primary sm:px-4"
          >
            <Icon icon={ChevronLeft} size={14} strokeWidth={2} />
            Back to site
          </a>
        </header>

        <div className={cn("relative z-10 flex flex-1 flex-col justify-center pb-10 pt-2 sm:pb-12 sm:pt-4", heroLayout.gutterX, "lg:px-10 xl:px-16")}>
          <div
            className={cn(
              "mx-auto w-full rounded-2xl border border-white/55 bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-[22px] [backdrop-filter:blur(22px)_saturate(180%)] [-webkit-backdrop-filter:blur(22px)_saturate(180%)] sm:p-6 md:p-8",
              contentWidth === "lg" ? "max-w-xl" : "max-w-md",
            )}
          >
            <div className="mb-6 sm:mb-8">
              <p className={authEyebrowClass}>{eyebrow}</p>
              <h1 className={cn("mt-2 sm:mt-3", authTitleClass)}>{title}</h1>
              {subtitle ? <p className={authSubtitleClass}>{subtitle}</p> : null}
            </div>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
