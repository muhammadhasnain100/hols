"use client";

import Image from "next/image";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

/** Student portal palette — mirrors `.portal-shell` / `.dashboard-screen` tokens. */
const LIME = "#DDE466";
const NAVY = "#142644";
const TEXT_NAVY = "#152744";

const THEME = {
  light: {
    chromeBg: "#ffffff",
    chromeUrl: "rgba(21, 39, 68, 0.04)",
    pageBg:
      "radial-gradient(100% 90% at 100% 0%, rgba(221, 228, 102, 0.55) 0%, transparent 55%), radial-gradient(90% 85% at 0% 100%, rgba(141, 195, 225, 0.5) 0%, transparent 58%), linear-gradient(150deg, #dceaf5 0%, #e8eef8 40%, #eef3d8 100%)",
    pageBgSolid: "#e8eef8",
    sidebarBg: "rgba(236, 244, 250, 0.72)",
    sidebarBorder: "rgba(56, 83, 164, 0.12)",
    sidebarText: "#142644",
    sidebarMuted: "rgba(20, 38, 68, 0.62)",
    sidebarHover: "rgba(56, 83, 164, 0.08)",
    sidebarActive: "rgba(221, 228, 102, 0.18)",
    sidebarActiveShadow: "inset 0 0 0 1px rgba(221, 228, 102, 0.36)",
    sidebarFooter: "rgba(255, 255, 255, 0.28)",
    cardBg: "rgba(255, 255, 255, 0.42)",
    cardBorder: "rgba(255, 255, 255, 0.55)",
    text: "#152744",
    muted: "rgba(21, 39, 68, 0.72)",
    faint: "rgba(21, 39, 68, 0.52)",
    accent: "#6f7a1c",
    soft: "rgba(21, 39, 68, 0.05)",
    softBorder: "rgba(21, 39, 68, 0.08)",
    shellBorder: "rgba(21, 39, 68, 0.1)",
    switchOff: "rgba(20, 38, 68, 0.12)",
  },
  dark: {
    chromeBg: "#141a24",
    chromeUrl: "rgba(0, 0, 0, 0.28)",
    pageBg:
      "radial-gradient(100% 90% at 100% 0%, rgba(221, 228, 102, 0.28) 0%, transparent 55%), radial-gradient(90% 85% at 0% 100%, rgba(141, 195, 225, 0.22) 0%, transparent 58%), linear-gradient(150deg, #142644 0%, #1a2f55 40%, #162848 100%)",
    pageBgSolid: "#142644",
    sidebarBg: "#142644",
    sidebarBorder: "rgba(141, 195, 225, 0.14)",
    sidebarText: "#f4f7fb",
    sidebarMuted: "rgba(244, 247, 251, 0.68)",
    sidebarHover: "rgba(255, 255, 255, 0.08)",
    sidebarActive: "rgba(221, 228, 102, 0.2)",
    sidebarActiveShadow: "inset 0 0 0 1px rgba(221, 228, 102, 0.4)",
    sidebarFooter: "rgba(0, 0, 0, 0.22)",
    cardBg: "rgba(20, 38, 68, 0.45)",
    cardBorder: "rgba(141, 195, 225, 0.2)",
    text: "#f4f7fb",
    muted: "rgba(244, 247, 251, 0.72)",
    faint: "rgba(244, 247, 251, 0.5)",
    accent: "#dde466",
    soft: "rgba(255, 255, 255, 0.08)",
    softBorder: "rgba(255, 255, 255, 0.12)",
    shellBorder: "rgba(255, 255, 255, 0.12)",
    switchOff: "rgba(255, 255, 255, 0.12)",
  },
} as const;

/** Locked desktop frame — never reflows when switching portal pages. */
export const HOOK_PORTAL_SIZE = {
  width: 460,
  height: 331,
} as const;

/**
 * Desktop: exact locked-size slot (no scale).
 * Mobile (`responsive`): scales the locked frame down to fit container width.
 */
