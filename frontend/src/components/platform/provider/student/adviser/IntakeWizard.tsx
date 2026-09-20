"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import type {
  FlowQuestion,
  IntakeAnswers,
  QuestionnaireFlow,
} from "@/lib/integrate/provider/student/chat";
import {
  AGE_MAX,
  AGE_MIN,
  CHILD_MAX_AGE,
  heightRangeForAge,
  isPregnancyApplicable,
  isSnapshotMetricsValid,
  METRIC_MAX_DIGITS,
  parseIntakeAge,
  sanitizeIntakeAnswers,
  validateSnapshotMetrics,
  weightRangeForAge,
} from "@/lib/integrate/provider/student/chat/intakeDependencies";
import { cn } from "@/lib/utils";

export const INTAKE_STAGES = [
  "Provider & Consent",
  "Patient Snapshot",
  "Safety Gate",
  "Goal Selection",
  "Clinical Deep Dive",
  "History & Labs",
  "Preferences",
  "Recommendation",
] as const;

const SAFETY_FLAG_IDS = new Set(["cancer", "mtc_men2", "peptide_allergy"]);

type IntakeWizardProps = {
  flow: QuestionnaireFlow;
  step: number;
  answers: IntakeAnswers;
  onStepChange: (step: number) => void;
  onAnswersChange: (answers: IntakeAnswers) => void;
  onComplete: () => void;
  bare?: boolean;
};

type IntakeOption = { value: string; label: string };

function normalizeOptions(options: FlowQuestion["options"]): IntakeOption[] {
  return (options ?? []).map((option) =>
    typeof option === "object"
      ? { value: option.value, label: option.label }
      : { value: option, label: option },
  );
}

function goalTitle(option: IntakeOption) {
  return option.label.replace(/^[A-H]\.\s*/, "");
}

function OptionCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "quiz-option-check flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
        checked
          ? "border-[color:var(--dash-navy)] bg-[color:var(--dash-navy)] text-white"
          : "border-[color:var(--dash-dim)] bg-transparent text-transparent",
      )}
      aria-hidden
    >
      <SidebarSvgIcon name="check" size={11} strokeWidth={2.8} />
    </span>
  );
}

const choiceCardClass = (checked: boolean) =>
  cn(
    "quiz-option-card adviser-option-card adviser-choice-card text-brand-body flex min-h-12 min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition active:scale-[0.99]",
    checked
      ? "is-selected"
      : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] hols-option-hover",
  );

