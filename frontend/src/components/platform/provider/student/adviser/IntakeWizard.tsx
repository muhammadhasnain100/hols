"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import type {
  FlowQuestion,
  IntakeAnswers,
  QuestionnaireFlow,
} from "@/lib/integrate/provider/student/chat";
import {
  CHILD_MAX_AGE,
  isPregnancyApplicable,
  normalizeSex,
  parseIntakeAge,
  PREGNANCY_MAX_AGE,
  PREGNANCY_MIN_AGE,
  sanitizeIntakeAnswers,
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

const CARD_SELECT_LIMIT = 10;

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

function OptionCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "quiz-option-check flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
        checked
          ? "border-[#DDE466] bg-[#DDE466] text-[#152744]"
          : "border-[color:var(--dash-dim)] bg-transparent text-transparent",
      )}
      aria-hidden
    >
      <SidebarSvgIcon name="check" size={11} strokeWidth={2.8} />
    </span>
  );
}

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
              className={cn(
                "quiz-option-card adviser-option-card adviser-choice-card text-brand-body flex min-h-12 min-w-0 items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition active:scale-[0.99]",
                checked
                  ? "is-selected border-[#DDE466] bg-[#DDE466]/18 text-[color:var(--dash-text)] shadow-[inset_0_0_0_1px_rgba(221,228,102,0.55)]"
                  : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] hover:border-[#DDE466]/55",
              )}
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

