"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { CalculatorPageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { CalculatorPageLayout } from "@/components/platform/provider/student/calculator/CalculatorPageLayout";
import { CalculatorVisual } from "@/components/platform/provider/student/calculator/CalculatorVisual";
import { InjectionAnimation } from "@/components/platform/provider/student/calculator/InjectionAnimation";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import {
  SYRINGE_SIZES_ML,
  calculatePeptideDose,
  type MassUnit,
  type PeptideCalculatorResult,
  type SyringePresetMl,
} from "@/lib/integrate/provider/student/calculator";
import { cn } from "@/lib/utils";

type Step = "syringe" | "peptide" | "water" | "dose" | "animating" | "result";

const PROGRESS_STEPS: Array<{
  id: Exclude<Step, "animating" | "result">;
  label: string;
  description: string;
}> = [
  { id: "syringe", label: "Syringe", description: "Choose syringe size" },
  { id: "peptide", label: "Medication", description: "Enter peptide amount" },
  { id: "water", label: "Water", description: "Add diluent volume" },
  { id: "dose", label: "Dose", description: "Set desired dose" },
];

const calcSelectClass = "dashboard-field dashboard-field-select min-h-11 w-full py-0 sm:min-h-12";

const calcAmountInputClass =
  "calc-amount-field hols-plain-control min-w-0 flex-1 px-4 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function isAmountDraft(raw: string): boolean {
  return raw === "" || /^\d*\.?\d*$/.test(raw);
}

function parseSyringePreset(raw: string): SyringePresetMl {
  const value = Number(raw);
  return (SYRINGE_SIZES_ML as readonly number[]).includes(value) ? (value as SyringePresetMl) : 1;
}