export function HookPortalShell({
  children,
  className,
  responsive = false,
}: {
  children: ReactNode;
  className?: string;
  responsive?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (!responsive) return;
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const next = Math.min(1, w / HOOK_PORTAL_SIZE.width);
      setScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [responsive]);

  // Remeasure hook wires after scale settles (fixed child size won't fire ResizeObserver).
  // Debounce so we don't thrash ScrollTrigger / sibling landing sections.
  useLayoutEffect(() => {
    if (!responsive) return;
    const id = window.setTimeout(() => {
      window.dispatchEvent(new Event("hook-path-sync"));
    }, 50);
    return () => window.clearTimeout(id);
  }, [responsive, scale]);

  if (!responsive) {
    return (
      <div
        data-hook-portal-shell
        className={cn("relative shrink-0", className)}
        style={{
          width: HOOK_PORTAL_SIZE.width,
          height: HOOK_PORTAL_SIZE.height,
          minWidth: HOOK_PORTAL_SIZE.width,
          minHeight: HOOK_PORTAL_SIZE.height,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      data-hook-portal-shell
      className={cn("relative w-full max-w-[460px] shrink-0", className)}
      style={{ height: HOOK_PORTAL_SIZE.height * scale }}
    >
      <div
        data-hook-portal-scale
        className="origin-top-left will-change-transform"
        style={{
          width: HOOK_PORTAL_SIZE.width,
          height: HOOK_PORTAL_SIZE.height,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
  advisor: (
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

const ADVISOR_PROMPTS = [
  "How do I reconstitute BPC-157?",
  "What syringe volume for 250 mcg?",
  "Patient handout wording?",
];

const DEMO_PROFILE = {
  name: "Jordan Mitchell",
  initials: "JM",
  email: "jordan.mitchell@email.com",
  clinic: "Summit Wellness Clinic",
  role: "Student account",
  photo: "/assets/hook/jordan-mitchell.jpg",
} as const;

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
  const [advisorPrompt, setAdvisorPrompt] = useState(ADVISOR_PROMPTS[0]);
  const [advisorReply, setAdvisorReply] = useState(
    "Use sterile water, note the concentration, then draw the exact units for your protocol.",
  );

  const units = Math.max(1, Math.round((doseMg / (vialMg * 1000)) * waterMl * 100));

  function openTool(id: string) {
    if (id === "lectures" || id === "calculator" || id === "advisor" || id === "profile" || id === "payment") {
      setActiveNav(id);
    } else if (id === "plans" || id === "orders" || id === "card") {
      setActiveNav("payment");
    } else if (id === "account") {
      setActiveNav("profile");
    } else {
      setActiveNav("dashboard");
    }
  }

  function askAdvisor(prompt: string) {
    setAdvisorPrompt(prompt);
    if (prompt.includes("reconstitute")) {
      setAdvisorReply("Add bacteriostatic water slowly down the vial wall. Swirl gently — never shake.");
    } else if (prompt.includes("syringe") || prompt.includes("250")) {
      setAdvisorReply(`At ${vialMg} mg / ${waterMl} mL, 250 mcg is about ${units} units on an insulin syringe.`);
    } else {
      setAdvisorReply("Keep handouts brand-consistent: dose, schedule, storage, and when to contact the clinic.");
    }
  }

  const t = darkMode ? THEME.dark : THEME.light;

  return (
    <div
      ref={innerRef}
      data-hook-dashboard
      data-theme={darkMode ? "dark" : "light"}
      className={cn(
        "pointer-events-auto relative z-20 box-border shrink-0 overflow-hidden rounded-2xl border shadow-[0_24px_60px_-20px_rgba(20,38,68,0.35)]",
        className,
      )}
      style={{
        width: HOOK_PORTAL_SIZE.width,
        height: HOOK_PORTAL_SIZE.height,
        minWidth: HOOK_PORTAL_SIZE.width,
        minHeight: HOOK_PORTAL_SIZE.height,
        maxWidth: HOOK_PORTAL_SIZE.width,
        maxHeight: HOOK_PORTAL_SIZE.height,
        backgroundColor: t.pageBgSolid,
        borderColor: t.shellBorder,
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className="flex h-8 shrink-0 items-center gap-2 border-b px-3"
        style={{ backgroundColor: t.chromeBg, borderColor: t.shellBorder }}
      >
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </span>
        <div
          className="ml-1 flex h-5 min-w-0 flex-1 items-center rounded-md border px-2"
          style={{ borderColor: t.softBorder, backgroundColor: t.chromeUrl }}
        >
          <span className="truncate font-sans text-[9px] font-medium" style={{ color: t.faint }}>
            app.hols.io/{activeNav}
          </span>
        </div>
      </div>

      <div className="flex h-[calc(100%-2rem)] min-h-0 w-full overflow-hidden">
        <aside
          className="flex w-[112px] shrink-0 flex-col border-r p-2"
          style={{ backgroundColor: t.sidebarBg, borderColor: t.sidebarBorder }}
        >
          <div className="mb-2 flex shrink-0 items-center gap-1.5 px-1">
            <Image
              src="/assets/logo/hols-logo-mark.png"
              alt=""
              width={18}
              height={18}
              className="h-3.5 w-3.5 object-contain"
            />
            <span className="font-sans text-[11px] font-bold tracking-wide" style={{ color: t.sidebarText }}>
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
                  className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left font-sans text-[9px] font-semibold transition"
                  style={
                    active
                      ? {
                          backgroundColor: t.sidebarActive,
                          color: t.sidebarText,
                          boxShadow: t.sidebarActiveShadow,
                        }
                      : { color: t.sidebarMuted }
                  }
                  onMouseEnter={(event) => {
                    if (!active) event.currentTarget.style.backgroundColor = t.sidebarHover;
                  }}
                  onMouseLeave={(event) => {
                    if (!active) event.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md"
                    style={
                      active
                        ? { backgroundColor: LIME, color: NAVY, boxShadow: "0 2px 6px rgba(221, 228, 102, 0.38)" }
                        : { color: t.sidebarMuted }
                    }
                  >
                    {NAV_ICONS[item.id]}
                  </span>
                  <span className="truncate leading-none">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div
            className="mt-2 shrink-0 rounded-lg border px-1.5 py-1.5"
            style={{ borderColor: t.sidebarBorder, backgroundColor: t.sidebarFooter }}
          >
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className="flex w-full items-center justify-between gap-1"
              aria-pressed={darkMode}
            >
              <span className="font-sans text-[8px] font-medium" style={{ color: t.sidebarText }}>
                Dark mode
              </span>
              <span
                className="relative h-3.5 w-6 shrink-0 rounded-full border transition"
                style={{
                  backgroundColor: darkMode ? LIME : t.switchOff,
                  borderColor: darkMode ? "transparent" : t.sidebarBorder,
                }}
              >
                <span
                  className={cn(
                    "absolute top-[2px] h-2.5 w-2.5 rounded-full shadow-sm transition",
                    darkMode ? "right-[2px] bg-[#142644]" : "left-[2px] bg-white",
                  )}
                />
              </span>
            </button>
          </div>
        </aside>

        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2.5"
          style={{ background: t.pageBg, backgroundColor: t.pageBgSolid }}
        >
          <div className="mb-2 flex shrink-0 items-center justify-between">
            <p className="font-sans text-[11px] font-bold capitalize" style={{ color: t.text }}>
              {dashboard.nav.find((item) => item.id === activeNav)?.label ?? "Dashboard"}
            </p>
            <span
              className="relative flex h-5 w-5 overflow-hidden rounded-full border"
              style={{ borderColor: t.softBorder }}
            >
              <Image
                src={DEMO_PROFILE.photo}
                alt={DEMO_PROFILE.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </span>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {/* Absolute fill keeps every page the same occupied area */}
            <div className="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeNav === "dashboard" ? (
                <div className="flex h-full flex-col gap-2">
                  <div className="shrink-0 rounded-xl border p-2.5" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                    <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.12em]" style={{ color: t.faint }}>
                      {dashboard.membership.label}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <div>
                        <p className="font-sans text-[15px] font-bold leading-none" style={{ color: t.text }}>
                          {dashboard.membership.plan}
                        </p>
                        <p className="mt-1 font-sans text-[9px] font-medium" style={{ color: t.muted }}>
                          {dashboard.membership.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveNav("payment")}
                        className="rounded-full px-2.5 py-1 font-sans text-[9px] font-bold transition hover:brightness-105"
                        style={{ backgroundColor: LIME, color: TEXT_NAVY }}
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl border p-2.5" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-sans text-[9px] font-bold" style={{ color: t.accent }}>
                        Quick tools
                      </p>
                      <span className="font-sans text-[8px] font-medium" style={{ color: t.accent }}>
                        Tap to explore
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {dashboard.tools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => openTool(tool.id)}
                          className="group flex flex-col items-center gap-1 rounded-lg p-1 transition"
                        >
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full border transition group-hover:border-[#DDE466]/65 group-hover:bg-[#DDE466] group-hover:text-[#152744]"
                            style={{
                              backgroundColor: t.soft,
                              borderColor: t.softBorder,
                              color: t.text,
                            }}
                          >
                            {NAV_ICONS[tool.id]}
                          </span>
                          <span className="font-sans text-[7px] font-semibold" style={{ color: t.muted }}>
                            {tool.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_0.85fr] gap-2">
                    <div className="rounded-xl border p-2.5" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                      <p className="mb-1.5 font-sans text-[9px] font-bold" style={{ color: t.text }}>
                        Recent activity
                      </p>
                      <p className="font-sans text-[9px]" style={{ color: t.muted }}>
                        No orders yet.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl border p-2" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                      {dashboard.actions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => openTool(action.id)}
                          className="flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition hover:bg-white/5"
                          style={{ color: t.muted }}
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
                      style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
                    >
                      <p className="font-sans text-[10px] font-bold" style={{ color: t.text }}>
                        {course.title}
                      </p>
                      <p className="mt-0.5 font-sans text-[8px]" style={{ color: t.muted }}>
                        {course.meta}
                      </p>
                    </button>
                  ))}
                  <div className="min-h-0 flex-1 rounded-xl border border-dashed" style={{ borderColor: t.cardBorder }} />
                </div>
              ) : null}

              {activeNav === "calculator" ? (
                <div className="flex h-full flex-col rounded-xl border p-2.5" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                  <p className="mb-2 shrink-0 font-sans text-[9px] font-bold" style={{ color: t.text }}>
                    Peptide dose helper
                  </p>
                  <label className="mb-2 block shrink-0">
                    <span className="font-sans text-[8px]" style={{ color: t.muted }}>
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
                    <span className="font-sans text-[10px] font-bold" style={{ color: t.text }}>
                      {doseMg} mcg
                    </span>
                  </label>
                  <div className="grid shrink-0 grid-cols-2 gap-2">
                    <label>
                      <span className="font-sans text-[8px]" style={{ color: t.muted }}>
                        Vial (mg)
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={vialMg}
                        onChange={(event) => setVialMg(Math.max(1, Number(event.target.value) || 1))}
                        className="mt-1 w-full rounded-md border bg-transparent px-2 py-1 font-sans text-[10px] outline-none"
                        style={{ borderColor: t.softBorder, color: t.text }}
                      />
                    </label>
                    <label>
                      <span className="font-sans text-[8px]" style={{ color: t.muted }}>
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
                        style={{ borderColor: t.softBorder, color: t.text }}
                      />
                    </label>
                  </div>
                  <div className="min-h-0 flex-1" />
                  <div
                    className="shrink-0 rounded-lg px-2.5 py-2 font-sans text-[10px] font-bold"
                    style={{ backgroundColor: LIME, color: TEXT_NAVY }}
                  >
                    Draw ~{units} units
                  </div>
                </div>
              ) : null}

              {activeNav === "advisor" ? (
                <div className="flex h-full flex-col gap-2">
                  <div className="min-h-0 flex-1 rounded-xl border p-2.5" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                    <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.1em]" style={{ color: t.muted }}>
                      You asked
                    </p>
                    <p className="mt-1 font-sans text-[10px] font-semibold" style={{ color: t.text }}>
                      {advisorPrompt}
                    </p>
                    <p className="mt-2 font-sans text-[9px] leading-relaxed" style={{ color: t.muted }}>
                      {advisorReply}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {ADVISOR_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => askAdvisor(prompt)}
                        className="rounded-full border px-2 py-1 font-sans text-[7px] font-semibold transition hover:brightness-105"
                        style={{
                          borderColor: t.cardBorder,
                          backgroundColor: advisorPrompt === prompt ? LIME : t.cardBg,
                          color: advisorPrompt === prompt ? TEXT_NAVY : t.muted,
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
                      style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}
                    >
                      <span>
                        <span className="block font-sans text-[10px] font-bold" style={{ color: t.text }}>
                          {plan.title}
                        </span>
                        <span className="font-sans text-[8px]" style={{ color: t.muted }}>
                          Full portal access
                        </span>
                      </span>
                      <span
                        className="rounded-md px-2 py-1 font-sans text-[9px] font-bold"
                        style={{ backgroundColor: LIME, color: TEXT_NAVY }}
                      >
                        {plan.price}
                      </span>
                    </button>
                  ))}
                  <div className="min-h-0 flex-1 rounded-xl border border-dashed" style={{ borderColor: t.cardBorder }} />
                </div>
              ) : null}

              {activeNav === "profile" ? (
                <div className="flex h-full flex-col rounded-xl border p-2.5" style={{ backgroundColor: t.cardBg, borderColor: t.cardBorder }}>
                  <div className="mb-2 flex shrink-0 items-center gap-2">
                    <span className="relative flex h-8 w-8 overflow-hidden rounded-full border" style={{ borderColor: t.cardBorder }}>
                      <Image
                        src={DEMO_PROFILE.photo}
                        alt={DEMO_PROFILE.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <div>
                      <p className="font-sans text-[10px] font-bold" style={{ color: t.text }}>
                        {DEMO_PROFILE.name}
                      </p>
                      <p className="font-sans text-[8px]" style={{ color: t.muted }}>
                        {DEMO_PROFILE.role}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      ["Email", DEMO_PROFILE.email],
                      ["Clinic", DEMO_PROFILE.clinic],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg border px-2 py-1.5"
                        style={{ borderColor: t.cardBorder }}
                      >
                        <span className="font-sans text-[8px]" style={{ color: t.muted }}>
                          {label}
                        </span>
                        <span className="font-sans text-[8px] font-semibold" style={{ color: t.text }}>
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
