"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import type { RecommendationBoardPeptide } from "@/lib/integrate/provider/student/chat";
import { cn } from "@/lib/utils";

type PeptideFocusSelectProps = {
  peptides: RecommendationBoardPeptide[];
  selected: string[];
  disabled?: boolean;
  onChange: (names: string[]) => void;
};

export function PeptideFocusSelect({
  peptides,
  selected,
  disabled = false,
  onChange,
}: PeptideFocusSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuHost, setMenuHost] = useState<Element | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const selectedSet = new Set(selected);
  const allNames = peptides.map((peptide) => peptide.name);
  const allSelected = allNames.length > 0 && allNames.every((name) => selectedSet.has(name));
  const countLabel =
    selected.length === 1
      ? `Talking about 1 peptide: ${selected[0]}`
      : selected.length > 1
        ? `Talking about ${selected.length} peptides: ${selected.join(", ")}`
        : "Select peptides to talk about";

  useLayoutEffect(() => {
    setMenuHost(rootRef.current?.closest(".adviser-chat-composer-bar") ?? null);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (peptides.length === 0) return null;

  const toggle = (name: string) => {
    const current = selectedRef.current;
    if (current.includes(name)) {
      const next = current.filter((item) => item !== name);
      onChange(next.length > 0 ? next : [name]);
      return;
    }
    onChange([...current, name]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [allNames[0]] : allNames);
  };

  const menu = open ? (
    <div
      ref={menuRef}
      className="adviser-peptide-select-menu"
      role="listbox"
      aria-multiselectable="true"
    >
      <div className="px-3 pb-1.5 pt-2">
        <p className="text-brand-caption font-medium uppercase tracking-[0.06em] text-[color:var(--dash-faint)]">
          Talk about
        </p>
        <p className="text-brand-caption mt-0.5 text-[color:var(--dash-muted)]">
          Check one peptide, or several to compare.
        </p>
      </div>
      {allNames.length > 1 ? (
        <button
          type="button"
          onClick={toggleAll}
          className={cn("adviser-peptide-select-option", allSelected && "is-selected")}
        >
          <span
            className={cn("adviser-peptide-select-check", allSelected && "is-checked")}
            aria-hidden
          >
            {allSelected ? <SidebarSvgIcon name="check" size={13} strokeWidth={2.6} /> : null}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate font-semibold">All ranked</span>
            <span className="text-brand-caption block text-[color:var(--dash-faint)]">
              Talk about every peptide
            </span>
          </span>
        </button>
      ) : null}
      {peptides.map((peptide) => {
        const checked = selectedSet.has(peptide.name);
        return (
          <button
            key={peptide.name}
            type="button"
            role="option"
            aria-selected={checked}
            onClick={() => toggle(peptide.name)}
            className={cn("adviser-peptide-select-option", checked && "is-selected")}
          >
            <span
              className={cn("adviser-peptide-select-check", checked && "is-checked")}
              aria-hidden
            >
              {checked ? <SidebarSvgIcon name="check" size={13} strokeWidth={2.6} /> : null}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate font-semibold">{peptide.name}</span>
              <span className="text-brand-caption block text-[color:var(--dash-faint)]">
                #{peptide.rank}
                {checked ? (selected.length > 1 ? " · selected" : " · only this") : ""}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="adviser-peptide-select shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={countLabel}
        title={countLabel}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "adviser-onboarding-close adviser-peptide-select-trigger flex h-11 w-11 items-center justify-center rounded-full",
          open && "is-open",
          selected.length > 1 && "is-multi",
        )}
      >
        <SidebarSvgIcon name="adviser" size={20} strokeWidth={1.85} />
        {selected.length > 0 ? (
          <span className="adviser-peptide-select-count" aria-hidden>
            {selected.length}
          </span>
        ) : null}
      </button>
      {menu ? (menuHost ? createPortal(menu, menuHost) : menu) : null}
    </div>
  );
}
