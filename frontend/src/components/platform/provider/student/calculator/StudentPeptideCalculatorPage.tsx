"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { CalculatorPageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { CalculatorPageLayout } from "@/components/platform/provider/student/calculator/CalculatorPageLayout";
import { CalculatorVisual } from "@/components/platform/provider/student/calculator/CalculatorVisual";
import { SyringeSizeOption } from "@/components/platform/provider/student/calculator/CalculatorAssetIllustrations";
import { InjectionAnimation } from "@/components/platform/provider/student/calculator/InjectionAnimation";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
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

const amountFieldClass = cn(
  "calc-amount-field min-w-0 flex-1 appearance-none border-0 bg-transparent px-1.5 py-0 text-center text-sm font-medium text-[color:var(--dash-text)] outline-none ring-0 [appearance:textfield] placeholder:text-[color:var(--dash-faint)]",
  "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
  "focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
);

const amountControlClass = cn(
  "calc-amount-control flex h-12 min-h-12 w-full max-w-[15rem] shrink-0 items-stretch overflow-hidden rounded-lg border border-[color:var(--dash-surface-border)] transition-[border-color]",
  "hover:border-[#DDE466] focus-within:border-[#DDE466]",
);

const unitCapsuleClass =
  "calc-unit-capsule inline-flex h-12 min-h-12 min-w-[3.5rem] shrink-0 items-center justify-center rounded-lg border border-[color:var(--dash-surface-border)] px-3 text-sm font-medium leading-none text-[color:var(--dash-muted)]";

/** Step size for the amount counter — matches typical vial / dose increments. */
function amountStepForUnit(unit?: string): number {
  switch (unit) {
    case "g":
      return 0.1;
    case "ml":
      return 0.5;
    case "mcg":
      return 10;
    case "mg":
    default:
      return 1;
  }
}

