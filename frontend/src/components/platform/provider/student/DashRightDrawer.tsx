"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";

type DashRightDrawerProps = {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
};

export function DashRightDrawer({ title, eyebrow, onClose, onBack, children }: DashRightDrawerProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const shell = document.querySelector(".portal-shell");
    const readTheme = () => {
      setTheme(shell?.getAttribute("data-theme") === "dark" ? "dark" : "light");
    };
    readTheme();
    if (!shell) return;
    const observer = new MutationObserver(readTheme);
    observer.observe(shell, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
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
        aria-label="Close overlay"
        onClick={onClose}
      />
      <aside
        className="dash-right-drawer"
        data-theme={theme}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="dash-right-drawer-header">
          {onBack ? (
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="adviser-onboarding-close inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition sm:h-12 sm:w-12"
            >
              <SidebarSvgIcon name="previous" size={18} strokeWidth={2.15} className="sm:hidden" />
              <SidebarSvgIcon name="previous" size={22} strokeWidth={2.15} className="hidden sm:block" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-brand-caption font-medium uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="font-sans mt-0.5 truncate text-lg font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close panel"
            onClick={onClose}
            className="adviser-onboarding-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition sm:h-12 sm:w-12"
          >
            <SidebarSvgIcon name="cross" size={24} strokeWidth={2.2} className="sm:hidden" />
            <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
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
