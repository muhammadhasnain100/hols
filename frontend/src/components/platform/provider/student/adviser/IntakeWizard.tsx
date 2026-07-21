"use client";

import { useMemo } from "react";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
import {
  portalRowValueClass,
  portalSectionDescClass,
  portalSectionEyebrowClass,
  portalSectionTitleClass,
  portalSubnavItemClass,
} from "@/components/platform/provider/portal-styles";
import { Button } from "@/components/ui/Button";
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
};

export function IntakeWizard({
  flow,
  step,
  answers,
  onStepChange,
  onAnswersChange,
  onComplete,
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
      return (
        <label key={question.id} className="block space-y-2">
          <span className={authLabelClass}>
            {question.text}
            {required}
          </span>
          <select
            value={String(value ?? "")}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            className={cn(authFieldClass, "w-full px-4")}
          >
            <option value="">Select…</option>
            {(question.options ?? []).map((option) => {
              const optionValue = typeof option === "object" ? option.value : option;
              const optionLabel = typeof option === "object" ? option.label : option;
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        </label>
      );
    }

    if (question.type === "multiselect") {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset key={question.id} className="space-y-2">
          <legend className={authLabelClass}>
            {question.text}
            {required}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(question.options ?? []).map((option) => {
              const optionValue = typeof option === "object" ? option.value : option;
              const checked = selected.includes(optionValue);
              return (
                <label
                  key={optionValue}
                  className={cn(
                    "text-brand-body flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2",
                    checked
                      ? "border-[#3853A4]/30 bg-[#3853A4]/[0.06] text-primary"
                      : "border-primary/10 text-primary/70",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selected, optionValue]
                        : selected.filter((item) => item !== optionValue);
                      updateAnswer(question.id, next);
                    }}
                  />
                  {optionValue}
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    }

    if (question.type === "textarea") {
      return (
        <label key={question.id} className="block space-y-2">
          <span className={authLabelClass}>
            {question.text}
            {required}
          </span>
          <textarea
            value={String(value ?? "")}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            rows={4}
            className={cn(authFieldClass, "w-full px-4 py-2")}
          />
        </label>
      );
    }

    if (question.type === "number") {
      return (
        <label key={question.id} className="block space-y-2">
          <span className={authLabelClass}>
            {question.text}
            {required}
          </span>
          <input
            type="number"
            value={value === undefined || value === null ? "" : String(value)}
            min={question.min}
            max={question.max}
            onChange={(event) => updateAnswer(question.id, event.target.value)}
            className={cn(authFieldClass, "w-full px-4")}
          />
        </label>
      );
    }

    return (
      <label key={question.id} className="block space-y-2">
        <span className={authLabelClass}>
          {question.text}
          {required}
        </span>
        <input
          type="text"
          value={String(value ?? "")}
          placeholder={question.placeholder}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
          className={cn(authFieldClass, "w-full px-4")}
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

  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-[0_1px_3px_rgba(21,39,68,0.06)] md:p-6">
      {step === 0 ? (
        <div className="space-y-4">
          <div>
            <p className={portalSectionEyebrowClass}>Stage 0 · Provider verification</p>
            <h2 className={portalSectionTitleClass}>Consent & framing</h2>
            <p className={portalSectionDescClass}>
              This session is conducted under registered practitioner Dr. Sarah Mitchell. Confirm before entering patient information.
            </p>
          </div>
          <div className={cn("rounded-xl border border-primary/10 bg-primary/[0.02] p-4 leading-relaxed", portalRowValueClass)}>
            {flow.consent.text}
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/10 px-3 py-3">
            <input
              type="checkbox"
              checked={answers.consent === true}
              onChange={(event) => updateAnswer("consent", event.target.checked)}
              className="mt-1"
            />
            <span className={portalRowValueClass}>{flow.consent.confirm_label}</span>
          </label>
        </div>
      ) : null}

      {step === 1 && snapshotStage ? (
        <StageBlock
          badge="Stage 1"
          title={snapshotStage.title}
          description="Baseline patient demographics and activity level."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {snapshotStage.questions?.map((question) => renderQuestion(question))}
          </div>
        </StageBlock>
      ) : null}

      {step === 2 && safetyStage ? (
        <StageBlock
          badge="Stage 2 · Safety gate"
          title={safetyStage.title}
          description={safetyStage.description}
        >
          <div className="grid gap-4">{safetyStage.questions?.map((question) => renderQuestion(question))}</div>
        </StageBlock>
      ) : null}

      {step === 3 && goalStage ? (
        <StageBlock
          badge="Stage 3"
          title={goalStage.title}
          description="Select the primary therapeutic goal for this patient."
        >
          <div className="grid gap-4">{goalStage.questions?.map((question) => renderQuestion(question))}</div>
        </StageBlock>
      ) : null}

      {step === 4 ? (
        <StageBlock
          badge={`Stage 4 · Branch ${String(answers.primary_goal ?? "")}`}
          title="Clinical deep dive"
          description={branchLabel ?? ""}
        >
          <div className="grid gap-4">{branchQuestions.map((question) => renderQuestion(question))}</div>
        </StageBlock>
      ) : null}

      {step === 5 && historyStage ? (
        <StageBlock badge="Stage 5" title={historyStage.title} description="Prior peptide therapy and available laboratory data.">
          <div className="grid gap-4">{historyStage.questions?.map((question) => renderQuestion(question))}</div>
        </StageBlock>
      ) : null}

      {step === 6 && preferencesStage ? (
        <StageBlock
          badge="Stage 6 · Final step"
          title={preferencesStage.title}
          description="Your recommendation will appear in the consultation chat immediately after submission."
        >
          <div className="grid gap-4">{preferencesStage.questions?.map((question) => renderQuestion(question))}</div>
        </StageBlock>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button type="button" variant="secondary" onClick={handleBack} disabled={step === 0}>
          Back
        </Button>
        <Button type="button" onClick={handleNext}>
          {step === 6 ? "Generate recommendation" : "Continue"}
        </Button>
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
        <p className={portalSectionEyebrowClass}>{badge}</p>
        <h2 className={portalSectionTitleClass}>{title}</h2>
        {description ? <p className={portalSectionDescClass}>{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function IntakeStageList({
  step,
  inChat,
}: {
  step: number;
  inChat: boolean;
}) {
  return (
    <ol className="space-y-1">
      {INTAKE_STAGES.map((label, index) => {
        const active = inChat ? index === 7 : index === step;
        const done = inChat ? index < 7 : index < step;
        return (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5",
              portalSubnavItemClass,
              active && "bg-[#3853A4]/[0.08] font-semibold text-primary",
              !active && done && "text-primary/55",
              !active && !done && "text-primary/35",
            )}
          >
            <span
              className={cn(
                "text-brand-caption flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-semibold",
                active && "bg-[#3853A4] text-white",
                !active && done && "border border-[#3853A4]/30 text-[#3853A4]",
                !active && !done && "bg-primary/[0.06] text-primary/45",
              )}
            >
              {index + 1}
            </span>
            <span className="truncate">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
