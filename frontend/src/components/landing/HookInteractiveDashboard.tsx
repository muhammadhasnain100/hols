"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { landingContent } from "@/content/landing";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const ACCENT = brand.colors.accent.lemonLime;
const NAVY = "#0B1F3A";
const PANEL = "#122845";
const PANEL_2 = "#163052";

/** Locked to dashboard frame — never reflows when switching portal pages. */
export const HOOK_PORTAL_SIZE = {
  width: 400,
  height: 288,
} as const;

const NAV_ICONS: Record<string, ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  lectures: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <path d="M4 6h16v11H4zM4 20h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calculator: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 8h8M8 12h2M12 12h2M16 12h1M8 16h2M12 16h2M16 16h1" strokeLinecap="round" />
    </svg>
  ),
  adviser: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" strokeLinejoin="round" />
    </svg>
  ),
  payment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <circle cx="12" cy="9" r="3.2" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
    </svg>
  ),
};

const COURSES = [
  { id: "bpc", title: "BPC-157 foundations", meta: "4 lessons" },
  { id: "recon", title: "Reconstitution basics", meta: "3 lessons" },
  { id: "safety", title: "Clinic safety checks", meta: "2 lessons" },
];

const ADVISER_PROMPTS = [
  "How do I reconstitute BPC-157?",
  "What syringe volume for 250 mcg?",
  "Patient handout wording?",
];

type NavId = (typeof landingContent.hook.dashboard.nav)[number]["id"];

type HookInteractiveDashboardProps = {
  innerRef?: (node: HTMLDivElement | null) => void;
  className?: string;
};