export function StudentPeptideCalculatorPage({
  embedded = false,
}: {
  embedded?: boolean;
  /** @deprecated Hero removed — kept optional for call-site compatibility. */
  hideHero?: boolean;
} = {}) {
  const [ready, setReady] = useState(embedded);
  const [step, setStep] = useState<Step>("syringe");
  const [syringeMl, setSyringeMl] = useState<SyringePresetMl>(1);
  const [peptideAmount, setPeptideAmount] = useState("");
  const [peptideUnit, setPeptideUnit] = useState<MassUnit>("mg");
  const [waterMl, setWaterMl] = useState("");
  const [doseAmount, setDoseAmount] = useState("");
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
    setPeptideAmount("5");
    setPeptideUnit("mg");
    setWaterMl("2");
    setDoseAmount("250");
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
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <section className="calculator-workspace dashboard-surface min-w-0 max-w-full overflow-x-hidden rounded-2xl p-2.5 max-[390px]:p-2 sm:p-5 md:p-6">
        <CalculatorStepper progressIndex={progressIndex} step={step} />

        <div
          ref={panelRef}
          className={cn(
            "mt-3 min-w-0 max-[390px]:mt-2.5 sm:mt-5 md:mt-6",
            isWideLayout
              // Mobile: amount card first, vial/syringe visual second.
              // Desktop (lg+): same DOM order → amount left, visual right (3fr : 5fr).
              ? "grid min-w-0 gap-3 max-[390px]:gap-2.5 md:gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,5fr)] lg:items-start lg:gap-6"
              : "mx-auto w-full max-w-3xl",
          )}
        >
          <div className="order-1 flex min-h-0 min-w-0 flex-col">
            {step === "syringe" ? (
              <StepPanel
                eyebrow="Select size"
                title="Syringe size"
                hint="Choose the syringe you will draw with for this reconstitution."
                actions={
                  <StepActions
                    onBack={goBack}
                    onNext={goNext}
                    backDisabled
                    nextLabel="Next"
                  />
                }
              >
                <select
                    aria-label="Syringe size"
                    value={String(syringeMl)}
                    onChange={(event) => setSyringeMl(parseSyringePreset(event.target.value))}
                    className={calcSelectClass}
                  >
                    {SYRINGE_SIZES_ML.map((size) => (
                      <option key={size} value={size}>
                        {size} ml
                      </option>
                    ))}
                  </select>
              </StepPanel>
            ) : null}

            {step === "peptide" ? (
              <StepPanel
                title="Total amount of dry medication in your vial"
                hint="Enter the labeled peptide mass before adding bacteriostatic water."
                actions={
                  <StepActions onBack={goBack} onNext={goNext} nextLabel="Next" />
                }
              >
                <AmountRow
                  value={peptideAmount}
                  onValueChange={setPeptideAmount}
                  unit={peptideUnit}
                  onUnitChange={setPeptideUnit}
                  units={["g", "mg", "mcg"]}
                />
              </StepPanel>
            ) : null}

            {step === "water" ? (
              <StepPanel
                title="Bacteriostatic water"
                hint="Volume of bacteriostatic water you will add to reconstitute the vial."
                actions={
                  <StepActions onBack={goBack} onNext={goNext} nextLabel="Next" />
                }
              >
                <AmountRow value={waterMl} onValueChange={setWaterMl} unitLabel="ml" />
              </StepPanel>
            ) : null}

            {step === "dose" ? (
              <StepPanel
                title="Desired dose"
                hint="The amount you want to draw for a single administration."
                actions={
                  <StepActions onBack={goBack} onNext={goNext} nextLabel="Calculate" />
                }
              >
                <AmountRow
                  value={doseAmount}
                  onValueChange={setDoseAmount}
                  unit={doseUnit}
                  onUnitChange={setDoseUnit}
                  units={["mcg", "mg"]}
                />
              </StepPanel>
            ) : null}

            {step === "animating" ? (
              <div className="min-w-0 text-center">
                <h2 className="font-sans text-sm font-semibold leading-[1.15] tracking-[0.01em] text-[color:var(--dash-text)] max-[390px]:text-[13px] sm:text-xl">
                  Preparing your dose
                </h2>
                <p className="text-brand-body mt-1 text-xs text-[color:var(--dash-muted)] max-[390px]:text-[11px] sm:mt-1.5 sm:text-sm">
                  Watch the reconstitution sequence
                </p>
                <div className="mt-2.5 min-w-0 max-[390px]:mt-2 sm:mt-5">
                  <InjectionAnimation
                    onComplete={finishAnimation}
                    syringeMl={syringeMl}
                    peptideUnit={peptideUnit}
                    waterMl={Number(waterMl) || 1}
                    peptideAmount={Number(peptideAmount) || 10}
                  />
                </div>
              </div>
            ) : null}

            {step === "result" && result ? (
              <div className="hols-auth-card calc-step-card flex h-full min-w-0 max-w-full flex-col justify-center overflow-hidden rounded-xl p-4 text-left max-[390px]:p-3 sm:p-6">
                <h2 className="font-sans text-pretty text-base font-semibold leading-[1.15] tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
                  Results
                </h2>
                <div className="calc-result-grid mt-4 grid min-w-0 grid-cols-2 gap-x-3 gap-y-1 sm:mt-5 sm:gap-x-5">
                  <p className="calc-result-label text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Units per dose
                  </p>
                  <p className="calc-result-label text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Total doses in vial
                  </p>
                  <p className="calc-result-value font-sans text-2xl font-bold tracking-tight text-[color:var(--dash-text)] sm:text-[1.75rem]">
                    <span ref={unitsRef}>{result.unitsPerDose.toFixed(2)}</span>
                  </p>
                  <p className="calc-result-value font-sans text-2xl font-bold tracking-tight text-[color:var(--dash-text)] sm:text-[1.75rem]">
                    <span ref={dosesRef}>{result.totalDoses.toFixed(2)}</span>
                  </p>
                </div>
                <p className="text-brand-body mt-4 min-w-0 text-xs leading-relaxed break-words text-[color:var(--dash-muted)] sm:mt-5 sm:text-sm">
                  Draw to {result.unitsPerDose.toFixed(2)} units ({result.doseVolumeMl} ml) on your{" "}
                  {syringeMl} ml syringe.
                </p>
                <button
                  type="button"
                  onClick={restart}
                  className="dashboard-navy-btn font-sans mt-5 inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold text-white sm:mt-6"
                >
                  Restart
                </button>
              </div>
            ) : null}
          </div>

          {showVisual ? (
            <div className="order-2 flex min-h-0 min-w-0">
              <div className="w-full lg:sticky lg:top-4 lg:self-start">
                <CalculatorVisual
                  mode={visualMode}
                  syringeMl={syringeMl}
                  unitsPerDose={result?.unitsPerDose ?? 0}
                  maxUnits={result?.maxUnitsOnSyringe ?? syringeMl * 100}
                  waterFilled={step === "water" || step === "dose" || step === "result"}
                  medicationFilled={step === "result"}
                  peptideUnit={peptideUnit}
                  waterMl={waterMl}
                  peptideAmount={peptideAmount}
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <p className="text-brand-caption px-1 text-center leading-relaxed text-[color:var(--dash-muted)]">
        Research-use education tool only. Follow peptide documentation and institutional protocols.
      </p>
    </>
  );

  if (embedded) {
    return <div className="calculator-page grid w-full min-w-0 max-w-full gap-3 overflow-x-hidden sm:gap-4">{content}</div>;
  }

  return <CalculatorPageLayout>{content}</CalculatorPageLayout>;
}

function CalculatorStepper({
  progressIndex,
  step,
}: {
  progressIndex: number;
  step: Step;
}) {
  return (
    <nav aria-label="Calculator steps" className="calc-stepper w-full min-w-0 px-0.5 sm:px-2">
      <ol className="relative m-0 flex list-none items-start justify-between gap-0 p-0">
        {PROGRESS_STEPS.map((item, index) => {
          const done = progressIndex > index || step === "result";
          const active =
            progressIndex === index && step !== "animating" && step !== "result";
          const pending = !done && !active;
          const connectorDone = progressIndex > index || step === "result";

          return (
            <li
              key={item.id}
              className="relative flex min-w-0 flex-1 flex-col items-center text-center"
            >
              {index < PROGRESS_STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[calc(50%+0.7rem)] right-[calc(-50%+0.7rem)] top-[0.7rem] h-[2px] sm:left-[calc(50%+1rem)] sm:right-[calc(-50%+1rem)] sm:top-[0.85rem]",
                    connectorDone ? "bg-[#DDE466]" : "bg-[color:var(--dash-surface-border)]",
                  )}
                />
              ) : null}

              <span
                className={cn(
                  "relative z-[1] flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7",
                  done && "bg-[#DDE466] text-[#152744]",
                  active && "border-2 border-[#DDE466] bg-[color:var(--dash-surface,#fff)]",
                  pending && "border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-surface)]",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <SidebarSvgIcon name="check" size={14} strokeWidth={2.6} className="text-[#152744]" />
                ) : (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5",
                      active ? "bg-[#DDE466]" : "bg-[color:var(--dash-muted)]",
                    )}
                  />
                )}
              </span>

              <p
                className={cn(
                  "font-sans mt-2 w-full truncate px-0.5 text-[11px] font-semibold leading-tight tracking-[0.01em] sm:mt-2.5 sm:px-1 sm:text-sm",
                  active
                    ? "text-[color:var(--dash-accent,#6f7a1c)]"
                    : "text-[color:var(--dash-text)]",
                )}
              >
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 hidden max-w-[8rem] text-xs leading-snug sm:block",
                  active
                    ? "text-[color:var(--dash-accent,#6f7a1c)]"
                    : "text-[color:var(--dash-muted)]",
                )}
              >
                {item.description}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepPanel({
  eyebrow = "Enter amount",
  title,
  hint,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  hint: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="hols-auth-card calc-step-card flex w-full min-w-0 max-w-full flex-col rounded-xl p-3 max-[390px]:p-2.5 sm:p-6">
      <div className="mx-auto flex w-full min-w-0 max-w-sm flex-col items-center gap-3 text-center max-[390px]:gap-2.5 sm:gap-5 lg:mx-0 lg:max-w-none lg:items-start lg:text-left">
        <div className="w-full min-w-0">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-muted)]">
            {eyebrow}
          </p>
          <h2 className="font-sans mt-1 text-pretty text-sm font-semibold leading-[1.3] tracking-[0.01em] text-[color:var(--dash-text)] sm:mt-1.5 sm:text-lg md:text-xl">
            {title}
          </h2>
          <p className="text-brand-body mt-1 text-pretty text-xs leading-snug text-[color:var(--dash-muted)] sm:mt-2 sm:text-sm sm:leading-relaxed">
            {hint}
          </p>
        </div>
        <div className="w-full min-w-0">{children}</div>
        <div className="w-full min-w-0 border-t border-[color:var(--dash-surface-border)] pt-2.5 max-[390px]:pt-2 sm:pt-4">
          {actions}
        </div>
      </div>
    </div>
  );
}

