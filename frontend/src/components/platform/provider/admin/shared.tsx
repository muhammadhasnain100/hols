"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Icon, Search, X } from "@/components/icons";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
  total: number;
  loading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  hasNext,
  hasPrevious,
  total,
  loading,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[color:var(--dash-surface-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-brand-caption text-[color:var(--dash-faint)]">
        {total} total · Page {page}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <button
          type="button"
          disabled={!hasPrevious || loading}
          onClick={onPrevious}
          className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext || loading}
          onClick={onNext}
          className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function UserLink({ userId, label }: { userId: string; label: string }) {
  return (
    <Link
      href={`/admin/users/${encodeURIComponent(userId)}`}
      className="font-sans font-semibold text-[color:var(--dash-text)] underline-offset-2 transition hover:text-[color:var(--dash-accent)] hover:underline"
    >
      {label}
    </Link>
  );
}

export function StatPill({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl px-3.5 py-3 sm:px-4 sm:py-4">
      <p className="text-brand-caption break-words font-medium text-[color:var(--dash-faint)]">{label}</p>
      <p className="font-sans mt-1 break-words text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
        {value}
      </p>
    </div>
  );
}

/** Labeled data cell used inside user directory cards. */
export function DataField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 overflow-hidden", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
        {label}
      </p>
      <div className="font-sans mt-1 break-words text-sm font-medium text-[color:var(--dash-text)] [overflow-wrap:anywhere]">
        {value ?? "—"}
      </div>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warn" | "muted";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-[#DDE466]/25 text-[color:var(--dash-accent)]"
      : tone === "warn"
        ? "bg-amber-500/15 text-amber-700"
        : tone === "muted"
          ? "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]"
          : "bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)]";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

/** Custom select so open menu matches portal dark/light field styles (native `<option>` cannot). */
export function DashboardSelect<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  id,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  "aria-label"?: string;
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const [portalTheme, setPortalTheme] = useState<"light" | "dark">("light");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];
  const isDark = portalTheme === "dark";

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuBox(null);
      return;
    }

    const shell = buttonRef.current.closest(".portal-shell") as HTMLElement | null;
    setPortalTarget(shell ?? document.body);
    setPortalTheme(shell?.getAttribute("data-theme") === "dark" ? "dark" : "light");

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuBox({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
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

  const menu =
    open && menuBox && portalTarget
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            data-theme={portalTheme}
            className="dashboard-select-menu overflow-hidden rounded-2xl p-1.5"
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
              zIndex: 9999,
              backgroundColor: isDark ? "rgba(16, 30, 54, 0.97)" : "rgba(244, 247, 251, 0.97)",
              backgroundImage: isDark
                ? "linear-gradient(165deg, rgba(56, 83, 164, 0.45) 0%, rgba(20, 38, 68, 0.25) 100%)"
                : "linear-gradient(165deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.3) 100%)",
              border: isDark
                ? "1px solid rgba(141, 195, 225, 0.4)"
                : "1px solid rgba(21, 39, 68, 0.14)",
              color: isDark ? "#f4f7fb" : "#152744",
              backdropFilter: "blur(28px) saturate(170%)",
              WebkitBackdropFilter: "blur(28px) saturate(170%)",
              boxShadow: isDark
                ? "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 18px 48px rgba(0, 0, 0, 0.55)"
                : "inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 18px 48px rgba(10, 18, 36, 0.22)",
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "font-sans flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm transition",
                      isSelected
                        ? "bg-[#DDE466]/28 font-semibold"
                        : isDark
                          ? "text-white/70 hover:bg-white/10 hover:text-white"
                          : "text-[#152744]/70 hover:bg-[#152744]/6 hover:text-[#152744]",
                      isSelected && (isDark ? "text-white" : "text-[#152744]"),
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <Icon
                        icon={Check}
                        size={15}
                        strokeWidth={2.2}
                        className="shrink-0 text-[#DDE466]"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          portalTarget,
        )
      : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className="dashboard-field font-sans flex w-full items-center justify-between gap-2 pr-3.5 text-left"
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Select"}</span>
        <Icon
          icon={ChevronDown}
          size={16}
          strokeWidth={2}
          className={cn(
            "shrink-0 text-[color:var(--dash-accent)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {menu}
    </div>
  );
}

export function DirectorySearchBar({
  value,
  onChange,
  placeholder,
  label = "Search directory",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}) {
  return (
    <label className="relative mt-4 flex min-h-11 w-full items-center gap-2 rounded-full border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/55 px-3.5 sm:mt-5">
      <span className="shrink-0 text-[color:var(--dash-faint)]" aria-hidden>
        <Icon icon={Search} size={17} strokeWidth={1.9} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="font-sans min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[color:var(--dash-text)] outline-none placeholder:text-[color:var(--dash-faint)]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-faint)] transition hover:bg-[color:var(--dash-soft)] hover:text-[color:var(--dash-text)]"
          aria-label="Clear search"
        >
          <Icon icon={X} size={14} strokeWidth={2} />
        </button>
      ) : null}
    </label>
  );
}

export function DirectoryListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/40 p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span className="dashboard-skeleton-block h-12 w-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <span className="dashboard-skeleton-block block h-4 w-40 rounded-full" />
              <span className="dashboard-skeleton-block block h-3 w-56 rounded-full" />
            </div>
            <span className="dashboard-skeleton-block hidden h-9 w-24 rounded-full sm:block" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, field) => (
              <div key={field} className="space-y-2">
                <span className="dashboard-skeleton-block block h-2.5 w-14 rounded-full" />
                <span className="dashboard-skeleton-block block h-3.5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
