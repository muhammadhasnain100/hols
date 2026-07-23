"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { CalculatorPageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { CalculatorPageLayout } from "@/components/platform/provider/student/calculator/CalculatorPageLayout";
import { CalculatorVisual } from "@/components/platform/provider/student/calculator/CalculatorVisual";
import { SyringeSizeOption } from "@/components/platform/provider/student/calculator/CalculatorAssetIllustrations";
import { InjectionAnimation } from "@/components/platform/provider/student/calculator/InjectionAnimation";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import {
  SYRINGE_SIZES_ML,
  calculatePeptideDose,
  type MassUnit,
  type PeptideCalculatorResult,
  type SyringeSizeMl,
} from "@/lib/integrate/provider/student/calculator";
import { cn } from "@/lib/utils";

type Step = "syringe" | "peptide" | "water" | "dose" | "animating" | "result";

const PROGRESS_STEPS: Array<{ id: Exclude<Step, "animating" | "result">; label: string }> = [
  { id: "syringe", label: "Syringe" },
  { id: "peptide", label: "Medication" },
  { id: "water", label: "Water" },
  { id: "dose", label: "Dose" },
];

const amountFieldClass = cn(
  "dashboard-field !h-9 !w-[5.25rem] max-w-[42vw] shrink-0 !rounded-full !px-2.5 !py-0 text-center text-sm font-medium sm:!h-10 sm:!w-[6.25rem] sm:!px-3",
);

const unitFieldClass = cn(
  "dashboard-field dashboard-field-select !h-9 !w-[4rem] max-w-[30vw] shrink-0 appearance-none !rounded-full bg-[length:0.65rem] bg-[right_0.55rem_center] bg-no-repeat !px-2 !py-0 !pr-5 text-center text-xs font-medium sm:!h-10 sm:!w-[4.5rem] sm:!pr-6 sm:text-sm",
);

const unitCapsuleClass =
  "dashboard-pill-soft inline-flex h-9 min-w-[3.25rem] shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-medium text-[color:var(--dash-muted)] sm:h-10 sm:min-w-[3.75rem] sm:px-3 sm:text-sm";