function StepActions({
  onBack,
  onNext,
  backDisabled = false,
  nextLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  nextLabel: string;
}) {
  const showBack = !backDisabled;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5",
        showBack ? "sm:justify-between" : "sm:justify-end",
      )}
    >
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] sm:w-auto"
        >
          <SidebarSvgIcon name="previous" size={14} strokeWidth={2.2} />
          Back
        </button>
      ) : null}
      <button
        type="button"
        onClick={onNext}
        className="dashboard-navy-btn font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white sm:w-auto sm:px-6"
      >
        {nextLabel}
        {nextLabel !== "Calculate" ? (
          <SidebarSvgIcon name="next" size={14} strokeWidth={2.2} />
        ) : null}
      </button>
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
  function handleChange(raw: string) {
    if (!isAmountDraft(raw)) return;
    onValueChange(raw);
  }

  return (
    <div className="grid w-full min-w-0 gap-2 text-left">
      <span className="dashboard-field-label">Amount</span>
      <div className="calc-amount-control dashboard-field hols-hover-border">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder="Enter amount"
          onChange={(event) => handleChange(event.target.value)}
          className={calcAmountInputClass}
          aria-label="Amount"
        />
        {unitLabel || (units && unit && onUnitChange) ? (
          <span className="calc-amount-divider" aria-hidden />
        ) : null}
        {unitLabel ? (
          <span className="calc-amount-unit-static">{unitLabel}</span>
        ) : units && unit && onUnitChange ? (
          <span className="calc-amount-unit">
            <select
              aria-label="Unit"
              value={unit}
              onChange={(event) => onUnitChange(event.target.value as MassUnit)}
              className="calc-amount-unit-select hols-plain-control"
            >
              {units.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </span>
        ) : null}
      </div>
    </div>
  );
}
