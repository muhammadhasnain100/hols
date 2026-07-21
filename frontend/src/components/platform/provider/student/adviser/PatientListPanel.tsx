"use client";

import {
  portalEmptyStateClass,
  portalInlineMetaClass,
  portalNavItemClass,
  portalSectionEyebrowClass,
} from "@/components/platform/provider/portal-styles";
import { cn } from "@/lib/utils";
import type { PatientSummary } from "@/lib/integrate/provider/student/chat";
import { Button } from "@/components/ui/Button";

type PatientListPanelProps = {
  patients: PatientSummary[];
  activePatientId: string | null;
  onSelect: (patientId: string) => void;
  onCreate: () => void;
  isCreating?: boolean;
};

export function PatientListPanel({
  patients,
  activePatientId,
  onSelect,
  onCreate,
  isCreating = false,
}: PatientListPanelProps) {
  return (
    <aside className="rounded-2xl border border-primary/10 bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <p className={portalSectionEyebrowClass}>Patients</p>
        <Button type="button" size="sm" onClick={onCreate} disabled={isCreating}>
          {isCreating ? "Creating…" : "New"}
        </Button>
      </div>

      <div className="mt-3 space-y-1">
        {patients.length === 0 ? (
          <p className={cn("rounded-xl bg-primary/[0.03] px-3 py-4 leading-relaxed", portalEmptyStateClass)}>
            No patients yet. Create one to start a new intake and recommendation case.
          </p>
        ) : (
          patients.map((patient) => (
            <button
              key={patient.patient_id}
              type="button"
              onClick={() => onSelect(patient.patient_id)}
              className={cn(
                "w-full rounded-xl px-3 py-3 text-left transition",
                activePatientId === patient.patient_id
                  ? "bg-[#3853A4]/[0.08] ring-1 ring-[#3853A4]/20"
                  : "hover:bg-primary/[0.03]",
              )}
            >
              <p className={cn("truncate font-semibold", portalNavItemClass)}>{patient.display_name}</p>
              <p className={cn("mt-1 truncate", portalInlineMetaClass)}>
                {patient.primary_goal || "Draft intake"}
                {patient.has_recommendation
                  ? ` · ${patient.message_count} messages · Open chat`
                  : ""}
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
