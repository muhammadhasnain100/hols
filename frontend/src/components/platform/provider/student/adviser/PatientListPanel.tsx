"use client";

import type { PatientSummary } from "@/lib/integrate/provider/student/chat";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
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
    <aside className="hols-auth-card min-w-0 overflow-hidden rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            Cases
          </p>
          <h2 className="font-sans mt-1 truncate text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
            Patients
          </h2>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="font-sans inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-3.5 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:px-4"
        >
          <SidebarSvgIcon name="plus" size={14} strokeWidth={2.2} />
          {isCreating ? "Creating…" : "New"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg bg-[color:var(--dash-soft)] px-4 py-8 text-center">
            <span className="membership-plan-icon" aria-hidden>
              <SidebarSvgIcon name="adviser" size={20} strokeWidth={1.85} />
            </span>
            <p className="font-sans mt-3 text-sm font-semibold text-[color:var(--dash-text)]">
              No patients yet
            </p>
            <p className="text-brand-caption mt-1 max-w-[14rem] text-[color:var(--dash-faint)]">
              Create a case to start structured intake.
            </p>
          </div>
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
                  "dashboard-row flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition sm:px-3 sm:py-3",
                  active && "bg-[#DDE466]/15",
                )}
              >
                <span
                  className={cn(
                    "membership-plan-icon !h-9 !w-9 shrink-0",
                    patient.has_recommendation && "!bg-[color:var(--dash-soft)] !border-[color:var(--dash-surface-border)]",
                  )}
                  aria-hidden
                >
                  <SidebarSvgIcon
                    name={patient.has_recommendation ? "adviser" : "profile"}
                    size={16}
                    strokeWidth={1.9}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-sans truncate text-sm font-semibold text-[color:var(--dash-text)]">
                      {patient.display_name}
                    </p>
                    {!patient.has_recommendation ? (
                      <span className="text-brand-caption shrink-0 rounded-lg bg-[#DDE466]/25 px-2 py-0.5 font-medium text-[#152744]">
                        Draft
                      </span>
                    ) : (
                      <span className="text-brand-caption shrink-0 rounded-lg bg-[color:var(--dash-soft)] px-2 py-0.5 font-medium text-[color:var(--dash-muted)]">
                        Chat
                      </span>
                    )}
                  </div>
                  <p className="text-brand-caption mt-0.5 line-clamp-2 text-[color:var(--dash-faint)] sm:truncate sm:line-clamp-none">
                    {subtitle}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
