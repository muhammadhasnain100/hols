"use client";

import type { PatientSummary } from "@/lib/integrate/provider/student/chat";
import { cn } from "@/lib/utils";

type PatientListPanelProps = {
  patients: PatientSummary[];
  activePatientId: string | null;
  onSelect: (patientId: string) => void;
  onCreate: () => void;
  isCreating?: boolean;
  progressLabelFor?: (patient: PatientSummary) => string;
};

export function PatientListPanel({
  patients,
  activePatientId,
  onSelect,
  onCreate,
  isCreating = false,
  progressLabelFor,
}: PatientListPanelProps) {
  return (
    <aside className="dashboard-surface min-w-0 overflow-hidden rounded-2xl p-3.5 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans truncate text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
          Patients
        </h2>
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="font-sans inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-[#DDE466] px-3.5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 sm:px-4"
        >
          {isCreating ? "Creating…" : "New"}
        </button>
      </div>

      <div className="mt-3 space-y-1">
        {patients.length === 0 ? (
          <p className="text-brand-body rounded-xl bg-[color:var(--dash-soft)] px-3 py-4 text-center text-[color:var(--dash-faint)]">
            No patients yet. Create one to start intake.
          </p>
        ) : (
          patients.map((patient) => {
            const active = activePatientId === patient.patient_id;
            const subtitle =
              progressLabelFor?.(patient) ??
              (patient.has_recommendation
                ? `${patient.message_count} messages · Open chat`
                : patient.primary_goal || "Draft intake");

            return (
              <button
                key={patient.patient_id}
                type="button"
                onClick={() => onSelect(patient.patient_id)}
                className={cn(
                  "dashboard-row w-full rounded-xl px-2.5 py-2.5 text-left transition sm:px-3 sm:py-3",
                  active && "bg-[#DDE466]/15",
                )}
              >
                <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans truncate text-sm font-semibold text-[color:var(--dash-text)]">
                      {patient.display_name}
                    </p>
                    <p className="text-brand-caption mt-0.5 line-clamp-2 text-[color:var(--dash-faint)] sm:truncate sm:line-clamp-none">
                      {subtitle}
                    </p>
                  </div>
                  {!patient.has_recommendation ? (
                    <span className="text-brand-caption shrink-0 rounded-full bg-[#DDE466]/25 px-2 py-0.5 font-medium text-[#152744]">
                      Draft
                    </span>
                  ) : (
                    <span className="text-brand-caption shrink-0 rounded-full bg-[color:var(--dash-soft)] px-2 py-0.5 font-medium text-[color:var(--dash-muted)]">
                      Chat
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
