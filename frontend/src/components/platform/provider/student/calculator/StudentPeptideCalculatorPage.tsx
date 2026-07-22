"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass } from "@/components/platform/auth/auth-styles";
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

const fieldClass = cn(
  authFieldClass,
  "max-w-[9.5rem] px-3 text-center text-lg font-semibold text-[color:var(--dash-text)]",
);

const selectClass = cn(
  fieldClass,
  "max-w-[6rem] appearance-none bg-[length:0.9rem] bg-[right_0.7rem_center] bg-no-repeat pr-8 font-sans text-sm font-medium md:text-base",
);

export function StudentPeptideCalculatorPage() {
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

  return (
    <CalculatorPageLayout>
      <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
          Learning tools
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <span className="font-sans text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.25rem] md:leading-none">
            Peptide calculator
          </span>
        </div>
        <p className="text-brand-body mt-2 max-w-2xl text-[color:var(--dash-muted)]">
          Step-by-step reconstitution and dosing helper for peptide preparations.
        </p>
      </section>

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <section className="dashboard-surface rounded-2xl p-5 md:p-6">
        <nav
          aria-label="Calculator steps"
          className="flex flex-wrap gap-1.5 rounded-2xl bg-[color:var(--dash-soft)] p-1.5"
        >
          {PROGRESS_STEPS.map((item, index) => {
            const done = progressIndex > index || step === "result";
            const active = progressIndex === index && step !== "animating" && step !== "result";
            return (
              <span
                key={item.id}
                className={cn(
                  "font-sans inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium tracking-[0.005em] transition md:text-base",
                  done
                    ? "bg-[#DDE466] text-[#152744] shadow-[0_1px_3px_rgba(21,39,68,0.12)]"
                    : active
                      ? "bg-[color:var(--dash-surface)] text-[color:var(--dash-text)] shadow-[0_1px_3px_rgba(21,39,68,0.08)]"
                      : "text-[color:var(--dash-faint)]",
                )}
              >
                <span
                  className={cn(
                    "text-brand-caption flex h-4 w-4 items-center justify-center rounded-full font-semibold",
                    done
                      ? "bg-[#152744]/15"
                      : active
                        ? "bg-[color:var(--dash-soft)] text-[color:var(--dash-text)]"
                        : "bg-[color:var(--dash-soft)]",
                  )}
                >
                  {index + 1}
                </span>
                {item.label}
              </span>
            );
          })}
        </nav>

        <div ref={panelRef} className="mt-6">
          {step === "syringe" ? (
            <StepHeader title="Syringe size">
              <div className="mx-auto mt-8 max-w-3xl">
                <div className="flex flex-wrap items-center justify-center gap-2.5 px-2 sm:gap-3">
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
              <h2 className="font-sans text-center text-[1.75rem] font-bold leading-[1.05] tracking-[0.01em] text-[color:var(--dash-text)] sm:text-[2rem]">
                Preparing your dose
              </h2>
              <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
                Watch the reconstitution sequence
              </p>
              <div className="mt-5">
                <InjectionAnimation
                  onComplete={finishAnimation}
                  syringeMl={syringeMl}
                  peptideUnit={peptideUnit}
                />
              </div>
            </div>
          ) : null}

          {step === "result" && result ? (
            <div className="text-center">
              <h2 className="font-sans text-center text-[1.75rem] font-bold leading-[1.05] tracking-[0.01em] text-[color:var(--dash-text)] sm:text-[2rem]">
                Results
              </h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="dashboard-row rounded-2xl px-5 py-6">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Units per dose
                  </p>
                  <p className="font-sans mt-2 text-3xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-4xl">
                    <span ref={unitsRef}>{result.unitsPerDose.toFixed(2)}</span>
                  </p>
                </div>
                <div className="dashboard-row rounded-2xl px-5 py-6">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Total doses in vial
                  </p>
                  <p className="font-sans mt-2 text-3xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-4xl">
                    <span ref={dosesRef}>{result.totalDoses.toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <p className="text-brand-body mx-auto mt-4 max-w-md text-[color:var(--dash-muted)]">
                Draw to {result.unitsPerDose.toFixed(2)} units ({result.doseVolumeMl} ml) on your{" "}
                {syringeMl} ml syringe.
              </p>
              <button
                type="button"
                onClick={restart}
                className="font-sans mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
              >
                Restart
              </button>
            </div>
          ) : null}

          {step !== "result" && step !== "animating" ? (
            <div className="mt-8 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={goBack}
                disabled={step === "syringe"}
                className="dashboard-pill-soft font-sans inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={goNext}
                className="font-sans inline-flex min-h-11 items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
              >
                {step === "dose" ? "Calculate" : "Next"}
              </button>
            </div>
          ) : null}

          {step !== "animating" ? (
            <CalculatorVisual
              mode={visualMode}
              syringeMl={syringeMl}
              unitsPerDose={result?.unitsPerDose ?? 0}
              maxUnits={result?.maxUnitsOnSyringe ?? syringeMl * 100}
              waterFilled={step !== "syringe"}
              medicationFilled={step === "water" || step === "dose" || step === "result"}
              peptideUnit={peptideUnit}
            />
          ) : null}
        </div>
      </section>

      <p className="text-brand-caption text-center leading-relaxed text-[color:var(--dash-faint)]">
        Research-use education tool only. Follow peptide documentation and institutional protocols.
      </p>
    </CalculatorPageLayout>
  );
}

function StepHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-sans text-center text-[1.75rem] font-bold leading-[1.05] tracking-[0.01em] text-[color:var(--dash-text)] sm:text-[2rem]">
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
    <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-3">
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={fieldClass}
        aria-label="Amount"
      />
      {unitLabel ? (
        <span className="font-sans text-sm font-medium text-[color:var(--dash-muted)] md:text-base">
          {unitLabel}
        </span>
      ) : (
        <select
          value={unit}
          onChange={(event) => onUnitChange?.(event.target.value as MassUnit)}
          className={selectClass}
          aria-label="Unit"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23152744' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
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
