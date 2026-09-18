"use client";

import { useState, type ReactNode } from "react";
import type { PatientSummary } from "@/lib/integrate/provider/student/chat";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "progress" | "chat";

type PatientListPanelProps = {
  patients: PatientSummary[];
  activePatientId: string | null;
  onSelect: (patientId: string) => void;
  onCreate: () => void;
  isCreating?: boolean;
  progressLabelFor?: (patient: PatientSummary) => string;
  headerExtra?: ReactNode;
};

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "progress", label: "In progress" },
  { id: "chat", label: "Chat" },
];

function isChatCase(patient: PatientSummary) {
  return patient.has_recommendation;
}

function formatUpdated(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(patient: PatientSummary) {
  return isChatCase(patient) ? "Chat" : "In progress";
}

export function PatientListPanel({
  patients,
  activePatientId,
  onSelect,
  onCreate,
  isCreating = false,
  progressLabelFor,
  headerExtra,
}: PatientListPanelProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const drafts = patients.filter((patient) => !isChatCase(patient));
  const ready = patients.filter((patient) => isChatCase(patient));
  const visiblePatients =
    filter === "progress" ? drafts : filter === "chat" ? ready : patients;
  const counts = {
    all: patients.length,
    progress: drafts.length,
    chat: ready.length,
  };

  const detailFor = (patient: PatientSummary) =>
    progressLabelFor?.(patient) ??
    (isChatCase(patient)
      ? `${patient.message_count} messages`
      : patient.primary_goal || "Intake in progress");

  const emptyCopy =
    filter === "progress"
      ? "No cases in progress."
      : filter === "chat"
        ? "No chat cases yet."
        : "No patients yet";

  return (
    <div className="grid min-w-0 gap-3 sm:gap-4">
      <div className="flex w-full min-w-0 items-center gap-1.5">
        {patients.length > 0 ? (
          <div
            role="tablist"
            aria-label="Filter cases"
            className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {FILTERS.map((item) => {
              const selected = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "font-sans inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium tracking-[0.01em] transition",
                    selected
                      ? "dashboard-navy-btn text-white"
                      : "dashboard-pill-soft text-[color:var(--dash-text)]",
                  )}
                >
                  {item.label}
                  <span className={cn("tabular-nums", selected ? "text-white/80" : "text-[color:var(--dash-faint)]")}>
                    {counts[item.id]}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}
        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="dashboard-navy-btn font-sans inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium tracking-[0.01em] text-white disabled:pointer-events-none disabled:opacity-60"
        >
          <SidebarSvgIcon name="plus" size={15} strokeWidth={2.2} />
          {isCreating ? "Creating…" : "New patient"}
        </button>
      </div>

      {headerExtra}

      <section className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl">
        {patients.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center sm:py-14">
            <span className="dashboard-tool-icon flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--dash-text)]">
              <SidebarSvgIcon name="adviser" size={22} strokeWidth={1.85} />
            </span>
            <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)] sm:text-lg">
              No patients yet
            </p>
            <p className="text-brand-body mt-1.5 max-w-sm text-[color:var(--dash-muted)]">
              Create a case with a name. Intake takes a couple of minutes, then you can open the consultation chat.
            </p>
          </div>
        ) : visiblePatients.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">{emptyCopy}</p>
            <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
              Switch the filter, or create a new patient.
            </p>
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-[color:var(--dash-soft)] text-brand-caption font-semibold uppercase tracking-[0.06em] text-[color:var(--dash-faint)]">
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                    Patient
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Details
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Messages
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Updated
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiblePatients.map((patient) => {
                  const active = activePatientId === patient.patient_id;
                  const chat = isChatCase(patient);
                  return (
                    <tr
                      key={patient.patient_id}
                      tabIndex={0}
                      role="button"
                      aria-label={`${patient.display_name}, ${statusLabel(patient)}. ${chat ? "Open chat" : "Continue intake"}`}
                      className={cn(
                        "cursor-pointer outline-none transition focus-visible:bg-[color:var(--dash-soft)]",
                        active ? "bg-[color:var(--dash-soft)]" : "hover:bg-[color:var(--dash-soft)]",
                      )}
                      onClick={() => onSelect(patient.patient_id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelect(patient.patient_id);
                        }
                      }}
                    >
                      <td className="border-t border-[color:var(--dash-surface-border)] px-4 py-3 sm:px-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="dashboard-tool-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)]">
                            <SidebarSvgIcon name={chat ? "adviser" : "profile"} size={15} strokeWidth={1.9} />
                          </span>
                          <span className="font-sans min-w-0 truncate text-sm font-semibold text-[color:var(--dash-text)]">
                            {patient.display_name}
                          </span>
                        </div>
                      </td>
                      <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                        <span className="text-brand-caption inline-flex rounded-full bg-[color:var(--dash-soft)] px-2.5 py-1 font-semibold text-[color:var(--dash-text)]">
                          {statusLabel(patient)}
                        </span>
                      </td>
                      <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                        <span className="text-brand-caption block max-w-[16rem] truncate text-[color:var(--dash-muted)]">
                          {detailFor(patient)}
                        </span>
                      </td>
                      <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                        <span className="font-sans text-sm tabular-nums text-[color:var(--dash-text)]">
                          {patient.message_count}
                        </span>
                      </td>
                      <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                        <span className="text-brand-caption whitespace-nowrap text-[color:var(--dash-muted)]">
                          {formatUpdated(patient.updated_at)}
                        </span>
                      </td>
                      <td className="border-t border-[color:var(--dash-surface-border)] px-4 py-3 text-right sm:px-5">
                        <span className="inline-flex items-center justify-end gap-1 text-brand-caption font-medium text-[color:var(--dash-navy)]">
                          {chat ? "Open" : "Continue"}
                          <SidebarSvgIcon name="next" size={14} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
