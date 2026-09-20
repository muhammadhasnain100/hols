"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { cn } from "@/lib/utils";

export const WEBINAR_COVER_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const WEBINAR_COVER_MAX_BYTES = 5 * 1024 * 1024;
export const WEBINAR_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function validateWebinarCoverFile(file: File): string | null {
  if (!WEBINAR_COVER_TYPES.has(file.type)) {
    return "Cover must be JPEG, PNG, WebP, or GIF.";
  }
  if (file.size > WEBINAR_COVER_MAX_BYTES) {
    return "Cover must be 5 MB or smaller.";
  }
  return null;
}

type WebinarCoverPickerProps = {
  file: File | null;
  existingUrl?: string | null;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  dropzoneClassName?: string;
  onFileChange: (file: File | null, error: string | null) => void;
};

function splitLocalDateTime(value: string) {
  const [date = "", timePart = ""] = value.split("T");
  return { date, time: timePart.slice(0, 5) };
}

function joinLocalDateTime(date: string, time: string) {
  if (!date && !time) return "";
  return `${date}T${time || "00:00"}`;
}

function DateGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2.2" />
      <path d="M3.4 10h17.2M8 3.4v3.6M16 3.4v3.6" />
    </svg>
  );
}

function TimeGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 8.2v4.2l2.6 1.6" />
    </svg>
  );
}

export function WebinarDateTimeField({
  id,
  label,
  value,
  disabled,
  required,
  onChange,
}: {
  id?: string;
  label?: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const { date, time } = splitLocalDateTime(value);
  const groupLabel = label || "Start";

  return (
    <div className="grid min-w-0 gap-2">
      {label ? (
        <span className="dashboard-field-label">
          {label}
          {required ? (
            <span className="text-red-600" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </span>
      ) : null}
      <div className="grid min-w-0 grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        <label className="grid min-w-0 gap-1.5">
          <span className="text-brand-caption px-0.5 text-[color:var(--dash-faint)]">Date</span>
          <span className="hols-hover-border report-date-field relative flex h-11 min-h-11 w-full min-w-0 items-center overflow-hidden rounded-[0.875rem] border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3">
            <input
              id={`${baseId}-date`}
              type="date"
              required={required}
              disabled={disabled}
              value={date}
              aria-label={`${groupLabel} date`}
              onChange={(event) => onChange(joinLocalDateTime(event.target.value, time))}
              className="hols-plain-control report-date-input h-full min-h-0 min-w-0 flex-1 self-stretch text-[color:var(--dash-text)]"
            />
            <span className="report-date-icon" aria-hidden>
              <DateGlyph />
            </span>
          </span>
        </label>
        <label className="grid min-w-0 gap-1.5">
          <span className="text-brand-caption px-0.5 text-[color:var(--dash-faint)]">Time</span>
          <span className="hols-hover-border report-date-field relative flex h-11 min-h-11 w-full min-w-0 items-center overflow-hidden rounded-[0.875rem] border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3">
            <input
              id={`${baseId}-time`}
              type="time"
              required={required}
              disabled={disabled}
              value={time}
              step={60}
              aria-label={`${groupLabel} time`}
              onChange={(event) => onChange(joinLocalDateTime(date, event.target.value.slice(0, 5)))}
              className="hols-plain-control report-date-input h-full min-h-0 min-w-0 flex-1 self-stretch text-[color:var(--dash-text)]"
            />
            <span className="report-date-icon" aria-hidden>
              <TimeGlyph />
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

export function WebinarCoverPicker({
  file,
  existingUrl,
  disabled,
  required = true,
  error,
  dropzoneClassName,
  onFileChange,
}: WebinarCoverPickerProps) {
  const inputId = useId();
  const errorId = useId();
  const [dragOver, setDragOver] = useState(false);

  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const previewUrl = objectUrl || existingUrl || null;

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function applyFile(next: File | null) {
    if (!next) {
      onFileChange(null, required && !existingUrl ? "Cover image is required." : null);
      return;
    }
    onFileChange(next, validateWebinarCoverFile(next));
  }

  function handleFiles(files: FileList | null) {
    const next = files?.[0] ?? null;
    applyFile(next);
  }

  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={inputId} className="dashboard-field-label">
        Cover image
        {required ? (
          <span className="text-red-600" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>

      <div
        className={cn(
          "relative h-36 w-full overflow-hidden rounded-2xl border-2 border-dashed sm:h-44",
          error
            ? "border-red-400 bg-red-50/50"
            : dragOver
              ? "border-[color:var(--dash-accent)] bg-[color:var(--dash-soft)]"
              : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]",
          dropzoneClassName,
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Webinar cover preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="dashboard-tool-icon flex h-12 w-12 items-center justify-center rounded-full text-[color:var(--dash-text)]">
              <SidebarSvgIcon name="webinars" size={20} strokeWidth={1.85} />
            </span>
            <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
              Upload cover
            </p>
            <p className="text-brand-caption max-w-[16rem] text-[color:var(--dash-faint)]">
              JPEG, PNG, WebP, or GIF · up to 5 MB
            </p>
          </div>
        )}

        {previewUrl ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-2.5">
            <p className="font-sans text-xs font-semibold text-white">
              {file ? "Change cover" : "Replace cover"}
            </p>
          </div>
        ) : null}

        <input
          id={inputId}
          type="file"
          accept={WEBINAR_COVER_ACCEPT}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>

      {error ? (
        <p id={errorId} className="text-brand-caption font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-brand-caption text-[color:var(--dash-faint)]">
          Required. This image is shown on the webinar card.
        </p>
      )}
    </div>
  );
}
