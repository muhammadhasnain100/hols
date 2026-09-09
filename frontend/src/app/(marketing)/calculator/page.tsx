import { HeroNavbar } from "@/components/hero/HeroNavbar";
import { StudentPeptideCalculatorPage } from "@/components/platform/provider/student/calculator";

export const metadata = {
  title: "Peptide Calculator | House of Life Sciences",
  description:
    "Free step-by-step peptide reconstitution and dosing calculator. Choose a syringe, enter your vial and dose, and see units per draw instantly.",
};

/**
 * Public calculator page.
 *
 * The calculator content is wrapped in `portal-shell[data-theme="dark"]` so it
 * inherits the exact same dark-theme card / surface styling as the authenticated
 * portal calculator. That wrapper intentionally remaps `--color-primary` to a
 * light shade — which is fine for the calculator body, but would break the
 * marketing `HeroNavbar` (its scrolled floating panel uses `bg-white text-primary`
 * — light-on-white). So the nav is mounted OUTSIDE the portal-shell, and the
 * brand backdrop is painted on the outer wrapper so the whole page still looks
 * like the dark portal.
 */
const CALCULATOR_PAGE_BG =
  "radial-gradient(100% 90% at 100% 0%, rgba(221, 228, 102, 0.35) 0%, transparent 55%)," +
  "radial-gradient(90% 85% at 0% 100%, rgba(141, 195, 225, 0.28) 0%, transparent 58%)," +
  "radial-gradient(70% 70% at 70% 80%, rgba(56, 83, 164, 0.45) 0%, transparent 60%)," +
  "linear-gradient(150deg, #142644 0%, #1a2f55 40%, #162848 100%)";

export default function PublicCalculatorPage() {
  return (
    // No `isolate` here: it would trap the fixed HeroNavbar under the marketing
    // Footer (`z-10`). Paint the brand backdrop on this wrapper instead.
    <div
      className="relative min-h-svh overflow-x-hidden"
      style={{ background: CALCULATOR_PAGE_BG }}
    >
      <HeroNavbar variant="overlay" />
      <div
        className="portal-shell relative flex min-h-svh flex-col"
        data-theme="dark"
        data-backdrop="brand"
      >
        <div
          className="portal-content-area relative flex flex-1 flex-col overflow-x-hidden"
          data-backdrop="brand"
        >
          <section className="relative mx-auto w-full min-w-0 max-w-6xl px-3 pb-16 pt-20 sm:px-4 sm:pb-20 sm:pt-28 md:px-6 lg:px-8 lg:pt-32">
            <div className="dashboard-screen min-w-0 overflow-x-hidden">
              <StudentPeptideCalculatorPage embedded />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