/** Tap-to-select cards — primary interaction for short option lists. */
function IntakeChoiceGroup({
  label,
  required,
  value,
  onChange,
  options,
  hint,
  layout = "auto",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: IntakeOption[];
  hint?: string;
  layout?: "auto" | "stack" | "grid";
}) {
  const columns =
    layout === "stack"
      ? "grid-cols-1"
      : layout === "grid"
        ? "grid-cols-1 sm:grid-cols-2"
        : options.length <= 3
          ? "grid-cols-1 md:grid-cols-3"
          : options.length <= 4
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1";

  return (
    <fieldset className="adviser-intake-field min-w-0 space-y-2.5">
      <legend className={authLabelClass}>
        {label}
        {required ? " *" : ""}
      </legend>
      {hint ? (
        <p className="text-brand-caption -mt-1 text-[color:var(--dash-faint)]">{hint}</p>
      ) : null}
      <div className={cn("grid min-w-0 gap-2", columns)}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              aria-pressed={checked}
              onClick={() => onChange(option.value)}
              className={choiceCardClass(checked)}
            >
              <OptionCheck checked={checked} />
              <span
                className={cn(
                  "min-w-0 flex-1 break-words leading-snug",
                  checked && "font-semibold text-[color:var(--dash-text)]",
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <span>{children}</span>
      {required ? <span className="whitespace-nowrap"> *</span> : null}
    </>
  );
  const className = cn(authLabelClass, "inline-flex min-w-0 flex-wrap items-baseline");
  if (htmlFor) {
    return (
      <label htmlFor={htmlFor} className={className}>
        {content}
      </label>
    );
  }
  return <span className={className}>{content}</span>;
}

function clipIntegerInput(raw: string, maxDigits: number, maxValue?: number) {
  let next = raw.replace(/\D/g, "").slice(0, maxDigits);
  if (maxValue != null && next !== "" && Number(next) > maxValue) {
    next = String(maxValue);
  }
  return next;
}

function IntakeSelect({
  id,
  label,
  required,
  value = "",
  onChange,
  options,
  placeholder = "Select an option",
}: {
  id: string;
  label: string;
  required?: boolean;
  value?: string;
  onChange: (value: string) => void;
  options: IntakeOption[];
  placeholder?: string;
}) {
  const hasEmptyOption = options.some((option) => option.value === "");
  const selectOptions = hasEmptyOption
    ? options
    : [{ value: "", label: placeholder }, ...options];

  return (
    <div className="adviser-intake-field grid min-w-0 gap-2">
      <label htmlFor={id} className="dashboard-field-label">
        {label}
        {required ? <span className="whitespace-nowrap"> *</span> : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="dashboard-field dashboard-field-select"
      >
        {selectOptions.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function IntakeNumberField({
  label,
  required,
  value,
  onChange,
  maxDigits = METRIC_MAX_DIGITS,
  maxValue,
  hint,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  maxDigits?: number;
  maxValue?: number;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="adviser-intake-field grid min-w-0 self-start gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(clipIntegerInput(event.target.value, maxDigits, maxValue))}
        className={cn(
          authFieldClass,
          "adviser-field adviser-number-field min-h-11 px-4 sm:min-h-12",
          error && "border-[color:var(--dash-navy)]",
        )}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <p className="text-brand-caption text-[color:var(--dash-navy)]">{error}</p>
      ) : hint ? (
        <p className="text-brand-caption text-[color:var(--dash-faint)]">{hint}</p>
      ) : null}
    </label>
  );
}

function toggleMultiselect(
  selected: string[],
  optionValue: string,
): string[] {
  const checked = selected.includes(optionValue);
  if (optionValue === "None") {
    return checked ? [] : ["None"];
  }
  const withoutNone = selected.filter((item) => item !== "None");
  if (checked) {
    return withoutNone.filter((item) => item !== optionValue);
  }
  return [...withoutNone, optionValue];
}

export function IntakeWizard({
  flow,
  step,
  answers,
  onStepChange,
  onAnswersChange,
  onComplete,
  bare = false,
}: IntakeWizardProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const branchQuestions = useMemo(() => {
    const goal = String(answers.primary_goal ?? "");
    if (!goal) return [] as FlowQuestion[];
    const branchStage = flow.stages.find((stage) => stage.id === "branch");
    return branchStage?.branches?.[goal] ?? [];
  }, [answers.primary_goal, flow.stages]);

  const updateAnswer = (id: string, value: unknown) => {
    setValidationError(null);
    const draft: IntakeAnswers = { ...answers, [id]: value };
    if (id === "primary_goal" && value && draft.secondary_goal === value) {
      draft.secondary_goal = "";
    }
    onAnswersChange(sanitizeIntakeAnswers(draft, answers));
  };

  // Keep saved / restored answers consistent (e.g. Male + pregnancy Yes).
  useEffect(() => {
    const sanitized = sanitizeIntakeAnswers(answers);
    const changed = ["pregnancy", "allergy_detail", "activity"].some(
      (key) => String(sanitized[key] ?? "") !== String(answers[key] ?? ""),
    );
    if (changed) onAnswersChange(sanitized);
    // Intentionally depend on the fields that drive auto-fill, not onAnswersChange identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.sex, answers.age, answers.pregnancy, answers.peptide_allergy, answers.activity, answers.allergy_detail]);

  const pregnancyApplies = isPregnancyApplicable(answers.sex, answers.age);
  const ageYears = parseIntakeAge(answers.age);
  const metricErrors = validateSnapshotMetrics(answers);
  const heightRange = heightRangeForAge(ageYears);
  const weightRange = weightRangeForAge(ageYears);

  const metricFieldError = (key: keyof typeof metricErrors) => {
    const filled = answers[key] !== "" && answers[key] != null;
    if (filled && metricErrors[key]) return metricErrors[key];
    if (validationError && step === 1 && metricErrors[key]) return metricErrors[key];
    return undefined;
  };

  const validateStep = () => {
    if (step === 0) return answers.consent === true;
    if (step === 1) {
      const sanitized = sanitizeIntakeAnswers(answers);
      const filled = ["age", "sex", "pregnancy", "height_cm", "weight_kg", "activity"].every(
        (key) => sanitized[key] !== "" && sanitized[key] != null,
      );
      return filled && isSnapshotMetricsValid(sanitized);
    }
    if (step === 2) {
      const required = ["cancer", "mtc_men2", "peptide_allergy", "medications"].every(
        (key) => answers[key],
      );
      const conditions = Array.isArray(answers.conditions) && answers.conditions.length > 0;
      return required && conditions;
    }
    if (step === 3) return Boolean(answers.primary_goal);
    if (step === 6) {
      return ["injection_tolerance", "complexity", "timeline"].every((key) => answers[key]);
    }
    return true;
  };

  const isStepValid = validateStep();

  const stepProgress = useMemo(() => {
    if (step === 0) {
      return { done: answers.consent === true ? 1 : 0, total: 1, label: "Confirm consent" };
    }
    if (step === 1) {
      const keys = ["age", "sex", "pregnancy", "height_cm", "weight_kg", "activity"];
      const sanitized = sanitizeIntakeAnswers(answers);
      const done = keys.filter((key) => sanitized[key] !== "" && sanitized[key] != null).length;
      return { done, total: keys.length, label: "Snapshot fields" };
    }
    if (step === 2) {
      const keys = ["cancer", "mtc_men2", "peptide_allergy", "conditions", "medications"];
      const done = keys.filter((key) => {
        if (key === "conditions") {
          return Array.isArray(answers.conditions) && answers.conditions.length > 0;
        }
        return Boolean(answers[key]);
      }).length;
      return { done, total: keys.length, label: "Safety answers" };
    }
    if (step === 3) {
      return {
        done: answers.primary_goal ? 1 : 0,
        total: 1,
        label: "Primary goal",
      };
    }
    if (step === 6) {
      const keys = ["injection_tolerance", "complexity", "timeline"];
      const done = keys.filter((key) => Boolean(answers[key])).length;
      return { done, total: keys.length, label: "Preferences" };
    }
    return null;
  }, [answers, step]);

  const validationMessageForStep = () => {
    if (step === 0) return "Please confirm consent before continuing.";
    if (step === 1) return "Please enter a valid age, height, and weight, and complete the other snapshot fields.";
    if (step === 2) return "Please complete the safety questions, conditions, and medications before continuing.";
    if (step === 3) return "Please choose a primary goal before continuing.";
    if (step === 6) return "Please complete all preference fields before continuing.";
    return "Please complete all required fields before continuing.";
  };

  const handleNext = () => {
    if (!validateStep()) {
      setValidationError(validationMessageForStep());
      return;
    }
    setValidationError(null);
    if (step === 6) {
      onComplete();
      return;
    }
    onStepChange(step + 1);
  };

  const handleBack = () => {
    setValidationError(null);
    if (step > 0) onStepChange(step - 1);
  };

  const handleConsentContinue = () => {
    updateAnswer("consent", true);
    setValidationError(null);
    onStepChange(1);
  };

  useEffect(() => {
    setValidationError(null);
  }, [step]);

  const renderQuestion = (question: FlowQuestion) => {
    if (question.id === "pregnancy" && !pregnancyApplies) {
      return null;
    }

    if (question.show_if) {
      const visible = Object.entries(question.show_if).every(
        ([key, expected]) => answers[key] === expected,
      );
      if (!visible) return null;
    }

    if (question.id === "secondary_goal" && !answers.primary_goal) {
      return null;
    }

    const value = answers[question.id];
    const required = question.required ? " *" : "";
    let options = normalizeOptions(question.options);

    if (question.id === "activity" && ageYears != null && ageYears < CHILD_MAX_AGE) {
      options = options.filter((option) => option.value !== "Athlete");
    }

    if (question.type === "select") {
      const isGoal = question.id === "primary_goal" || question.id === "secondary_goal";
      const selectOptions = isGoal
        ? options
            .filter((option) => !option.value || option.value !== String(answers.primary_goal ?? "") || question.id === "primary_goal")
            .map((option) =>
              option.value ? { value: option.value, label: goalTitle(option) } : { value: "", label: "None" },
            )
        : options;

      return (
        <IntakeSelect
          key={question.id}
          id={`intake-${question.id}`}
          label={question.id === "secondary_goal" ? "Secondary goal" : question.text}
          required={Boolean(question.required)}
          value={String(value ?? "")}
          onChange={(next) => updateAnswer(question.id, next)}
          options={selectOptions}
          placeholder={
            question.id === "sex"
              ? "Select sex"
              : question.id === "activity"
                ? "Select activity level"
                : question.id === "primary_goal"
                  ? "Select a primary goal"
                  : question.id === "secondary_goal"
                    ? "Optional — none selected"
                    : "Select an option"
          }
        />
      );
    }

    if (question.type === "multiselect") {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const visibleOptions = options;

      return (
        <fieldset key={question.id} className="adviser-intake-field min-w-0 space-y-2.5">
          <legend className={authLabelClass}>
            <FieldLabel required={Boolean(question.required)}>{question.text}</FieldLabel>
          </legend>
          <p className="text-brand-caption -mt-1 text-[color:var(--dash-faint)]">
            Tap all that apply. Choosing “None” clears other selections.
          </p>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            {visibleOptions.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => updateAnswer(question.id, toggleMultiselect(selected, option.value))}
                  className={cn(choiceCardClass(checked), "gap-2.5 px-3 py-2.5")}
                >
                  <OptionCheck checked={checked} />
                  <span className="min-w-0 break-words leading-snug">{option.label}</span>
                </button>
              );
            })}
          </div>
          {visibleOptions.length === 0 ? (
            <p className="text-brand-caption text-[color:var(--dash-faint)]">No matching options</p>
          ) : null}
        </fieldset>
      );
    }

    if (question.type === "textarea") {
      return (
        <label key={question.id} className="adviser-intake-field grid min-w-0 gap-2">
          <span className={authLabelClass}>
            {question.text}
            {required}
          </span>
          {question.id === "medications" ? (
            <p className="text-brand-caption -mt-0.5 text-[color:var(--dash-faint)]">
              Write None if the patient is not taking anything.
            </p>
          ) : null}
          <textarea
            value={String(value ?? "")}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            rows={3}
            placeholder={
              question.id === "medications"
                ? "e.g. metformin, vitamin D — or None"
                : "Type a short note…"
            }
            className={cn(authFieldClass, "adviser-field min-h-[5.5rem] resize-y px-4")}
          />
        </label>
      );
    }

    if (question.type === "number") {
      const isAge = question.id === "age";
      const isHeight = question.id === "height_cm";
      const isWeight = question.id === "weight_kg";
      return (
        <IntakeNumberField
          key={question.id}
          label={question.text}
          required={Boolean(question.required)}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(next) => updateAnswer(question.id, next)}
          maxDigits={isAge || isHeight || isWeight ? METRIC_MAX_DIGITS : 4}
          maxValue={
            isAge
              ? AGE_MAX
              : isHeight
                ? heightRange.max
                : isWeight
                  ? weightRange.max
                  : question.max
          }
          hint={
            isAge
              ? `${AGE_MIN}–${AGE_MAX} years`
              : isHeight
                ? `Typical for this age: ${heightRange.min}–${heightRange.max} cm`
                : isWeight
                  ? `Typical for this age: ${weightRange.min}–${weightRange.max} kg`
                  : undefined
          }
          error={
            isAge
              ? metricFieldError("age")
              : isHeight
                ? metricFieldError("height_cm")
                : isWeight
                  ? metricFieldError("weight_kg")
                  : undefined
          }
        />
      );
    }

    return (
      <label key={question.id} className="adviser-intake-field grid min-w-0 self-start gap-2">
        <span className={authLabelClass}>
          {question.text}
          {required}
        </span>
        <input
          type="text"
          value={String(value ?? "")}
          placeholder={
            question.id === "allergy_detail"
              ? "e.g. BPC-157, bacteriostatic water"
              : (question.placeholder ?? "Type your answer…")
          }
          onChange={(event) => updateAnswer(question.id, event.target.value)}
          className={cn(
            authFieldClass,
            "adviser-field min-h-11 px-4 sm:min-h-12",
            question.id === "allergy_detail" && "sm:max-w-md",
          )}
        />
      </label>
    );
  };

  const snapshotStage = flow.stages.find((stage) => stage.id === "snapshot");
  const safetyStage = flow.stages.find((stage) => stage.id === "safety");
  const goalStage = flow.stages.find((stage) => stage.id === "goal");
  const historyStage = flow.stages.find((stage) => stage.id === "history");
  const preferencesStage = flow.stages.find((stage) => stage.id === "preferences");
  const branchLabel = flow.goal_branches[String(answers.primary_goal ?? "")]?.label;
  const snapshotQuestions = snapshotStage?.questions ?? [];
  const snapshotNumberQuestions = snapshotQuestions.filter((q) => q.type === "number");
  const snapshotOtherQuestions = snapshotQuestions.filter((q) => q.type !== "number");

  const nav =
    step > 0 ? (
      <div
        className={cn(
          "adviser-intake-nav flex flex-col gap-2",
          bare
            ? "shrink-0 border-t border-[color:var(--dash-surface-border)] pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5"
            : "mt-5 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2.5",
        )}
      >
        <button
          type="button"
          onClick={handleBack}
          className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] sm:w-auto"
        >
          <SidebarSvgIcon name="previous" size={14} strokeWidth={2.2} />
          Back
        </button>
        <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:items-end">
          {!isStepValid ? (
            <p className="text-brand-caption text-pretty text-center text-[color:var(--dash-faint)] sm:text-right">
              {validationMessageForStep().replace("Please ", "").replace(/\.$/, "")}
            </p>
          ) : (
            <p className="text-brand-caption hidden text-center text-[color:var(--dash-muted)] sm:block sm:text-right">
              Looking good — continue when ready
            </p>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!isStepValid}
            className="dashboard-navy-btn font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            {step === 6 ? (
              <>
                <span className="sm:hidden">Generate</span>
                <span className="hidden sm:inline">Generate recommendation</span>
              </>
            ) : (
              "Continue"
            )}
            {step < 6 ? <SidebarSvgIcon name="next" size={14} strokeWidth={2.2} /> : null}
          </button>
        </div>
      </div>
    ) : null;

  const body = (
    <>
      <div key={step} className={cn("adviser-intake-step space-y-4", bare && "adviser-intake-step--bare")}>
        {stepProgress ? (
          <div className="adviser-intake-step-meta flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3 py-2.5">
            <p className="text-brand-caption text-[color:var(--dash-muted)]">
              {stepProgress.label}
            </p>
            <p className="font-sans text-sm font-semibold tabular-nums text-[color:var(--dash-text)]">
              {stepProgress.done}/{stepProgress.total}
              {isStepValid ? (
              <span className="ml-2 inline-flex items-center gap-1 text-[color:var(--dash-navy)]">
                  <SidebarSvgIcon name="check" size={12} strokeWidth={2.6} />
                  Ready
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        {step === 0 ? (
          <div className="space-y-4">
            <StageBlock
              badge="Stage 1 · Start here"
              title="Consent & framing"
              description="Quick confirmation, then we’ll walk through the patient details one step at a time."
            >
              <div className="text-brand-body rounded-lg border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] p-4 leading-relaxed text-[color:var(--dash-muted)]">
                {flow.consent.text}
              </div>
              <button
                type="button"
                onClick={handleConsentContinue}
                className="dashboard-navy-btn font-sans flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white"
              >
                <SidebarSvgIcon name="check" size={16} strokeWidth={2.4} />
                {flow.consent.confirm_label}
              </button>
            </StageBlock>
          </div>
        ) : null}

        {step === 1 && snapshotStage ? (
          <StageBlock
            badge="Stage 2"
            title={snapshotStage.title}
            description="Enter age, height, and weight. Use the menus for sex and activity."
          >
            <div className="space-y-5">
              {snapshotNumberQuestions.length > 0 ? (
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
                  {snapshotNumberQuestions.map((question) => renderQuestion(question))}
                </div>
              ) : null}
              {snapshotOtherQuestions.length > 0 ? (
                <div className="grid grid-cols-1 items-start gap-5">
                  {snapshotOtherQuestions.map((question) => renderQuestion(question))}
                </div>
              ) : null}
            </div>
          </StageBlock>
        ) : null}

        {step === 2 && safetyStage ? (
          <StageBlock
            badge="Stage 3 · Safety gate"
            title="Safety gate"
            description="Flag anything that would rule out peptides, then note conditions and medications."
          >
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Red flags
                </p>
                {(safetyStage.questions ?? [])
                  .filter((question) => SAFETY_FLAG_IDS.has(question.id) || question.id === "allergy_detail")
                  .map((question) => renderQuestion(question))}
              </div>
              <div className="space-y-4">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  History
                </p>
                {(safetyStage.questions ?? [])
                  .filter((question) => question.id === "conditions" || question.id === "medications")
                  .map((question) => renderQuestion(question))}
              </div>
            </div>
          </StageBlock>
        ) : null}

        {step === 3 && goalStage ? (
          <StageBlock
            badge="Stage 4"
            title="Goal selection"
            description="Pick the main goal. A second goal is optional and can refine a stack."
          >
            <div className="grid items-start gap-5">
              {goalStage.questions?.map((question) => renderQuestion(question))}
              {answers.primary_goal && branchLabel ? (
                <p className="text-brand-caption text-[color:var(--dash-muted)]">
                  Next: a short deep dive for {branchLabel.toLowerCase()}.
                </p>
              ) : null}
            </div>
          </StageBlock>
        ) : null}

        {step === 4 ? (
          <StageBlock
            badge={`Stage 5 · ${String(answers.primary_goal ?? "")}`}
            title="Clinical deep dive"
            description={branchLabel ?? "Goal-specific questions"}
          >
            <div className="grid items-start gap-5">
              {branchQuestions.map((question) => renderQuestion(question))}
            </div>
          </StageBlock>
        ) : null}

        {step === 5 && historyStage ? (
          <StageBlock
            badge="Stage 6"
            title={historyStage.title}
            description="Optional notes — skip anything you don’t have on file."
          >
            <div className="grid items-start gap-5">
              {historyStage.questions?.map((question) => renderQuestion(question))}
            </div>
          </StageBlock>
        ) : null}

        {step === 6 && preferencesStage ? (
          <StageBlock
            badge="Stage 7 · Almost done"
            title={preferencesStage.title}
            description="Three quick preferences, then we generate the recommendation."
          >
            <div className="grid items-start gap-5">
              {preferencesStage.questions?.map((question) => renderQuestion(question))}
            </div>
          </StageBlock>
        ) : null}
      </div>

      {validationError ? (
        <div className="mt-5 sm:mt-6">
          <AuthAlert variant="error">{validationError}</AuthAlert>
        </div>
      ) : null}
    </>
  );

  if (bare) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
          {body}
        </div>
        {nav}
      </div>
    );
  }

  return (
    <div className="dashboard-surface rounded-2xl p-5 md:p-6">
      {body}
      {nav}
    </div>
  );
}

function StageBlock({
  badge,
  title,
  description,
  children,
}: {
  badge: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="adviser-intake-step-header">
        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
          {badge}
        </p>
        <h2 className="font-sans mt-1 text-pretty text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function IntakeStageList({
  step,
  inChat,
  orientation = "vertical",
  onStepSelect,
}: {
  step: number;
  inChat: boolean;
  orientation?: "vertical" | "horizontal" | "wrap";
  /** Jump back to a completed (or current) stage. */
  onStepSelect?: (index: number) => void;
}) {
  const renderItem = (label: string, index: number) => {
    const active = inChat ? index === 7 : index === step;
    const done = inChat ? index < 7 : index < step;
    const canJump = Boolean(onStepSelect) && !inChat && (done || active) && index < 7;

    const content = (
      <>
        <span
          className={cn(
            orientation === "vertical"
              ? "text-brand-caption flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-semibold"
              : orientation === "wrap"
                ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none"
                : "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none",
            active && "bg-[color:var(--dash-navy)] text-white",
            !active &&
              done &&
              (orientation === "vertical"
                ? "border border-[color:var(--dash-surface-border)] text-[color:var(--dash-text)]"
                : "bg-[color:var(--dash-soft)] text-[color:var(--dash-text)]"),
            !active &&
              !done &&
              (orientation === "vertical"
                ? "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]"
                : "bg-[color:var(--dash-surface)] text-[color:var(--dash-faint)]"),
          )}
        >
          {done && !active ? (
            <SidebarSvgIcon name="check" size={orientation === "vertical" ? 12 : 10} strokeWidth={2.7} />
          ) : (
            index + 1
          )}
        </span>
        {orientation === "wrap" ? null : (
          <span
            className={cn(
              "min-w-0 leading-tight",
              orientation === "horizontal" ? "max-w-[7.5rem] truncate" : "truncate",
            )}
          >
            {label}
          </span>
        )}
      </>
    );

    const className = cn(
      "font-sans inline-flex items-center gap-1.5 rounded-lg text-left transition",
      orientation === "vertical" && "flex w-full gap-2 px-2 py-1.5 text-sm",
      orientation === "horizontal" && "h-8 min-h-9 shrink-0 rounded-full px-2.5 py-1.5 text-xs",
      orientation === "wrap" && "min-h-11 w-full justify-center px-1 text-xs",
      active && "bg-[color:var(--dash-soft)] font-semibold text-[color:var(--dash-text)] ring-1 ring-[color:var(--dash-surface-border)]",
      !active && done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)]",
      !active && !done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]",
      canJump && "cursor-pointer hover:bg-[color:var(--dash-soft)]",
      !canJump && orientation === "vertical" && !active && !done && "opacity-70",
    );

    if (canJump) {
      return (
        <li key={label} title={label}>
          <button type="button" onClick={() => onStepSelect?.(index)} className={className}>
            {content}
          </button>
        </li>
      );
    }

    return (
      <li key={label} title={label} className={className}>
        {content}
      </li>
    );
  };

  if (orientation === "horizontal") {
    return (
      <ol className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {INTAKE_STAGES.map((label, index) => renderItem(label, index))}
      </ol>
    );
  }

  if (orientation === "wrap") {
    return (
      <ol className="grid grid-cols-4 gap-1.5">
        {INTAKE_STAGES.map((label, index) => renderItem(label, index))}
      </ol>
    );
  }

  return <ol className="space-y-1">{INTAKE_STAGES.map((label, index) => renderItem(label, index))}</ol>;
}
