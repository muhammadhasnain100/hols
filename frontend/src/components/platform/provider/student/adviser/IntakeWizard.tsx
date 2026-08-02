"use client";

import { useMemo } from "react";
import { Check, Icon } from "@/components/icons";
import type {
  FlowQuestion,
  IntakeAnswers,
  QuestionnaireFlow,
} from "@/lib/integrate/provider/student/chat";
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

type IntakeWizardProps = {
  flow: QuestionnaireFlow;
  step: number;
  answers: IntakeAnswers;
  onStepChange: (step: number) => void;
  onAnswersChange: (answers: IntakeAnswers) => void;
  onComplete: () => void;
  bare?: boolean;
};

export function IntakeWizard({
  flow,
  step,
  answers,
  onStepChange,
  onAnswersChange,
  onComplete,
  bare = false,
}: IntakeWizardProps) {
  const branchQuestions = useMemo(() => {
    const goal = String(answers.primary_goal ?? "");
    if (!goal) return [] as FlowQuestion[];
    const branchStage = flow.stages.find((stage) => stage.id === "branch");
    return branchStage?.branches?.[goal] ?? [];
  }, [answers.primary_goal, flow.stages]);

  const updateAnswer = (id: string, value: unknown) => {
    onAnswersChange({ ...answers, [id]: value });
  };

  const validateStep = () => {
    if (step === 0) return answers.consent === true;
    if (step === 1) {
      return ["age", "sex", "pregnancy", "height_cm", "weight_kg", "activity"].every(
        (key) => answers[key] !== "" && answers[key] != null,
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

  const handleNext = () => {
    if (!validateStep()) {
      window.alert("Please complete all required fields.");
      return;
    }
    if (step === 6) {
      onComplete();
      return;
    }
    onStepChange(step + 1);
  };

  const handleBack = () => {
    if (step > 0) onStepChange(step - 1);
  };

  const renderQuestion = (question: FlowQuestion) => {
    if (question.show_if) {
      const visible = Object.entries(question.show_if).every(
        ([key, value]) => answers[key] === value,
      );
      if (!visible) return null;
    }

    const value = answers[question.id];
    const required = question.required ? " *" : "";

    if (question.type === "select") {
      const selectedValue = String(value ?? "");
      const options = question.options ?? [];
      const compactRow = options.length > 0 && options.length <= 3;
      return (
        <fieldset key={question.id} className="min-w-0 self-start space-y-2">
          <legend className="dashboard-field-label">
            {question.text}
            {required}
          </legend>

          <div
            className={cn(
              "grid min-w-0 gap-2",
              compactRow && "grid-cols-1 sm:grid-cols-3",
              !compactRow && options.length > 3 && "sm:grid-cols-2",
            )}
            role="radiogroup"
            aria-label={question.text}
          >
            {options.map((option) => {
              const optionValue = typeof option === "object" ? option.value : option;
              const optionLabel = typeof option === "object" ? option.label : option;
              const checked = selectedValue === optionValue;
              return (
                <button
                  key={optionValue}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => updateAnswer(question.id, optionValue)}
                  className={cn(
                    "text-brand-body flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border px-3 text-left transition",
                    checked
                      ? "border-[#DDE466] bg-[#DDE466]/15 text-[color:var(--dash-text)]"
                      : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] hover:border-[color:var(--dash-dim)]",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate leading-snug">{optionLabel}</span>
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      checked
                        ? "border-[#DDE466] bg-[#DDE466]"
                        : "border-[color:var(--dash-dim)] bg-transparent",
                    )}
                    aria-hidden
                  >
                    {checked ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#152744]" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      );
    }

    if (question.type === "multiselect") {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset key={question.id} className="min-w-0 space-y-2">
          <legend className="dashboard-field-label">
            {question.text}
            {required}
          </legend>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            {(question.options ?? []).map((option) => {
              const optionValue = typeof option === "object" ? option.value : option;
              const optionLabel = typeof option === "object" ? option.label : option;
              const checked = selected.includes(optionValue);
              return (
                <label
                  key={optionValue}
                  className={cn(
                    "text-brand-body flex min-h-11 min-w-0 cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 transition sm:min-h-10",
                    checked
                      ? "border-[#DDE466] bg-[#DDE466]/15 text-[color:var(--dash-text)]"
                      : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    className="mt-0.5 shrink-0"
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selected, optionValue]
                        : selected.filter((item) => item !== optionValue);
                      updateAnswer(question.id, next);
                    }}
                  />
                  <span className="min-w-0 break-words leading-snug">{optionLabel}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    }

    if (question.type === "textarea") {
      return (
        <label key={question.id} className="grid min-w-0 gap-2">
          <span className="dashboard-field-label">
            {question.text}
            {required}
          </span>
          <textarea
            value={String(value ?? "")}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            rows={4}
            className="dashboard-field min-h-[6.5rem] min-w-0 resize-y"
          />
        </label>
      );
    }

    if (question.type === "number") {
      return (
        <label key={question.id} className="grid min-w-0 self-start gap-2">
          <span className="dashboard-field-label">
            {question.text}
            {required}
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={value === undefined || value === null ? "" : String(value)}
            min={question.min}
            max={question.max}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            className="dashboard-field adviser-number-field min-w-0"
          />
        </label>
      );
    }

    return (
      <label key={question.id} className="grid min-w-0 self-start gap-2">
        <span className="dashboard-field-label">
          {question.text}
          {required}
        </span>
        <input
          type="text"
          value={String(value ?? "")}
          placeholder={question.placeholder}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
          className="dashboard-field h-11 min-w-0"
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
    <div className={bare ? "space-y-0" : "dashboard-surface rounded-2xl p-5 md:p-6"}>
      {step === 0 ? (
        <div className="space-y-4">
          <div>
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Stage 0 · Provider verification
            </p>
            <h2 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)] md:text-xl">
              Consent & framing
            </h2>
            <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
              This session is conducted under registered practitioner Dr. Sarah Mitchell. Confirm before entering patient information.
            </p>
          </div>
          <div className="text-brand-body rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] p-4 leading-relaxed text-[color:var(--dash-muted)]">
            {flow.consent.text}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--dash-surface-border)] px-3 py-3">
            <input
              type="checkbox"
              checked={answers.consent === true}
              onChange={(event) => updateAnswer("consent", event.target.checked)}
              className="mt-1"
            />
            <span className="text-brand-body font-medium text-[color:var(--dash-text)]">
              {flow.consent.confirm_label}
            </span>
          </label>
        </div>
      ) : null}

      {step === 1 && snapshotStage ? (
        <StageBlock
          badge="Stage 1"
          title={snapshotStage.title}
          description="Baseline patient demographics and activity level."
        >
          <div className="space-y-4">
            {snapshotNumberQuestions.length > 0 ? (
              <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-3 sm:gap-4">
                {snapshotNumberQuestions.map((question) => renderQuestion(question))}
              </div>
            ) : null}
            {snapshotOtherQuestions.length > 0 ? (
              <div className="grid grid-cols-1 items-start gap-4">
                {snapshotOtherQuestions.map((question) => renderQuestion(question))}
              </div>
            ) : null}
          </div>
        </StageBlock>
      ) : null}

      {step === 2 && safetyStage ? (
        <StageBlock
          badge="Stage 2 · Safety gate"
          title={safetyStage.title}
          description={safetyStage.description}
        >
          <div className="grid items-start gap-4">
            {safetyStage.questions?.map((question) => renderQuestion(question))}
          </div>
        </StageBlock>
      ) : null}

      {step === 3 && goalStage ? (
        <StageBlock
          badge="Stage 3"
          title={goalStage.title}
          description="Select the primary therapeutic goal for this patient."
        >
          <div className="grid items-start gap-4">
            {goalStage.questions?.map((question) => renderQuestion(question))}
          </div>
        </StageBlock>
      ) : null}

      {step === 4 ? (
        <StageBlock
          badge={`Stage 4 · Branch ${String(answers.primary_goal ?? "")}`}
          title="Clinical deep dive"
          description={branchLabel ?? ""}
        >
          <div className="grid items-start gap-4">
            {branchQuestions.map((question) => renderQuestion(question))}
          </div>
        </StageBlock>
      ) : null}

      {step === 5 && historyStage ? (
        <StageBlock badge="Stage 5" title={historyStage.title} description="Prior peptide therapy and available laboratory data.">
          <div className="grid items-start gap-4">
            {historyStage.questions?.map((question) => renderQuestion(question))}
          </div>
        </StageBlock>
      ) : null}

      {step === 6 && preferencesStage ? (
        <StageBlock
          badge="Stage 6 · Final step"
          title={preferencesStage.title}
          description="Your recommendation will appear in the consultation chat immediately after submission."
        >
          <div className="grid items-start gap-4">
            {preferencesStage.questions?.map((question) => renderQuestion(question))}
          </div>
        </StageBlock>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-2.5">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:w-auto"
        >
          {step === 6 ? "Generate recommendation" : "Continue"}
        </button>
      </div>
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
}: {
  step: number;
  inChat: boolean;
  orientation?: "vertical" | "horizontal" | "wrap";
}) {
  if (orientation === "horizontal" || orientation === "wrap") {
    return (
      <ol
        className={cn(
          orientation === "wrap"
            ? "grid grid-cols-2 gap-1.5 sm:grid-cols-4"
            : "flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {INTAKE_STAGES.map((label, index) => {
          const active = inChat ? index === 7 : index === step;
          const done = inChat ? index < 7 : index < step;
          return (
            <li
              key={label}
              title={label}
              className={cn(
                "font-sans inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                orientation === "horizontal" && "h-8 shrink-0 rounded-full px-2.5",
                active && "bg-[#DDE466]/25 font-semibold text-[color:var(--dash-text)] ring-1 ring-[#DDE466]/55",
                !active && done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)]",
                !active && !done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none",
                  active && "bg-[#DDE466] text-[#152744]",
                  !active && done && "bg-[#DDE466]/40 text-[#152744]",
                  !active && !done && "bg-[color:var(--dash-surface)] text-[color:var(--dash-faint)]",
                )}
              >
                {done && !active ? <Icon icon={Check} size={10} strokeWidth={2.5} /> : index + 1}
              </span>
              <span className={cn("min-w-0 leading-tight", orientation === "wrap" ? "truncate" : "max-w-[7.5rem] truncate")}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="space-y-1">
      {INTAKE_STAGES.map((label, index) => {
        const active = inChat ? index === 7 : index === step;
        const done = inChat ? index < 7 : index < step;
        return (
          <li
            key={label}
            className={cn(
              "font-sans flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
              active && "bg-[#DDE466]/20 font-semibold text-[color:var(--dash-text)]",
              !active && done && "text-[color:var(--dash-muted)]",
              !active && !done && "text-[color:var(--dash-faint)]",
            )}
          >
            <span
              className={cn(
                "text-brand-caption flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-semibold",
                active && "bg-[#DDE466] text-[#152744]",
                !active && done && "border border-[#DDE466]/50 text-[color:var(--dash-accent)]",
                !active && !done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]",
              )}
            >
              {done && !active ? <Icon icon={Check} size={12} strokeWidth={2.5} /> : index + 1}
            </span>
            <span className="truncate">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