export function StudentPeptideCalculatorPage({
  embedded = false,
  hideHero = false,
}: {
  embedded?: boolean;
  /** Hide the top hero when the parent page already provides one (course calculator). */
  hideHero?: boolean;
} = {}) {
  const [ready, setReady] = useState(embedded);
  const [step, setStep] = useState<Step>("syringe");
  const [syringeMl, setSyringeMl] = useState<SyringeSizeMl>(1);
  const [peptideAmount, setPeptideAmount] = useState("10");
  const [peptideUnit, setPeptideUnit] = useState<MassUnit>("mg");
  const [waterMl, setWaterMl] = useState("1");
  const [doseAmount, setDoseAmount] = useState("500");
  const [doseUnit, setDoseUnit] = useState<MassUnit>("mcg");
  const [result, setResult] = useState<PeptideCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingResultRef = useRef<PeptideCalculatorResult | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unitsRef = useRef<HTMLSpanElement>(null);
  const dosesRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (embedded) return;
    setReady(true);
  }, [embedded]);

  const progressIndex =
    step === "animating" || step === "result"
      ? PROGRESS_STEPS.length - 1
      : PROGRESS_STEPS.findIndex((s) => s.id === step);

  const visualMode = useMemo(() => {
    if (step === "result") return "result" as const;
    if (step === "animating") return "dose" as const;
    return step;
  }, [step]);

  const finishAnimation = useCallback(() => {
    const pending = pendingResultRef.current;
    if (!pending) return;
    setResult(pending);
    pendingResultRef.current = null;
    setStep("result");
  }, []);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !panelRef.current) return;
      gsap.fromTo(
        panelRef.current,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" },
      );
    },
    { dependencies: [step] },
  );

  useEffect(() => {
    if (step !== "result" || !result || prefersReducedMotion()) return;
    registerGsap();
    const units = { value: 0 };
    const doses = { value: 0 };
    if (unitsRef.current) {
      gsap.to(units, {
        value: result.unitsPerDose,
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          if (unitsRef.current) unitsRef.current.textContent = units.value.toFixed(2);
        },
      });
    }
    if (dosesRef.current) {
      gsap.to(doses, {
        value: result.totalDoses,
        duration: 1,
        delay: 0.1,
        ease: "power2.out",
        onUpdate: () => {
          if (dosesRef.current) dosesRef.current.textContent = doses.value.toFixed(2);
        },
      });
    }
  }, [result, step]);

  function goBack() {
    setError(null);
    if (step === "animating") return;
    const index = PROGRESS_STEPS.findIndex((s) => s.id === step);
    if (index <= 0) return;
    setStep(PROGRESS_STEPS[index - 1].id);
    setResult(null);
    pendingResultRef.current = null;
  }

  function restart() {
    setStep("syringe");
    setSyringeMl(1);
    setPeptideAmount("10");
    setPeptideUnit("mg");
    setWaterMl("1");
    setDoseAmount("500");
    setDoseUnit("mcg");
    setResult(null);
    pendingResultRef.current = null;
    setError(null);
  }

  function validatePositive(value: string, label: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Enter a valid ${label} greater than zero.`);
    }
    return parsed;
  }

  function goNext() {
    setError(null);
    try {
      if (step === "syringe") {
        setStep("peptide");
        return;
      }
      if (step === "peptide") {
        validatePositive(peptideAmount, "peptide amount");
        setStep("water");
        return;
      }
      if (step === "water") {
        validatePositive(waterMl, "water volume");
        setStep("dose");
        return;
      }
      if (step === "dose") {
        const peptide = validatePositive(peptideAmount, "peptide amount");
        const water = validatePositive(waterMl, "water volume");
        const dose = validatePositive(doseAmount, "desired dose");
        const computed = calculatePeptideDose({
          syringeMl,
          peptideAmount: peptide,
          peptideUnit,
          waterMl: water,
          doseAmount: dose,
          doseUnit,
        });
        pendingResultRef.current = computed;
        setStep("animating");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue.");
    }
  }

  const showVisual = step !== "animating";
  const isWideLayout = step !== "animating";

  const content = !ready ? (
    <CalculatorPageSkeleton />
  ) : (
    <>
      {!hideHero ? (
        <section className="dashboard-hero relative min-w-0 overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between md:gap-5">
            <div className="min-w-0">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                Learning tools
              </p>
              <h2 className="font-sans mt-1.5 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:mt-2 sm:text-2xl md:text-[2.25rem] md:leading-none">
                Peptide calculator
              </h2>
              <p className="text-brand-body mt-1.5 max-w-2xl text-sm text-[color:var(--dash-muted)] sm:mt-2 sm:text-base">
                Step-by-step reconstitution and dosing helper for peptide preparations.
              </p>
            </div>

            <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:gap-2.5">
              <span className="dashboard-pill-soft font-sans inline-flex min-h-9 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium text-[color:var(--dash-text)] sm:min-h-10 sm:flex-none sm:px-4 sm:text-sm">
                {PROGRESS_STEPS[Math.min(progressIndex, PROGRESS_STEPS.length - 1)]?.label ?? "Syringe"}
              </span>
              <span className="font-sans inline-flex min-h-9 flex-1 items-center justify-center rounded-full bg-[#DDE466] px-3 text-xs font-medium text-[#152744] sm:min-h-10 sm:flex-none sm:px-4 sm:text-sm">
                Step {Math.min(progressIndex + 1, PROGRESS_STEPS.length)} / {PROGRESS_STEPS.length}
              </span>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-2.5">
          <span className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-3 text-xs font-medium text-[color:var(--dash-text)] sm:min-h-10 sm:px-4 sm:text-sm">
            {PROGRESS_STEPS[Math.min(progressIndex, PROGRESS_STEPS.length - 1)]?.label ?? "Syringe"}
          </span>
          <span className="font-sans inline-flex min-h-9 items-center justify-center rounded-full bg-[#DDE466] px-3 text-xs font-medium text-[#152744] sm:min-h-10 sm:px-4 sm:text-sm">
            Step {Math.min(progressIndex + 1, PROGRESS_STEPS.length)} / {PROGRESS_STEPS.length}
          </span>
        </div>
      )}

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <section className="dashboard-surface min-w-0 overflow-visible rounded-2xl p-3 sm:p-5 md:p-6">
        <nav
          aria-label="Calculator steps"
          className="flex gap-1 overflow-x-auto overscroll-x-contain rounded-full bg-[color:var(--dash-soft)] p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1.5 sm:p-1 [&::-webkit-scrollbar]:hidden"
        >
          {PROGRESS_STEPS.map((item, index) => {
            const done = progressIndex > index || step === "result";
            const active = progressIndex === index && step !== "animating" && step !== "result";
            return (
              <span
                key={item.id}
                className={cn(
                  "font-sans inline-flex h-7 min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-1.5 text-[10px] font-medium tracking-[0.005em] transition sm:h-8 sm:gap-1.5 sm:px-3 sm:text-xs md:text-sm",
                  done
                    ? "bg-[#DDE466] text-[#152744] shadow-[0_1px_3px_rgba(21,39,68,0.12)]"
                    : active
                      ? "bg-[color:var(--dash-surface)] text-[color:var(--dash-text)] shadow-[0_1px_3px_rgba(21,39,68,0.08)]"
                      : "text-[color:var(--dash-faint)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none",
                    done
                      ? "bg-[#152744]/15"
                      : active
                        ? "bg-[color:var(--dash-soft)] text-[color:var(--dash-text)]"
                        : "bg-[color:var(--dash-soft)]",
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate">{item.label}</span>
              </span>
            );
          })}
        </nav>

        <div
          ref={panelRef}
          className={cn(
            "mt-4 min-w-0 sm:mt-5 md:mt-6",
            isWideLayout
              ? "grid min-w-0 gap-4 md:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-6"
              : "mx-auto w-full max-w-3xl",
          )}
        >
          <div className="order-2 min-w-0 lg:order-1">
            {step === "syringe" ? (
              <StepHeader title="Syringe size">
                <div className="dashboard-glass-card mx-auto mt-4 w-full max-w-lg rounded-2xl p-2.5 sm:mt-5 sm:p-4 lg:mx-0">
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    {SYRINGE_SIZES_ML.map((size) => (
                      <SyringeSizeOption
                        key={size}
                        size={size}
                        selected={syringeMl === size}
                        onSelect={() => setSyringeMl(size)}
                      />
                    ))}
                  </div>
                </div>
              </StepHeader>
            ) : null}

            {step === "peptide" ? (
              <StepHeader title="Total amount of dry medication in your vial:">
                <AmountRow
                  value={peptideAmount}
                  onValueChange={setPeptideAmount}
                  unit={peptideUnit}
                  onUnitChange={setPeptideUnit}
                  units={["g", "mg", "mcg"]}
                />
              </StepHeader>
            ) : null}

            {step === "water" ? (
              <StepHeader title="Bacteriostatic water">
                <AmountRow value={waterMl} onValueChange={setWaterMl} unitLabel="ml" />
              </StepHeader>
            ) : null}

            {step === "dose" ? (
              <StepHeader title="Desired dose">
                <AmountRow
                  value={doseAmount}
                  onValueChange={setDoseAmount}
                  unit={doseUnit}
                  onUnitChange={setDoseUnit}
                  units={["mcg", "mg"]}
                />
              </StepHeader>
            ) : null}

            {step === "animating" ? (
              <div className="text-center">
                <h2 className="font-sans text-lg font-semibold leading-[1.15] tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
                  Preparing your dose
                </h2>
                <p className="text-brand-body mt-1.5 text-sm text-[color:var(--dash-muted)]">
                  Watch the reconstitution sequence
                </p>
                <div className="mt-4 min-w-0 sm:mt-5">
                  <InjectionAnimation
                    onComplete={finishAnimation}
                    syringeMl={syringeMl}
                    peptideUnit={peptideUnit}
                  />
                </div>
              </div>
            ) : null}

            {step === "result" && result ? (
              <div className="text-center lg:text-left">
                <h2 className="font-sans text-lg font-semibold leading-[1.15] tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
                  Results
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  <div className="dashboard-glass-card rounded-2xl px-4 py-4 sm:px-5 sm:py-5">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Units per dose
                    </p>
                    <p className="font-sans mt-1.5 text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-3xl">
                      <span ref={unitsRef}>{result.unitsPerDose.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="dashboard-glass-card rounded-2xl px-4 py-4 sm:px-5 sm:py-5">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Total doses in vial
                    </p>
                    <p className="font-sans mt-1.5 text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-3xl">
                      <span ref={dosesRef}>{result.totalDoses.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <p className="text-brand-body mx-auto mt-4 max-w-md text-sm text-[color:var(--dash-muted)] lg:mx-0">
                  Draw to {result.unitsPerDose.toFixed(2)} units ({result.doseVolumeMl} ml) on your{" "}
                  {syringeMl} ml syringe.
                </p>
                <button
                  type="button"
                  onClick={restart}
                  className="font-sans mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 sm:mt-6 sm:min-h-11 sm:w-auto"
                >
                  Restart
                </button>
              </div>
            ) : null}

            {step !== "result" && step !== "animating" ? (
              <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2.5">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === "syringe"}
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:min-h-11 sm:w-auto disabled:pointer-events-none disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 sm:min-h-11 sm:w-auto"
                >
                  {step === "dose" ? "Calculate" : "Next"}
                </button>
              </div>
            ) : null}
          </div>

          {showVisual ? (
            <div className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-4">
              <CalculatorVisual
                mode={visualMode}
                syringeMl={syringeMl}
                unitsPerDose={result?.unitsPerDose ?? 0}
                maxUnits={result?.maxUnitsOnSyringe ?? syringeMl * 100}
                waterFilled={step !== "syringe"}
                medicationFilled={step === "water" || step === "dose" || step === "result"}
                peptideUnit={peptideUnit}
              />
            </div>
          ) : null}
        </div>
      </section>

      <p className="text-brand-caption px-1 text-center leading-relaxed text-[color:var(--dash-faint)]">
        Research-use education tool only. Follow peptide documentation and institutional protocols.
      </p>
    </>
  );

  if (embedded) {
    return <div className="grid w-full min-w-0 gap-3 sm:gap-4">{content}</div>;
  }

  return <CalculatorPageLayout>{content}</CalculatorPageLayout>;
}

function StepHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h2 className="font-sans text-center text-base font-semibold leading-[1.3] tracking-[0.01em] text-[color:var(--dash-text)] sm:text-lg lg:text-left">
        {title}
      </h2>
      {children}
    </div>
  );
}

function AmountRow({
  value,
  onValueChange,
  unit,
  onUnitChange,
  units,
  unitLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  unit?: MassUnit;
  onUnitChange?: (unit: MassUnit) => void;
  units?: MassUnit[];
  unitLabel?: string;
}) {
  return (
    <div className="mx-auto mt-4 flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-2 lg:mx-0 lg:justify-start">
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={amountFieldClass}
        aria-label="Amount"
      />
      {unitLabel ? (
        <span className={unitCapsuleClass}>{unitLabel}</span>
      ) : (
        <select
          value={unit}
          onChange={(event) => onUnitChange?.(event.target.value as MassUnit)}
          className={unitFieldClass}
          aria-label="Unit"
        >
          {units?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