function formatSteppedAmount(value: number, step: number): string {
  const decimals = step < 1 ? String(step).split(".")[1]?.length ?? 1 : 0;
  const rounded = Number(value.toFixed(decimals));
  return decimals > 0 ? String(rounded) : String(Math.round(rounded));
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
  const [syringeMl, setSyringeMl] = useState<SyringeSizeMl>(1);
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

      <section className="dashboard-surface min-w-0 overflow-x-hidden rounded-2xl p-2.5 max-[390px]:p-2 sm:p-5 md:p-6">
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
                <div className="flex flex-wrap items-center justify-center gap-1 max-[390px]:gap-1 sm:gap-2 lg:justify-start">
                  {SYRINGE_SIZES_ML.map((size) => (
                    <SyringeSizeOption
                      key={size}
                      size={size}
                      selected={syringeMl === size}
                      onSelect={() => setSyringeMl(size)}
                    />
                  ))}
                </div>
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
              <div className="hols-auth-card calc-step-card flex h-full flex-col justify-center rounded-xl p-3 text-center max-[390px]:p-2.5 sm:p-6 lg:text-left">
                <h2 className="font-sans text-base font-semibold leading-[1.15] tracking-[0.01em] text-[color:var(--dash-text)] max-[390px]:text-sm sm:text-xl">
                  Results
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-2 max-[390px]:gap-1.5 sm:mt-4 sm:grid-cols-2 sm:gap-3">
                  <div className="dashboard-row rounded-2xl px-3 py-3 max-[390px]:px-2.5 max-[390px]:py-2.5 sm:px-5 sm:py-5">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Units per dose
                    </p>
                    <p className="font-sans mt-1 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] max-[390px]:text-lg sm:mt-1.5 sm:text-3xl">
                      <span ref={unitsRef}>{result.unitsPerDose.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="dashboard-row rounded-2xl px-3 py-3 max-[390px]:px-2.5 max-[390px]:py-2.5 sm:px-5 sm:py-5">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Total doses in vial
                    </p>
                    <p className="font-sans mt-1 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] max-[390px]:text-lg sm:mt-1.5 sm:text-3xl">
                      <span ref={dosesRef}>{result.totalDoses.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <p className="text-brand-body mx-auto mt-3 max-w-md text-xs text-[color:var(--dash-muted)] max-[390px]:mt-2.5 sm:mt-4 sm:text-sm lg:mx-0">
                  Draw to {result.unitsPerDose.toFixed(2)} units ({result.doseVolumeMl} ml) on your{" "}
                  {syringeMl} ml syringe.
                </p>
                <button
                  type="button"
                  onClick={restart}
                  className="font-sans mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 active:scale-[0.98] sm:mt-6 sm:w-auto sm:px-6"
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
                    "absolute left-[calc(50%+0.85rem)] right-[calc(-50%+0.85rem)] top-[0.7rem] h-[2px] sm:left-[calc(50%+1rem)] sm:right-[calc(-50%+1rem)] sm:top-[0.85rem]",
                    connectorDone ? "bg-[#DDE466]" : "bg-[color:var(--dash-surface-border)]",
                  )}
                />
              ) : null}

              <span
                className={cn(
                  "relative z-[1] flex h-6 w-6 items-center justify-center rounded-full sm:h-7 sm:w-7",
                  done && "bg-[#DDE466] text-[#152744]",
                  active && "border-2 border-[#DDE466] bg-[color:var(--dash-surface,#fff)]",
                  pending && "bg-[color:var(--dash-soft)]",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <SidebarSvgIcon name="check" size={14} strokeWidth={2.6} className="text-[#152744]" />
                ) : (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5",
                      active ? "bg-[#DDE466]" : "bg-[color:var(--dash-dim)]",
                    )}
                  />
                )}
              </span>

              <p
                className={cn(
                  "font-sans mt-2 max-w-[5.5rem] text-[11px] font-semibold leading-tight tracking-[0.01em] sm:mt-2.5 sm:max-w-[7rem] sm:text-sm",
                  active
                    ? "text-[color:var(--dash-accent,#6f7a1c)]"
                    : "text-[color:var(--dash-text)]",
                )}
              >
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 max-w-[5.75rem] text-[10px] leading-snug sm:max-w-[8rem] sm:text-xs",
                  active
                    ? "text-[color:var(--dash-accent,#6f7a1c)]"
                    : "text-[color:var(--dash-faint)]",
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
    <div className="hols-auth-card calc-step-card flex w-full flex-col rounded-xl p-3 max-[390px]:p-2.5 sm:p-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 text-center max-[390px]:gap-2.5 sm:gap-5 lg:mx-0 lg:max-w-none lg:items-start lg:text-left">
        <div className="min-w-0 w-full">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            {eyebrow}
          </p>
          <h2 className="font-sans mt-1 text-sm font-semibold leading-[1.3] tracking-[0.01em] text-[color:var(--dash-text)] max-[390px]:text-[13px] sm:mt-1.5 sm:text-lg md:text-xl">
            {title}
          </h2>
          <p className="text-brand-body mt-1 text-xs text-[color:var(--dash-muted)] max-[390px]:text-[11px] max-[390px]:leading-snug sm:mt-2 sm:text-sm">
            {hint}
          </p>
        </div>
        <div className="w-full min-w-0">{children}</div>
        <div className="w-full border-t border-[color:var(--dash-surface-border)] pt-2.5 max-[390px]:pt-2 sm:pt-4">
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
  return (
    <div className="flex w-full flex-row flex-wrap items-center justify-center gap-1.5 max-[390px]:gap-1 sm:flex-nowrap sm:gap-2 lg:justify-start">
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        className="dashboard-pill-soft font-sans inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-4 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-40 sm:flex-none sm:px-5"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        className="font-sans inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 sm:flex-none sm:px-6"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function CalcUnitSelect({
  value,
  units,
  onChange,
}: {
  value: MassUnit;
  units: MassUnit[];
  onChange: (unit: MassUnit) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="calc-unit-select relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Unit"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "calc-unit-trigger flex h-12 min-h-12 min-w-[5.75rem] items-center justify-between gap-2 rounded-lg border border-[color:var(--dash-surface-border)] px-3 pr-9 text-left text-sm font-medium leading-none transition-[border-color]",
          "hover:border-[#DDE466] focus:border-[#DDE466] focus:outline-none",
          open && "border-[#DDE466]",
        )}
      >
        <span className="calc-unit-trigger-label block overflow-visible whitespace-nowrap text-[color:var(--dash-text)]">
          {value}
        </span>
      </button>
      <span
        className="quiz-select-chevron pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center"
        aria-hidden
      >
        <SidebarSvgIcon
          name={open ? "chevron-up" : "chevron-down"}
          size={15}
          strokeWidth={2.35}
        />
      </span>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="quiz-select-menu absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 min-w-full overflow-hidden rounded-lg p-1.5"
        >
          {units.map((option) => {
            const isSelected = option === value;
            return (
              <li key={option} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "quiz-select-option font-sans flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm leading-normal transition",
                    isSelected ? "is-selected" : "",
                  )}
                >
                  <span className="overflow-visible whitespace-nowrap">{option}</span>
                  {isSelected ? (
                    <SidebarSvgIcon name="check" size={13} strokeWidth={2.2} className="shrink-0" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
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
  const activeUnit = unitLabel ?? unit;
  const step = amountStepForUnit(activeUnit);
  const numericValue = Number.parseFloat(value);
  const hasPositiveValue = Number.isFinite(numericValue) && numericValue > 0;
  const canDecrease = hasPositiveValue && numericValue > step;

  function nudge(delta: number) {
    const base = hasPositiveValue ? numericValue : step;
    const next = base + delta * step;
    if (next < step) return;
    onValueChange(formatSteppedAmount(next, step));
  }

  function handleChange(raw: string) {
    if (raw === "") {
      onValueChange("");
      return;
    }
    // Allow in-progress typing (e.g. "0." / ".") but never commit a bare zero.
    if (raw === "0" || raw === "0.0" || raw === "0.00") return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    if (parsed === 0) return;
    onValueChange(raw);
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 sm:flex-nowrap lg:justify-start">
      <div className={amountControlClass}>
        <button
          type="button"
          aria-label={`Decrease by ${step}${activeUnit ? ` ${activeUnit}` : ""}`}
          onClick={() => nudge(-1)}
          disabled={!canDecrease}
          className="calc-amount-btn calc-amount-btn--minus flex w-11 shrink-0 items-center justify-center transition hover:bg-[#DDE466]/25 hover:text-[#152744] active:bg-[#DDE466]/35 disabled:pointer-events-none disabled:opacity-35"
        >
          <SidebarSvgIcon name="minus" size={17} strokeWidth={2.35} />
        </button>
        <input
          type="number"
          min={step}
          step={step}
          value={value}
          placeholder="—"
          autoComplete="off"
          inputMode="decimal"
          onChange={(event) => handleChange(event.target.value)}
          onBlur={() => {
            if (!hasPositiveValue && value !== "") {
              onValueChange(formatSteppedAmount(step, step));
            }
          }}
          className={amountFieldClass}
          aria-label="Amount"
        />
        <button
          type="button"
          aria-label={`Increase by ${step}${activeUnit ? ` ${activeUnit}` : ""}`}
          onClick={() => nudge(1)}
          className="calc-amount-btn calc-amount-btn--plus flex w-11 shrink-0 items-center justify-center transition hover:bg-[#DDE466]/25 hover:text-[#152744] active:bg-[#DDE466]/35"
        >
          <SidebarSvgIcon name="plus" size={17} strokeWidth={2.35} />
        </button>
      </div>
      {unitLabel ? (
        <span className={unitCapsuleClass}>{unitLabel}</span>
      ) : units && unit && onUnitChange ? (
        <CalcUnitSelect value={unit} units={units} onChange={onUnitChange} />
      ) : null}
    </div>
  );
}
