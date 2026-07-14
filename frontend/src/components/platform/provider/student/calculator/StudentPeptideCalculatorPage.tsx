"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { CalculatorVisual } from "@/components/platform/provider/student/calculator/CalculatorVisual";
import { InjectionAnimation } from "@/components/platform/provider/student/calculator/InjectionAnimation";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
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
  { id: "peptide", label: "Peptide" },
  { id: "water", label: "Water" },
  { id: "dose", label: "Dose" },
];

const fieldClass =
  "w-full max-w-[9.5rem] rounded-xl border border-black/[0.08] bg-white px-3 py-3 text-center text-lg font-semibold text-primary outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/5";

const selectClass = cn(
  fieldClass,
  "max-w-[6rem] appearance-none bg-[length:0.9rem] bg-[right_0.7rem_center] bg-no-repeat pr-8 text-sm font-medium",
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
    <PortalShell role="student" title="Peptide Calculator" nav={studentNav}>
      <div className="mx-auto grid w-full max-w-4xl gap-5">
        <ol className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {PROGRESS_STEPS.map((item, index) => {
            const done = progressIndex > index;
            const active = progressIndex === index && step !== "animating" && step !== "result";
            const complete = step === "result" || progressIndex > index;
            return (
              <li key={item.id} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full px-3 text-[12px] font-medium transition",
                    complete || done
                      ? "bg-primary text-white"
                      : active
                        ? "bg-primary/[0.1] text-primary"
                        : "bg-white text-primary/40",
                  )}
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">
                    {index + 1}
                  </span>
                  {item.label}
                </span>
                {index < PROGRESS_STEPS.length - 1 ? (
                  <span className="h-px w-4 bg-black/10 sm:w-6" />
                ) : null}
              </li>
            );
          })}
        </ol>

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        <div
          ref={panelRef}
          className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(21,39,68,0.04)] md:p-8"
        >
          {step === "syringe" ? (
            <StepHeader title="Syringe size">
              <div className="mx-auto mt-8 max-w-lg">
                <div className="relative flex items-center justify-between px-2">
                  <div className="absolute inset-x-6 top-5 h-0.5 bg-primary/10" />
                  {SYRINGE_SIZES_ML.map((size) => {
                    const selected = syringeMl === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSyringeMl(size)}
                        className="relative z-10 flex flex-col items-center gap-2.5"
                        aria-pressed={selected}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition duration-200",
                            selected
                              ? "scale-110 border-accent bg-accent shadow-[0_0_0_6px_rgba(221,228,102,0.25)]"
                              : "border-primary/20 bg-white hover:border-primary/40",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[13px] font-medium",
                            selected ? "text-primary" : "text-primary/40",
                          )}
                        >
                          {size} ml
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </StepHeader>
          ) : null}

          {step === "peptide" ? (
            <StepHeader title="Dry peptide in vial">
              <AmountRow
                value={peptideAmount}
                onValueChange={setPeptideAmount}
                unit={peptideUnit}
                onUnitChange={setPeptideUnit}
                units={["mg", "mcg"]}
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
              <h2 className="text-xl font-semibold text-primary md:text-2xl">Preparing your dose</h2>
              <p className="mt-1.5 text-[13px] text-primary/45">
                Watch the 3D reconstitution sequence
              </p>
              <div className="mt-5">
                <InjectionAnimation onComplete={finishAnimation} />
              </div>
            </div>
          ) : null}

          {step === "result" && result ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-primary md:text-2xl">Results</h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/[0.05] bg-[#F5F7FA] px-5 py-6">
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-primary/40">
                    Units per dose
                  </p>
                  <p className="mt-2 font-sans text-4xl font-semibold text-primary">
                    <span ref={unitsRef}>{result.unitsPerDose.toFixed(2)}</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-black/[0.05] bg-[#F5F7FA] px-5 py-6">
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-primary/40">
                    Total doses in vial
                  </p>
                  <p className="mt-2 font-sans text-4xl font-semibold text-primary">
                    <span ref={dosesRef}>{result.totalDoses.toFixed(2)}</span>
                  </p>
                </div>
              </div>
              <p className="mx-auto mt-4 max-w-md text-[13px] text-primary/50">
                Draw to {result.unitsPerDose.toFixed(2)} units ({result.doseVolumeMl} ml) on your{" "}
                {syringeMl} ml syringe.
              </p>
              <Button type="button" variant="primary" size="lg" className="mt-6" onClick={restart}>
                Restart
              </Button>
            </div>
          ) : null}

          {step !== "result" && step !== "animating" ? (
            <div className="mt-8 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={goBack}
                disabled={step === "syringe"}
              >
                Back
              </Button>
              <Button type="button" variant="primary" size="lg" onClick={goNext}>
                {step === "dose" ? "Calculate" : "Next"}
              </Button>
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
            />
          ) : null}
        </div>

        <p className="text-center text-[11px] leading-relaxed text-primary/35">
          Research-use education tool only. Follow peptide documentation and institutional protocols.
        </p>
      </div>
    </PortalShell>
  );
}

function StepHeader({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-center text-xl font-semibold tracking-tight text-primary md:text-2xl">
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
        <span className="text-sm font-medium text-primary/60">{unitLabel}</span>
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