export function HookInteractiveDashboard({
  innerRef,
  className,
}: HookInteractiveDashboardProps) {
  const { dashboard } = landingContent.hook;
  const [activeNav, setActiveNav] = useState<NavId>("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [doseMg, setDoseMg] = useState(250);
  const [vialMg, setVialMg] = useState(5);
  const [waterMl, setWaterMl] = useState(2);
  const [adviserPrompt, setAdviserPrompt] = useState(ADVISER_PROMPTS[0]);
  const [adviserReply, setAdviserReply] = useState(
    "Use sterile water, note the concentration, then draw the exact units for your protocol.",
  );

  const units = Math.max(1, Math.round((doseMg / (vialMg * 1000)) * waterMl * 100));

  function openTool(id: string) {
    if (id === "lectures" || id === "calculator" || id === "adviser" || id === "profile" || id === "payment") {
      setActiveNav(id);
    } else if (id === "plans" || id === "orders" || id === "card") {
      setActiveNav("payment");
    } else if (id === "account") {
      setActiveNav("profile");
    } else {
      setActiveNav("dashboard");
    }
  }

  function askAdviser(prompt: string) {
    setAdviserPrompt(prompt);
    if (prompt.includes("reconstitute")) {
      setAdviserReply("Add bacteriostatic water slowly down the vial wall. Swirl gently — never shake.");
    } else if (prompt.includes("syringe") || prompt.includes("250")) {
      setAdviserReply(`At ${vialMg} mg / ${waterMl} mL, 250 mcg is about ${units} units on an insulin syringe.`);
    } else {
      setAdviserReply("Keep handouts brand-consistent: dose, schedule, storage, and when to contact the clinic.");
    }
  }

  const shellBg = darkMode ? NAVY : "#F4F7FB";
  const panelBg = darkMode ? PANEL : "rgba(255,255,255,0.92)";
  const panel2Bg = darkMode ? PANEL_2 : "#FFFFFF";
  const textMain = darkMode ? "#FFFFFF" : NAVY;
  const textMuted = darkMode ? "rgba(255,255,255,0.45)" : "rgba(11,31,58,0.55)";
  const border = darkMode ? "rgba(255,255,255,0.1)" : "rgba(11,31,58,0.08)";

  return (
    <div
      ref={innerRef}
      data-hook-dashboard
      className={cn(
        "pointer-events-auto relative z-20 box-border shrink-0 overflow-hidden rounded-2xl border shadow-[0_24px_60px_-20px_rgba(11,31,58,0.65)]",
        className,
      )}
      style={{
        width: HOOK_PORTAL_SIZE.width,
        height: HOOK_PORTAL_SIZE.height,
        minWidth: HOOK_PORTAL_SIZE.width,
        minHeight: HOOK_PORTAL_SIZE.height,
        maxWidth: HOOK_PORTAL_SIZE.width,
        maxHeight: HOOK_PORTAL_SIZE.height,
        backgroundColor: shellBg,
        borderColor: border,
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className="flex h-8 shrink-0 items-center gap-2 border-b px-3"
        style={{ backgroundColor: panelBg, borderColor: border }}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </span>
        <div
          className="ml-1 flex h-5 min-w-0 flex-1 items-center rounded-md border px-2"
          style={{ borderColor: border, backgroundColor: darkMode ? "rgba(0,0,0,0.2)" : "rgba(11,31,58,0.04)" }}
        >
          <span className="truncate font-sans text-[9px] font-medium" style={{ color: textMuted }}>
            app.hols.io/{activeNav}
          </span>
        </div>
      </div>

      <div className="flex h-[calc(100%-2rem)] min-h-0 w-full overflow-hidden">
        <aside
          className="flex w-[112px] shrink-0 flex-col border-r p-2"
          style={{ backgroundColor: panelBg, borderColor: border }}
        >
          <div className="mb-2 flex shrink-0 items-center gap-1.5 px-1">
            <Image
              src="/assets/logo/hols-logo-mark.png"
              alt=""
              width={18}
              height={18}
              className="h-3.5 w-3.5 object-contain"
            />
            <span className="font-sans text-[11px] font-bold tracking-wide" style={{ color: textMain }}>
              {dashboard.brand}
            </span>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Portal sections">
            {dashboard.nav.map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveNav(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left font-sans text-[9px] font-semibold transition",
                    active ? "text-[#0B1F3A]" : "hover:bg-white/5",
                  )}
                  style={
                    active
                      ? { backgroundColor: ACCENT, color: NAVY }
                      : { color: textMuted }
                  }
                >
                  <span className="shrink-0" style={{ color: active ? NAVY : textMuted }}>
                    {NAV_ICONS[item.id]}
                  </span>
                  <span className="truncate leading-none">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-2 shrink-0 border-t pt-2" style={{ borderColor: border }}>
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className="flex w-full items-center justify-between px-1"
              aria-pressed={darkMode}
            >
              <span className="font-sans text-[8px] font-medium" style={{ color: textMuted }}>
                Dark mode
              </span>
              <span
                className="relative h-3 w-5 shrink-0 rounded-full transition"
                style={{ backgroundColor: darkMode ? ACCENT : "rgba(11,31,58,0.2)" }}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-2 w-2 rounded-full bg-[#0B1F3A] transition",
                    darkMode ? "right-0.5" : "left-0.5",
                  )}
                />
              </span>
            </button>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2.5">
          <div className="mb-2 flex shrink-0 items-center justify-between">
            <p className="font-sans text-[11px] font-bold capitalize" style={{ color: textMain }}>
              {dashboard.nav.find((item) => item.id === activeNav)?.label ?? "Dashboard"}
            </p>
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-[#0B1F3A]"
              style={{ backgroundColor: ACCENT }}
            >
              MH
            </span>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {/* Absolute fill keeps every page the same occupied area */}
            <div className="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeNav === "dashboard" ? (
                <div className="flex h-full flex-col gap-2">
                  <div className="shrink-0 rounded-xl border p-2.5" style={{ backgroundColor: panel2Bg, borderColor: border }}>
                    <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.12em]" style={{ color: textMuted }}>
                      {dashboard.membership.label}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <div>
                        <p className="font-sans text-[15px] font-bold leading-none" style={{ color: textMain }}>
                          {dashboard.membership.plan}
                        </p>
                        <p className="mt-1 font-sans text-[9px] font-medium" style={{ color: textMuted }}>
                          {dashboard.membership.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveNav("payment")}
                        className="rounded-md px-2 py-1 font-sans text-[9px] font-bold text-[#0B1F3A] transition hover:brightness-105"
                        style={{ backgroundColor: ACCENT }}
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl border p-2.5" style={{ backgroundColor: panel2Bg, borderColor: border }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-sans text-[9px] font-bold" style={{ color: textMain }}>
                        Quick tools
                      </p>
                      <span className="font-sans text-[8px] font-medium" style={{ color: textMuted }}>
                        Tap to explore
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {dashboard.tools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => openTool(tool.id)}
                          className="flex flex-col items-center gap-1 rounded-lg p-1 transition hover:bg-white/5"
                        >
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[#0B1F3A]"
                            style={{ backgroundColor: `${ACCENT}CC` }}
                          >
                            {NAV_ICONS[tool.id]}
                          </span>
                          <span className="font-sans text-[7px] font-semibold" style={{ color: textMuted }}>
                            {tool.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_0.85fr] gap-2">
                    <div className="rounded-xl border p-2.5" style={{ backgroundColor: panel2Bg, borderColor: border }}>
                      <p className="mb-1.5 font-sans text-[9px] font-bold" style={{ color: textMain }}>
                        Recent activity
                      </p>
                      <p className="font-sans text-[9px]" style={{ color: textMuted }}>
                        No orders yet.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border p-2" style={{ backgroundColor: panel2Bg, borderColor: border }}>
                      {dashboard.actions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => openTool(action.id)}
                          className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition hover:bg-white/5"
                          style={{ color: textMuted }}
                        >
                          <span>{NAV_ICONS[action.id] ?? NAV_ICONS.payment}</span>
                          <span className="min-w-0 flex-1 truncate font-sans text-[7px] font-semibold">
                            {action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeNav === "lectures" ? (
                <div className="flex h-full flex-col gap-1.5">
                  {COURSES.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      className="shrink-0 rounded-xl border p-2.5 text-left transition hover:brightness-105"
                      style={{ backgroundColor: panel2Bg, borderColor: border }}
                    >
                      <p className="font-sans text-[10px] font-bold" style={{ color: textMain }}>
                        {course.title}
                      </p>
                      <p className="mt-0.5 font-sans text-[8px]" style={{ color: textMuted }}>
                        {course.meta}
                      </p>
                    </button>
                  ))}
                  <div className="min-h-0 flex-1 rounded-xl border border-dashed" style={{ borderColor: border }} />
                </div>
              ) : null}

              {activeNav === "calculator" ? (
                <div className="flex h-full flex-col rounded-xl border p-2.5" style={{ backgroundColor: panel2Bg, borderColor: border }}>
                  <p className="mb-2 shrink-0 font-sans text-[9px] font-bold" style={{ color: textMain }}>
                    Peptide dose helper
                  </p>
                  <label className="mb-2 block shrink-0">
                    <span className="font-sans text-[8px]" style={{ color: textMuted }}>
                      Dose (mcg)
                    </span>
                    <input
                      type="range"
                      min={50}
                      max={500}
                      step={25}
                      value={doseMg}
                      onChange={(event) => setDoseMg(Number(event.target.value))}
                      className="mt-1 w-full accent-[#DDE466]"
                    />
                    <span className="font-sans text-[10px] font-bold" style={{ color: textMain }}>
                      {doseMg} mcg
                    </span>
                  </label>
                  <div className="grid shrink-0 grid-cols-2 gap-2">
                    <label>
                      <span className="font-sans text-[8px]" style={{ color: textMuted }}>
                        Vial (mg)
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={vialMg}
                        onChange={(event) => setVialMg(Math.max(1, Number(event.target.value) || 1))}
                        className="mt-1 w-full rounded-md border bg-transparent px-2 py-1 font-sans text-[10px] outline-none"
                        style={{ borderColor: border, color: textMain }}
                      />
                    </label>
                    <label>
                      <span className="font-sans text-[8px]" style={{ color: textMuted }}>
                        Water (mL)
                      </span>
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={waterMl}
                        onChange={(event) => setWaterMl(Math.max(0.5, Number(event.target.value) || 0.5))}
                        className="mt-1 w-full rounded-md border bg-transparent px-2 py-1 font-sans text-[10px] outline-none"
                        style={{ borderColor: border, color: textMain }}
                      />
                    </label>
                  </div>
                  <div className="min-h-0 flex-1" />
                  <div
                    className="shrink-0 rounded-lg px-2.5 py-2 font-sans text-[10px] font-bold text-[#0B1F3A]"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Draw ~{units} units
                  </div>
                </div>
              ) : null}

              {activeNav === "adviser" ? (
                <div className="flex h-full flex-col gap-2">
                  <div className="min-h-0 flex-1 rounded-xl border p-2.5" style={{ backgroundColor: panel2Bg, borderColor: border }}>
                    <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.1em]" style={{ color: textMuted }}>
                      You asked
                    </p>
                    <p className="mt-1 font-sans text-[10px] font-semibold" style={{ color: textMain }}>
                      {adviserPrompt}
                    </p>
                    <p className="mt-2 font-sans text-[9px] leading-relaxed" style={{ color: textMuted }}>
                      {adviserReply}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {ADVISER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => askAdviser(prompt)}
                        className="rounded-full border px-2 py-1 font-sans text-[7px] font-semibold transition hover:brightness-105"
                        style={{
                          borderColor: border,
                          backgroundColor: adviserPrompt === prompt ? ACCENT : panel2Bg,
                          color: adviserPrompt === prompt ? NAVY : textMuted,
                        }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeNav === "payment" ? (
                <div className="flex h-full flex-col gap-1.5">
                  {[
                    { id: "monthly", title: "Monthly", price: "$29.99" },
                    { id: "annual", title: "Annual", price: "$249.99" },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      className="flex shrink-0 items-center justify-between rounded-xl border p-2.5 text-left transition hover:brightness-105"
                      style={{ backgroundColor: panel2Bg, borderColor: border }}
                    >
                      <span>
                        <span className="block font-sans text-[10px] font-bold" style={{ color: textMain }}>
                          {plan.title}
                        </span>
                        <span className="font-sans text-[8px]" style={{ color: textMuted }}>
                          Full portal access
                        </span>
                      </span>
                      <span
                        className="rounded-md px-2 py-1 font-sans text-[9px] font-bold text-[#0B1F3A]"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {plan.price}
                      </span>
                    </button>
                  ))}
                  <div className="min-h-0 flex-1 rounded-xl border border-dashed" style={{ borderColor: border }} />
                </div>
              ) : null}

              {activeNav === "profile" ? (
                <div className="flex h-full flex-col rounded-xl border p-2.5" style={{ backgroundColor: panel2Bg, borderColor: border }}>
                  <div className="mb-2 flex shrink-0 items-center gap-2">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-[#0B1F3A]"
                      style={{ backgroundColor: ACCENT }}
                    >
                      MH
                    </span>
                    <div>
                      <p className="font-sans text-[10px] font-bold" style={{ color: textMain }}>
                        Muhammad Hasnain
                      </p>
                      <p className="font-sans text-[8px]" style={{ color: textMuted }}>
                        Student account
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      ["Email", "hasnain@example.com"],
                      ["Clinic", "HOLS Training Clinic"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg border px-2 py-1.5"
                        style={{ borderColor: border }}
                      >
                        <span className="font-sans text-[8px]" style={{ color: textMuted }}>
                          {label}
                        </span>
                        <span className="font-sans text-[8px] font-semibold" style={{ color: textMain }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="min-h-0 flex-1" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