function IntakeSelect({
  id,
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Select an option",
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: IntakeOption[];
  placeholder?: string;
}) {
  const listId = useId();
  const filterId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.value === value);
  const showFilter = options.length > 4;

  const filteredOptions = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query),
    );
  }, [filter, options]);

  const selectOption = (next: string) => {
    onChange(next);
    setOpen(false);
    setFilter("");
    setActiveIndex(0);
  };

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setFilter("");
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setFilter("");
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = filteredOptions.findIndex((option) => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    if (showFilter) {
      requestAnimationFrame(() => filterRef.current?.focus());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveIndex(0);
  }, [filter]);

  const handleFilterKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        filteredOptions.length === 0 ? 0 : Math.min(current + 1, filteredOptions.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[activeIndex] ?? filteredOptions[0];
      if (option) selectOption(option.value);
    }
  };

  return (
    <div className="adviser-intake-field grid min-w-0 gap-2">
      <label htmlFor={id} className={authLabelClass}>
        {label}
        {required ? " *" : ""}
      </label>
      <div ref={rootRef} className="adviser-select relative min-w-0">
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() =>
            setOpen((current) => {
              const next = !current;
              if (!next) {
                setFilter("");
                setOpenUpward(false);
                return next;
              }
              const rect = rootRef.current?.getBoundingClientRect();
              const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
              const spaceAbove = rect?.top ?? 0;
              setOpenUpward(spaceBelow < 220 && spaceAbove > spaceBelow);
              return next;
            })
          }
          className={cn(
            authFieldClass,
            "adviser-field flex h-12 min-h-12 w-full items-center gap-2 overflow-visible px-4 py-0 pr-11 text-left leading-none",
            open && "border-[#DDE466]",
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              selected ? "text-[color:var(--dash-text)]" : "text-[color:var(--dash-faint)]",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          {selected ? (
            <span
              className="adviser-select-trigger-check flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DDE466] text-[#152744]"
              aria-hidden
            >
              <SidebarSvgIcon name="check" size={11} strokeWidth={2.8} />
            </span>
          ) : null}
        </button>
        <span
          className="quiz-select-chevron pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center"
          aria-hidden
        >
          <SidebarSvgIcon
            name={open ? "chevron-up" : "chevron-down"}
            size={15}
            strokeWidth={2.35}
          />
        </span>

        {open ? (
          <div
            className={cn(
              "quiz-select-menu absolute left-0 right-0 z-40 overflow-hidden rounded-lg",
              openUpward
                ? "bottom-[calc(100%+0.35rem)] top-auto"
                : "top-[calc(100%+0.35rem)]",
            )}
          >
            {showFilter ? (
              <div className="adviser-select-filter border-b border-[color:var(--dash-surface-border)] p-1.5">
                <label htmlFor={filterId} className="sr-only">
                  Filter options
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-[color:var(--dash-faint)]">
                    <SidebarSvgIcon name="search" size={14} strokeWidth={2.2} />
                  </span>
                  <input
                    ref={filterRef}
                    id={filterId}
                    type="text"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    onKeyDown={handleFilterKeyDown}
                    placeholder="Filter options…"
                    className={cn(
                      authFieldClass,
                      "adviser-field h-10 min-h-10 w-full rounded-md py-0 pl-9 pr-3 text-sm leading-none",
                    )}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : null}
            <ul
              id={listId}
              role="listbox"
              className="max-h-[min(13rem,40vh)] overflow-y-auto p-1.5 sm:max-h-52"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-[color:var(--dash-faint)]">No matching options</li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={`${option.value}-${option.label}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => selectOption(option.value)}
                        className={cn(
                          "quiz-select-option adviser-select-option font-sans flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm leading-normal transition",
                          isSelected && "is-selected",
                          isActive && "is-active",
                        )}
                      >
                        <span className="min-w-0 break-words">{option.label}</span>
                        <OptionCheck checked={isSelected} />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function IntakeNumberField({
  label,
  required,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const numeric = value === "" ? NaN : Number(value);

  const bump = (direction: 1 | -1) => {
    const base = Number.isFinite(numeric) ? numeric : min ?? 0;
    let next = base + direction * step;
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);
    onChange(String(next));
  };

  return (
    <div className="adviser-intake-field grid min-w-0 self-start gap-2">
      <span className={authLabelClass}>
        {label}
        {required ? " *" : ""}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => bump(-1)}
          className="dashboard-pill-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[color:var(--dash-text)] transition hover:bg-[#DDE466]/25"
        >
          <SidebarSvgIcon name="minus" size={16} strokeWidth={2.2} />
        </button>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => {
            const next = event.target.value.replace(/[^\d.]/g, "");
            onChange(next);
          }}
          className={cn(
            authFieldClass,
            "adviser-field adviser-number-field h-12 min-h-12 flex-1 px-4 text-center text-base font-semibold tabular-nums",
          )}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => bump(1)}
          className="dashboard-pill-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[color:var(--dash-text)] transition hover:bg-[#DDE466]/25"
        >
          <SidebarSvgIcon name="plus" size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
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
  const [conditionFilter, setConditionFilter] = useState("");

  const branchQuestions = useMemo(() => {
    const goal = String(answers.primary_goal ?? "");
    if (!goal) return [] as FlowQuestion[];
    const branchStage = flow.stages.find((stage) => stage.id === "branch");
    return branchStage?.branches?.[goal] ?? [];
  }, [answers.primary_goal, flow.stages]);

  const updateAnswer = (id: string, value: unknown) => {
    setValidationError(null);
    const draft = { ...answers, [id]: value };
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

  const pregnancyAutoReason = (() => {
    if (normalizeSex(answers.sex) === "male") return " for male patients.";
    if (ageYears != null && ageYears < PREGNANCY_MIN_AGE) return " for young children.";
    if (ageYears != null && ageYears >= PREGNANCY_MAX_AGE) return " for this age group.";
    return ".";
  })();

  const validateStep = () => {
    if (step === 0) return answers.consent === true;
    if (step === 1) {
      const sanitized = sanitizeIntakeAnswers(answers);
      return ["age", "sex", "pregnancy", "height_cm", "weight_kg", "activity"].every(
        (key) => sanitized[key] !== "" && sanitized[key] != null,
      );
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
    if (step === 1) return "Please fill in every patient snapshot field before continuing.";
    if (step === 2) return "Please complete all safety gate answers before continuing.";
    if (step === 3) return "Please select a primary goal before continuing.";
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
    setConditionFilter("");
  }, [step]);

  const renderQuestion = (question: FlowQuestion) => {
    if (question.id === "pregnancy" && !pregnancyApplies) {
      return (
        <div
          key={question.id}
          className="adviser-intake-field rounded-lg border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3.5 py-3"
        >
          <p className={authLabelClass}>{question.text}</p>
          <p className="text-brand-body mt-1.5 text-[color:var(--dash-muted)]">
            Automatically set to{" "}
            <span className="font-semibold text-[color:var(--dash-text)]">N/A</span>
            {pregnancyAutoReason}
          </p>
        </div>
      );
    }

    if (question.show_if) {
      const visible = Object.entries(question.show_if).every(
        ([key, expected]) => answers[key] === expected,
      );
      if (!visible) return null;
    }

    const value = answers[question.id];
    const required = question.required ? " *" : "";
    let options = normalizeOptions(question.options);

    if (question.id === "activity" && ageYears != null && ageYears < CHILD_MAX_AGE) {
      options = options.filter((option) => option.value !== "Athlete");
    }

    if (question.type === "select") {
      const isGoal = question.id === "primary_goal" || question.id === "secondary_goal";
      if (options.length > 0 && options.length <= CARD_SELECT_LIMIT) {
        return (
          <IntakeChoiceGroup
            key={question.id}
            label={question.text}
            required={Boolean(question.required)}
            value={String(value ?? "")}
            onChange={(next) => updateAnswer(question.id, next)}
            options={options}
            layout={isGoal ? "stack" : "auto"}
            hint={
              isGoal && question.id === "primary_goal"
                ? "Tap a goal to select — this unlocks the clinical deep dive."
                : undefined
            }
          />
        );
      }

      return (
        <IntakeSelect
          key={question.id}
          id={`intake-${question.id}`}
          label={question.text}
          required={Boolean(question.required)}
          value={String(value ?? "")}
          onChange={(next) => updateAnswer(question.id, next)}
          options={options}
        />
      );
    }

    if (question.type === "multiselect") {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const query = conditionFilter.trim().toLowerCase();
      const visibleOptions =
        question.id === "conditions" && query
          ? options.filter((option) => option.label.toLowerCase().includes(query))
          : options;

      return (
        <fieldset key={question.id} className="adviser-intake-field min-w-0 space-y-2.5">
          <legend className={authLabelClass}>
            {question.text}
            {required}
          </legend>
          <p className="text-brand-caption -mt-1 text-[color:var(--dash-faint)]">
            Tap all that apply. Choosing “None” clears other selections.
          </p>
          {question.id === "conditions" ? (
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-[color:var(--dash-faint)]">
                <SidebarSvgIcon name="search" size={15} strokeWidth={2.2} />
              </span>
              <input
                type="text"
                value={conditionFilter}
                onChange={(event) => setConditionFilter(event.target.value)}
                placeholder="Filter conditions…"
                className={cn(
                  authFieldClass,
                  "adviser-field h-11 min-h-11 w-full rounded-lg py-0 pl-10 pr-3 text-sm leading-none",
                )}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          ) : null}
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            {visibleOptions.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => updateAnswer(question.id, toggleMultiselect(selected, option.value))}
                  className={cn(
                    "quiz-option-card adviser-option-card adviser-choice-card text-brand-body flex min-h-12 min-w-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition active:scale-[0.99]",
                    checked
                      ? "is-selected border-[#DDE466] bg-[#DDE466]/18 text-[color:var(--dash-text)]"
                      : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] hover:border-[#DDE466]/55",
                  )}
                >
                  <OptionCheck checked={checked} />
                  <span className="min-w-0 break-words leading-snug">{option.label}</span>
                </button>
              );
            })}
          </div>
          {visibleOptions.length === 0 ? (
            <p className="text-brand-caption text-[color:var(--dash-faint)]">No matching conditions</p>
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
          <textarea
            value={String(value ?? "")}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            rows={3}
            placeholder="Type a short note…"
            className={cn(authFieldClass, "adviser-field min-h-[5.5rem] resize-y px-4")}
          />
        </label>
      );
    }

    if (question.type === "number") {
      return (
        <IntakeNumberField
          key={question.id}
          label={question.text}
          required={Boolean(question.required)}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(next) => updateAnswer(question.id, next)}
          min={question.min}
          max={question.max}
          step={question.id === "age" ? 1 : question.id.includes("pain") ? 1 : 1}
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
          placeholder={question.placeholder ?? "Type your answer…"}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
          className={cn(authFieldClass, "adviser-field h-12 min-h-12 px-4")}
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

  return (
    <div className={cn(bare ? "space-y-0" : "dashboard-surface rounded-2xl p-5 md:p-6")}>
      <div key={step} className="adviser-intake-step space-y-4">
        {stepProgress ? (
          <div className="adviser-intake-step-meta flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3 py-2.5">
            <p className="text-brand-caption text-[color:var(--dash-muted)]">
              {stepProgress.label}
            </p>
            <p className="font-sans text-sm font-semibold tabular-nums text-[color:var(--dash-text)]">
              {stepProgress.done}/{stepProgress.total}
              {isStepValid ? (
                <span className="ml-2 inline-flex items-center gap-1 text-[#6f7a1c]">
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
                className="font-sans flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#DDE466] px-5 text-sm font-semibold text-[#152744] transition hover:brightness-105 active:scale-[0.99]"
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
            description="Tap choices and use + / − for numbers — takes under a minute."
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
            title={safetyStage.title}
            description={safetyStage.description ?? "Answer each safety question with a tap."}
          >
            <div className="grid items-start gap-5">
              {safetyStage.questions?.map((question) => renderQuestion(question))}
            </div>
          </StageBlock>
        ) : null}

        {step === 3 && goalStage ? (
          <StageBlock
            badge="Stage 4"
            title={goalStage.title}
            description="Choose the main therapeutic goal — optional secondary goal can refine stacks."
          >
            <div className="grid items-start gap-5">
              {goalStage.questions?.map((question) => renderQuestion(question))}
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

      {step > 0 ? (
        <div className="adviser-intake-nav mt-5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
          >
            <SidebarSvgIcon name="previous" size={14} strokeWidth={2.2} />
            Back
          </button>
          <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:items-end">
            {!isStepValid ? (
              <p className="text-brand-caption text-center text-[color:var(--dash-faint)] sm:text-right">
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
              className="font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-semibold text-[#152744] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
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
      ) : null}
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
      <div>
        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
          {badge}
        </p>
        <h2 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)] md:text-xl">
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
              : "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none",
            active && "bg-[#DDE466] text-[#152744]",
            !active &&
              done &&
              (orientation === "vertical"
                ? "border border-[#DDE466]/50 text-[color:var(--dash-accent)]"
                : "bg-[#DDE466]/40 text-[#152744]"),
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
        <span
          className={cn(
            "min-w-0 leading-tight",
            orientation === "wrap"
              ? "whitespace-nowrap"
              : orientation === "horizontal"
                ? "max-w-[7.5rem] truncate"
                : "truncate",
          )}
        >
          {label}
        </span>
      </>
    );

    const className = cn(
      "font-sans inline-flex items-center gap-1.5 rounded-lg text-left transition",
      orientation === "vertical" && "flex w-full gap-2 px-2 py-1.5 text-sm",
      orientation !== "vertical" && "min-h-9 shrink-0 px-2 py-1.5 text-xs",
      orientation === "horizontal" && "h-8 shrink-0 rounded-full px-2.5",
      orientation === "wrap" && "shrink-0",
      active && "bg-[#DDE466]/25 font-semibold text-[color:var(--dash-text)] ring-1 ring-[#DDE466]/55",
      !active && done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)]",
      !active && !done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]",
      canJump && "cursor-pointer hover:bg-[#DDE466]/18",
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

  if (orientation === "horizontal" || orientation === "wrap") {
    return (
      <ol
        className={cn(
          orientation === "wrap"
            ? "flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible md:pb-0"
            : "flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {INTAKE_STAGES.map((label, index) => renderItem(label, index))}
      </ol>
    );
  }

  return <ol className="space-y-1">{INTAKE_STAGES.map((label, index) => renderItem(label, index))}</ol>;
}
