"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, X } from "@/components/icons";

type DashRightDrawerProps = {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function DashRightDrawer({ title, eyebrow, onClose, children }: DashRightDrawerProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="dash-right-layer">
      <button
        type="button"
        className="dash-right-backdrop"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className="dash-right-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="dash-right-drawer-header">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-brand-caption font-medium uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="font-sans truncate text-lg font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12"
          >
            <Icon icon={X} size={18} strokeWidth={2.1} />
          </button>
        </header>
        <div className="dash-right-drawer-body" data-lenis-prevent>
          {children}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
