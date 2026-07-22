"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGSAP } from "@gsap/react";
import { HeroButton } from "@/components/hero/HeroButton";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { brand } from "@/config/brand";
import { heroLayout } from "@/lib/hero-styles";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const HOOK_PATH_SYNC = "hook-path-sync";
const HOOK_ACCENT = brand.colors.accent.lemonLime;
const BLUE = brand.colors.primary.duskBlue;
const GREY = "#C7D6E6";

type LineGroup = "card" | "trunk" | "branch";
type DiagramPath = { id: string; group: LineGroup; d: string };
type DiagramArrow = {
  id: string;
  group: "trunk" | "branch";
  points: string;
  tipX: number;
  tipY: number;
};
type Point = { x: number; y: number };

/* ── Geometry helpers ──────────────────────────────────────────────────── */
function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Card wire that wanders organically toward the sphere and strikes it on a
 * radial approach. Two independently seeded control points give each wire its
 * own random sag/curl so the bundle reads as scattered, not templated.
 */
function buildConvergePath(start: Point, entry: Point, center: Point, seed: number) {
  const dx = entry.x - start.x;
  const dy = entry.y - start.y;
  const dist = Math.hypot(dx, dy) || 1;

  const bendA = seededUnit(seed * 17 + 1) - 0.5;
  const bendB = seededUnit(seed * 29 + 7) - 0.5;
  const swayA = seededUnit(seed * 41 + 13) - 0.5;

  // First control point sits early along the run with a randomised vertical sag.
  const c1x = start.x + dx * (0.28 + bendA * 0.22);
  const c1y = start.y + dy * (0.18 + swayA * 0.2) + bendA * (0.14 * dist);

  // Second control point approaches the sphere along its radius so the wire
  // lands cleanly on the surface, with a random stand-off distance.
  let nx = entry.x - center.x;
  let ny = entry.y - center.y;
  const nlen = Math.hypot(nx, ny) || 1;
  nx /= nlen;
  ny /= nlen;
  const out = 40 + seededUnit(seed * 11 + 3) * 70;

  const c2x = entry.x + nx * out + bendB * 26;
  const c2y = entry.y + ny * out + bendB * 26;

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${entry.x.toFixed(2)} ${entry.y.toFixed(2)}`;
}

/** Perfectly straight line between two anchor points. */
function buildStraightLine(start: Point, end: Point) {
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/** Filled triangle arrowhead; `from` is behind the tip (travel direction). */
function buildArrowPolygon(tip: Point, from: Point, size = 11): string {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const backX = tip.x - ux * size;
  const backY = tip.y - uy * size;
  const wing = size * 0.72;
  return `${tip.x.toFixed(2)},${tip.y.toFixed(2)} ${(backX + px * wing).toFixed(2)},${(backY + py * wing).toFixed(2)} ${(backX - px * wing).toFixed(2)},${(backY - py * wing).toFixed(2)}`;
}

/**
 * Pin the arrowhead to the live tip of a stroke-dash draw.
 * Hidden until the stem has started; travels with the growing tip (never static ahead).
 */
function syncArrowToLine(line: SVGPathElement | undefined, arrow: SVGPolygonElement | undefined, size = 11) {
  if (!line || !arrow) return;
  const length = line.getTotalLength();
  if (length <= 0) {
    arrow.setAttribute("opacity", "0");
    return;
  }
  const raw = gsap.getProperty(line, "strokeDashoffset");
  const dashoffset = typeof raw === "number" ? raw : parseFloat(String(raw)) || 0;
  const drawn = Math.min(length, Math.max(0, length - dashoffset));
  const progress = drawn / length;

  if (progress < 0.03) {
    arrow.setAttribute("opacity", "0");
    return;
  }

  const tip = line.getPointAtLength(drawn);
  const back = line.getPointAtLength(Math.max(0, drawn - 2));
  const from =
    Math.hypot(tip.x - back.x, tip.y - back.y) > 0.1 ? back : { x: tip.x - 1, y: tip.y };
  arrow.setAttribute("points", buildArrowPolygon(tip, from, size));
  arrow.setAttribute("opacity", "1");
}

/** Gap before target border so tip + arrow sit in open space (not under chrome). */
const ARROW_CLEAR_PX = 14;

function buildDiagramGeometry(
  cardRects: DOMRect[],
  ballRect: DOMRect,
  dashRect: DOMRect | null,
  ctaRect: DOMRect | null,
  svgRect: DOMRect,
): { paths: DiagramPath[]; arrows: DiagramArrow[] } {
  if (svgRect.width <= 0 || svgRect.height <= 0 || !ballRect.width) {
    return { paths: [], arrows: [] };
  }

  const toSvg = (x: number, y: number): Point => ({
    x: x - svgRect.left,
    y: y - svgRect.top,
  });

  const ballCX = ballRect.left + ballRect.width / 2;
  const ballCY = ballRect.top + ballRect.height / 2;
  const center = toSvg(ballCX, ballCY);
  const rx = (ballRect.width / 2) * 0.92;
  const ry = (ballRect.height / 2) * 0.92;

  const paths: DiagramPath[] = [];
  const arrows: DiagramArrow[] = [];
  const count = cardRects.length;

  cardRects.forEach((rect, i) => {
    const start = toSvg(rect.right, rect.top + rect.height / 2);
    const t = count > 1 ? i / (count - 1) : 0.5;
    const jitter = seededUnit(i * 13 + 5) - 0.5;
    const angleDeg = 128 + t * 104 + jitter * 10;
    const angle = (angleDeg * Math.PI) / 180;
    const entry: Point = {
      x: center.x + Math.cos(angle) * rx,
      y: center.y + Math.sin(angle) * ry,
    };
    paths.push({ id: `card-${i}`, group: "card", d: buildConvergePath(start, entry, center, i + 1) });
  });

  // Stem only — arrowhead travels with the stroke tip via syncArrowToLine.
  if (dashRect && dashRect.width) {
    const flowY = ballCY;
    const start = toSvg(ballCX, flowY);
    const trunkTip = toSvg(dashRect.left - ARROW_CLEAR_PX, flowY);
    paths.push({ id: "trunk", group: "trunk", d: buildStraightLine(start, trunkTip) });
    arrows.push({
      id: "trunk-arrow",
      group: "trunk",
      points: buildArrowPolygon(trunkTip, start),
      tipX: trunkTip.x,
      tipY: trunkTip.y,
    });

    if (ctaRect && ctaRect.width) {
      const bStart = toSvg(dashRect.right, flowY);
      const branchTip = toSvg(ctaRect.left - ARROW_CLEAR_PX, flowY);
      paths.push({ id: "branch", group: "branch", d: buildStraightLine(bStart, branchTip) });
      arrows.push({
        id: "branch-arrow",
        group: "branch",
        points: buildArrowPolygon(branchTip, bStart),
        tipX: branchTip.x,
        tipY: branchTip.y,
      });
    }
  }

  return { paths, arrows };
}

function prepareStroke(path: SVGPathElement, hidden: boolean) {
  const length = path.getTotalLength();
  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: hidden ? length : 0,
  });
}

function resyncPathStroke(path: SVGPathElement) {
  const dasharray = gsap.getProperty(path, "strokeDasharray");
  const dashoffset = gsap.getProperty(path, "strokeDashoffset");
  const length = path.getTotalLength();
  const oldLen = parseFloat(String(dasharray).split(" ")[0] || "0") || length;
  let drawRatio = 0;
  if (oldLen > 0 && typeof dashoffset === "number") drawRatio = 1 - dashoffset / oldLen;
  drawRatio = Math.min(1, Math.max(0, drawRatio));
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length * (1 - drawRatio) });
}

/* ── Scattered source-card icons ───────────────────────────────────────── */
const CARD_ICONS: Record<string, ReactNode> = {
  pdfs: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M8 3h6l4 4v14H6V5" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15V9l5.2 3Z" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="5" y="4" width="14" height="16" rx="2" strokeLinejoin="round" />
      <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  ),
  articles: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="4" y="5" width="16" height="14" rx="2" strokeLinejoin="round" />
      <path d="M8 9h5M8 13h8M8 16h6" strokeLinecap="round" />
    </svg>
  ),
  aichats: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 6h11a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9l-4 3v-3H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M7 10h.01M10 10h.01M13 10h.01" strokeLinecap="round" />
    </svg>
  ),
  books: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H11v16H6.5A1.5 1.5 0 0 1 5 18.5ZM19 5.5A1.5 1.5 0 0 0 17.5 4H13v16h4.5A1.5 1.5 0 0 0 19 18.5Z" strokeLinejoin="round" />
    </svg>
  ),
  podcasts: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" strokeLinecap="round" />
    </svg>
  ),
  blogs: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" strokeLinecap="round" />
    </svg>
  ),
};

const CARD_COLORS: Record<string, string> = {
  pdfs: "#EF4444",
  youtube: "#FF0000",
  notes: "#F59E0B",
  articles: "#3B82F6",
  aichats: "#8B5CF6",
  books: "#22C55E",
  podcasts: "#A855F7",
  blogs: "#0EA5E9",
};

/* Absolute placement (in %) for the scattered cards, echoing the image.
   Spread across the column in a loose, organic scatter without overflow. */
const CARD_LAYOUT: Record<string, { top: string; left: string }> = {
  pdfs: { top: "7%", left: "34%" },
  youtube: { top: "22%", left: "4%" },
  notes: { top: "34%", left: "52%" },
  articles: { top: "48%", left: "2%" },
  aichats: { top: "58%", left: "46%" },
  books: { top: "72%", left: "20%" },
  podcasts: { top: "90%", left: "6%" },
  blogs: { top: "92%", left: "50%" },
};

function ScatteredCard({
  id,
  title,
  cardRef,
}: {
  id: string;
  title: string;
  cardRef?: (node: HTMLElement | null) => void;
}) {
  const color = CARD_COLORS[id] ?? BLUE;
  const pos = CARD_LAYOUT[id] ?? { top: "50%", left: "50%" };

  return (
    <article
      ref={cardRef}
      data-hook-card
      className="absolute inline-flex -translate-y-1/2 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2 shadow-[0_10px_30px_-12px_rgba(21,39,68,0.35)]"
      style={{ top: pos.top, left: pos.left }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        {CARD_ICONS[id]}
      </span>
      <span className="whitespace-nowrap font-sans text-[13px] font-semibold leading-none text-primary">
        {title}
      </span>
    </article>
  );
}

/* ── Center HOLS ball ──────────────────────────────────────────────────── */
/** Labels hang below out of flow so the ball itself stays on the flow axis. */
function HolsBall({ innerRef }: { innerRef?: (node: HTMLDivElement | null) => void }) {
  const { hook } = landingContent;
  return (
    <div data-hook-hub className="relative flex flex-col items-center">
      <div
        ref={innerRef}
        data-hook-ball
        className="relative z-10 flex aspect-square w-[120px] items-center justify-center sm:w-[140px] md:w-[160px]"
      >
        <div
          aria-hidden
          className="absolute inset-[-20%] rounded-full bg-[radial-gradient(circle,rgba(141,195,225,0.45)_0%,rgba(141,195,225,0)_70%)] blur-xl"
        />
        <Image
          src="/assets/ball/ball.png"
          alt=""
          width={480}
          height={480}
          className="relative z-10 h-full w-full object-contain"
          sizes="160px"
          priority
        />
      </div>
      <div className="pointer-events-none absolute top-full left-1/2 mt-3 w-max -translate-x-1/2 text-center">
        <p className="font-sans text-lg font-bold tracking-[0.04em] text-primary">{hook.hubLabel}</p>
        <p className="mt-0.5 font-sans text-xs font-medium text-primary/50">{hook.systemLabel}</p>
      </div>
    </div>
  );
}

/* ── Dashboard (custom HOLS portal mock — no screenshot image) ─────────── */
const DASH_NAV_ICONS: Record<string, ReactNode> = {
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
  plans: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.9L12 14.2 7.7 16.5l.8-4.9L5 8.2l4.8-.7Z" strokeLinejoin="round" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 14h4" strokeLinecap="round" />
    </svg>
  ),
  account: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden className="h-3 w-3">
      <circle cx="12" cy="9" r="3.2" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
    </svg>
  ),
};

const DASH_NAVY = "#0B1F3A";
const DASH_PANEL = "#122845";
const DASH_PANEL_2 = "#163052";
const DASH_LIME = HOOK_ACCENT;

function DashboardMockup({ innerRef }: { innerRef?: (node: HTMLDivElement | null) => void }) {
  const { dashboard } = landingContent.hook;

  return (
    <div
      ref={innerRef}
      data-hook-dashboard
      className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_60px_-20px_rgba(11,31,58,0.65)] xl:max-w-[440px]"
      style={{ backgroundColor: DASH_NAVY }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2" style={{ backgroundColor: DASH_PANEL }}>
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </span>
        <div className="ml-1 flex h-5 flex-1 items-center rounded-md border border-white/10 bg-black/20 px-2">
          <span className="font-sans text-[9px] font-medium text-white/35">app.hols.io/dashboard</span>
        </div>
      </div>

      <div className="flex min-h-[220px]">
        {/* Sidebar */}
        <aside className="flex w-[28%] shrink-0 flex-col border-r border-white/10 p-2.5" style={{ backgroundColor: DASH_PANEL }}>
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <Image
              src="/assets/logo/hols-logo-mark.png"
              alt=""
              width={18}
              height={18}
              className="h-3.5 w-3.5 object-contain"
            />
            <span className="font-sans text-[11px] font-bold tracking-wide text-white">{dashboard.brand}</span>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5">
            {dashboard.nav.map((item, i) => (
              <span
                key={item.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-1.5 py-1.5 font-sans text-[9px] font-semibold",
                  i === 0 ? "text-[#0B1F3A]" : "text-white/55",
                )}
                style={i === 0 ? { backgroundColor: DASH_LIME } : undefined}
              >
                <span className={i === 0 ? "text-[#0B1F3A]" : "text-white/45"}>{DASH_NAV_ICONS[item.id]}</span>
                <span className="truncate leading-none">{item.label}</span>
              </span>
            ))}
          </nav>
          <div className="mt-2 border-t border-white/10 pt-2">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="font-sans text-[8px] font-medium text-white/40">Dark mode</span>
              <span className="relative h-3 w-5 rounded-full" style={{ backgroundColor: DASH_LIME }}>
                <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-[#0B1F3A]" />
              </span>
            </div>
            <span className="flex items-center gap-1.5 px-1.5 py-1 font-sans text-[9px] font-medium text-white/45">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-3 w-3" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Log out
            </span>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[11px] font-bold text-white">Dashboard</p>
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-[#0B1F3A]" style={{ backgroundColor: DASH_LIME }}>
              MH
            </span>
          </div>

          {/* Membership status */}
          <div className="rounded-xl border border-white/10 p-2.5" style={{ backgroundColor: DASH_PANEL_2 }}>
            <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.12em] text-white/40">
              {dashboard.membership.label}
            </p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <div>
                <p className="font-sans text-[15px] font-bold leading-none text-white">{dashboard.membership.plan}</p>
                <p className="mt-1 font-sans text-[9px] font-medium text-white/45">{dashboard.membership.status}</p>
              </div>
              <span
                className="rounded-md px-2 py-1 font-sans text-[9px] font-bold text-[#0B1F3A]"
                style={{ backgroundColor: DASH_LIME }}
              >
                Upgrade
              </span>
            </div>
            <div className="mt-2 flex gap-1.5">
              <span className="rounded-md bg-white/10 px-2 py-1 font-sans text-[8px] font-semibold text-white/70">Orders</span>
              <span className="rounded-md bg-white/10 px-2 py-1 font-sans text-[8px] font-semibold text-white/70">Card</span>
            </div>
          </div>

          {/* Quick tools */}
          <div className="rounded-xl border border-white/10 p-2.5" style={{ backgroundColor: DASH_PANEL_2 }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-sans text-[9px] font-bold text-white">Quick tools</p>
              <span className="font-sans text-[8px] font-medium text-white/35">View all</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {dashboard.tools.map((tool) => (
                <div key={tool.id} className="flex flex-col items-center gap-1">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#0B1F3A]"
                    style={{ backgroundColor: `${DASH_LIME}CC` }}
                  >
                    {DASH_NAV_ICONS[tool.id]}
                  </span>
                  <span className="font-sans text-[7px] font-semibold text-white/55">{tool.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent + side actions row */}
          <div className="grid grid-cols-[1.15fr_0.85fr] gap-2">
            <div className="rounded-xl border border-white/10 p-2.5" style={{ backgroundColor: DASH_PANEL_2 }}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="font-sans text-[9px] font-bold text-white">Recent activity</p>
                <span className="font-sans text-[8px] font-medium text-white/35">View all</span>
              </div>
              <p className="font-sans text-[9px] text-white/40">No orders yet.</p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-white/10 p-2" style={{ backgroundColor: DASH_PANEL_2 }}>
              {dashboard.actions.map((action) => (
                <span key={action.id} className="flex items-center gap-1.5 text-white/55">
                  <span className="text-white/40">{DASH_NAV_ICONS[action.id]}</span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[7px] font-semibold">{action.label}</span>
                  {"badge" in action && action.badge ? (
                    <span className="rounded bg-white/10 px-1 font-sans text-[7px] text-white/50">{action.badge}</span>
                  ) : null}
                </span>
              ))}
              <span
                className="mt-0.5 rounded-md py-1 text-center font-sans text-[8px] font-bold text-[#0B1F3A]"
                style={{ backgroundColor: DASH_LIME }}
              >
                Upgrade plan
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Title + description (copy unchanged; left-aligned like Pillars) ───── */
function HookCopy() {
  const { hook } = landingContent;
  return (
    <div data-hook-copy className="w-full max-w-3xl text-left lg:max-w-4xl">
      <h2 className="font-sans text-[1.875rem] font-bold leading-[1.05] tracking-[0.01em] text-primary sm:text-[2.25rem] md:text-[3.75rem]">
        <span>{hook.beforeLabel}</span>
        <span className="text-accent" style={{ color: HOOK_ACCENT }}>
          {" "}
          becomes{" "}
        </span>
        <span>{hook.afterLabel}</span>
        <span>.</span>
      </h2>
      <p className="text-brand-body mt-4 max-w-xl text-primary/75 md:mt-5">{hook.solution}</p>
    </div>
  );
}

/* ── Flow diagram (measured lines + labelled columns) ──────────────────── */
function FlowDiagram({ onPathsReady }: { onPathsReady?: () => void }) {
  const { hook } = landingContent;
  const diagramRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);
  const dashRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [paths, setPaths] = useState<DiagramPath[]>([]);
  const [arrows, setArrows] = useState<DiagramArrow[]>([]);
  const [viewBox, setViewBox] = useState("0 0 1000 600");

  const syncPaths = useCallback(() => {
    const diagram = diagramRef.current;
    const svg = svgRef.current;
    const ball = ballRef.current;
    if (!diagram || !svg || !ball) return;

    const svgRect = svg.getBoundingClientRect();
    if (svgRect.width <= 0) return;

    const cardRects = cardRefs.current
      .filter((c): c is HTMLElement => Boolean(c))
      .map((c) => c.getBoundingClientRect());
    const ballRect = ball.getBoundingClientRect();
    const dashRect = dashRef.current?.getBoundingClientRect() ?? null;
    const ctaRect = ctaRef.current?.getBoundingClientRect() ?? null;

    const next = buildDiagramGeometry(cardRects, ballRect, dashRect, ctaRect, svgRect);
    setViewBox(`0 0 ${svgRect.width.toFixed(1)} ${svgRect.height.toFixed(1)}`);
    setPaths((cur) => (JSON.stringify(cur) === JSON.stringify(next.paths) ? cur : next.paths));
    setArrows((cur) => (JSON.stringify(cur) === JSON.stringify(next.arrows) ? cur : next.arrows));
  }, []);

  // Signal readiness once paths exist (do not re-fire on every geometry tweak).
  useEffect(() => {
    if (paths.length > 0) onPathsReady?.();
  }, [paths.length, onPathsReady]);

  const setCardRef = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      cardRefs.current[index] = node;
      if (node) requestAnimationFrame(syncPaths);
    },
    [syncPaths],
  );

  useLayoutEffect(() => {
    window.dispatchEvent(new Event(HOOK_PATH_SYNC));
  }, [paths, arrows]);

  useLayoutEffect(() => {
    syncPaths();
    const diagram = diagramRef.current;
    if (!diagram) return;

    const observer = new ResizeObserver(syncPaths);
    observer.observe(diagram);
    if (ballRef.current) observer.observe(ballRef.current);
    if (dashRef.current) observer.observe(dashRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);
    cardRefs.current.forEach((c) => c && observer.observe(c));

    window.addEventListener("resize", syncPaths);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncPaths);
    };
  }, [syncPaths]);

  return (
    <div ref={diagramRef} className="relative flex h-full min-h-0 w-full flex-col">
      <svg
        ref={svgRef}
        aria-hidden
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="hook-card-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={GREY} stopOpacity="0.4" />
            <stop offset="100%" stopColor={GREY} stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {paths.map((path) => {
          if (path.group === "card") {
            return (
              <path
                key={path.id}
                data-hook-line
                data-group="card"
                d={path.d}
                stroke="url(#hook-card-gradient)"
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            );
          }
          return (
            <path
              key={path.id}
              data-hook-line
              data-group={path.group}
              d={path.d}
              stroke={BLUE}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.9}
            />
          );
        })}

        {/* Arrowheads ride the stroke tip — opacity/points driven by syncArrowToLine. */}
        {arrows.map((arrow) => (
          <polygon
            key={arrow.id}
            data-hook-arrow
            data-group={arrow.group}
            points={arrow.points}
            fill={BLUE}
            opacity={0}
          />
        ))}
      </svg>

      {/* Column labels aligned to their columns across full width */}
      <div className="relative z-10 mb-3 grid w-full grid-cols-[minmax(16rem,20rem)_minmax(8rem,1fr)_auto_minmax(6rem,1fr)_auto_minmax(4rem,0.7fr)_auto] items-end gap-x-2 xl:grid-cols-[minmax(18rem,22rem)_minmax(10rem,1.2fr)_auto_minmax(8rem,1fr)_auto_minmax(5rem,0.8fr)_auto] xl:gap-x-3">
        <p
          data-hook-scatter-label
          className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-primary/70 sm:text-sm"
        >
          {hook.scatteredLabel}
        </p>
        <div aria-hidden />
        <div aria-hidden className="w-[120px] sm:w-[140px] md:w-[160px]" />
        <div aria-hidden />
        <p
          data-hook-struct-label
          className="w-[min(100%,400px)] font-sans text-xs font-bold uppercase tracking-[0.14em] text-primary/70 xl:w-[440px] sm:text-sm"
        >
          {hook.structuredLabel}
        </p>
        <div aria-hidden />
        <div aria-hidden className="w-[9.5rem]" />
      </div>

      {/* Full-width flow: cards · gap · ball · gap · dashboard · gap · CTA.
          items-center keeps ball center, dashboard mid, and CTA mid on one Y axis. */}
      <div className="relative z-10 grid min-h-0 w-full flex-1 grid-cols-[minmax(16rem,20rem)_minmax(8rem,1fr)_auto_minmax(6rem,1fr)_auto_minmax(4rem,0.7fr)_auto] items-center gap-x-2 xl:grid-cols-[minmax(18rem,22rem)_minmax(10rem,1.2fr)_auto_minmax(8rem,1fr)_auto_minmax(5rem,0.8fr)_auto] xl:gap-x-3">
        {/* 1 · Scattered cards (left edge) */}
        <div className="relative h-full min-h-[280px] w-full">
          {hook.sourceCards.map((card, i) => (
            <ScatteredCard key={card.id} id={card.id} title={card.title} cardRef={setCardRef(i)} />
          ))}
        </div>

        {/* 2 · Flexible gap for card → ball lines */}
        <div aria-hidden className="h-full w-full" />

        {/* 3 · HOLS ball — geometric center is the trunk origin */}
        <div className="relative z-10 shrink-0 self-center">
          <HolsBall innerRef={(n) => (ballRef.current = n)} />
        </div>

        {/* 4 · Flexible gap for ball → dashboard line */}
        <div aria-hidden className="h-full w-full" />

        {/* 5 · Dashboard — left/right borders are trunk/branch anchors */}
        <div className="relative z-10 shrink-0 self-center">
          <DashboardMockup innerRef={(n) => (dashRef.current = n)} />
        </div>

        {/* 6 · Flexible gap for dashboard → CTA line */}
        <div aria-hidden className="h-full w-full" />

        {/* 7 · Explore Courses — mid-Y locked to the same flow axis as the ball */}
        <div
          ref={ctaRef}
          data-hook-cta
          className="pointer-events-auto relative z-10 shrink-0 justify-self-end self-center"
        >
          <HeroButton href={hook.cta.href} variant="primary" className="whitespace-nowrap px-6 md:px-8">
            {hook.cta.label}
          </HeroButton>
        </div>
      </div>
    </div>
  );
}

/* ── Static (mobile / reduced motion) fallback ─────────────────────────── */
function StaticArrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 24" fill="none" className={cn("text-[#3853A4]", className)}>
      <path d="M2 12h54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HookStatic() {
  const { hook } = landingContent;
  return (
    <div className="w-full py-12 md:py-14 lg:py-16">
      <div className={cn("flex w-full flex-col", heroLayout.gutterX)}>
        <HookCopy />
        <div className="mt-10 flex flex-col items-start gap-6">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-primary/70 sm:text-sm">
            {hook.scatteredLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {hook.sourceCards.map((card) => (
              <span
                key={card.id}
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 py-2 shadow-sm"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${CARD_COLORS[card.id]}1A`, color: CARD_COLORS[card.id] }}
                >
                  {CARD_ICONS[card.id]}
                </span>
                <span className="text-[13px] font-semibold text-primary">{card.title}</span>
              </span>
            ))}
          </div>
          <StaticArrow className="h-5 w-10 rotate-90 self-start" />
          <HolsBall />
          <StaticArrow className="h-5 w-10 rotate-90 self-start" />
          <p className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-primary/70 sm:text-sm">
            {hook.structuredLabel}
          </p>
          <DashboardMockup />
          <StaticArrow className="h-5 w-10 rotate-90 self-start" />
          <HeroButton href={hook.cta.href} variant="primary" className="px-8">
            {hook.cta.label}
          </HeroButton>
        </div>
      </div>
    </div>
  );
}

export function HookSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [diagramReady, setDiagramReady] = useState(false);
  const markDiagramReady = useCallback(() => setDiagramReady(true), []);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  const hookScrollDistance = () => window.innerHeight * 2.4;

  // Single pin — same pattern as the previously working HookSection.
  // pinWrap MUST be the direct (visible) child of section or pinSpacing
  // breaks and subsequent landing sections lose their ScrollTriggers.
  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const section = sectionRef.current;
      const pinWrap = pinWrapRef.current;
      if (!section || !pinWrap) return;

      const pinTrigger = ScrollTrigger.create({
        id: "hook-pin",
        trigger: section,
        start: "top top",
        end: () => `+=${hookScrollDistance()}`,
        pin: pinWrap,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        pinTrigger.kill();
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  useGSAP(
    () => {
      if (reduceMotion || !diagramReady) return;

      registerGsap();

      const section = sectionRef.current;
      const pinWrap = pinWrapRef.current;
      if (!section || !pinWrap) return;

      const q = <T extends Element>(sel: string) =>
        gsap.utils.toArray<T>(pinWrap.querySelectorAll(sel));

      const cards = q<HTMLElement>("[data-hook-card]");
      const cardLines = q<SVGPathElement>('[data-hook-line][data-group="card"]');
      const trunkLines = q<SVGPathElement>('[data-hook-line][data-group="trunk"]');
      const branchLines = q<SVGPathElement>('[data-hook-line][data-group="branch"]');
      const trunkArrows = q<SVGPolygonElement>('[data-hook-arrow][data-group="trunk"]');
      const branchArrows = q<SVGPolygonElement>('[data-hook-arrow][data-group="branch"]');
      const hub = q<HTMLElement>("[data-hook-hub]");
      const dashboard = q<HTMLElement>("[data-hook-dashboard]");
      const scatterLabel = q<HTMLElement>("[data-hook-scatter-label]");
      const structLabel = q<HTMLElement>("[data-hook-struct-label]");
      const cta = q<HTMLElement>("[data-hook-cta]");
      const allLines = [...cardLines, ...trunkLines, ...branchLines];
      const allArrows = [...trunkArrows, ...branchArrows];

      // Desktop-only scroll animation; mobile shows everything statically.
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!isDesktop || cards.length === 0) {
        gsap.set([cards, hub, dashboard, scatterLabel, structLabel, cta], {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          yPercent: 0,
        });
        allLines.forEach((p) => prepareStroke(p, false));
        syncArrowToLine(trunkLines[0], trunkArrows[0]);
        syncArrowToLine(branchLines[0], branchArrows[0]);
        return;
      }

      allLines.forEach((p) => prepareStroke(p, true));
      // Arrows start hidden; syncArrowToLine reveals + moves them with the stroke tip.
      allArrows.forEach((arrow) => arrow.setAttribute("opacity", "0"));
      gsap.set(cards, { autoAlpha: 0, y: 14, yPercent: -50 });
      gsap.set(scatterLabel, { autoAlpha: 0, y: 8 });
      gsap.set(structLabel, { autoAlpha: 0, y: 8 });
      gsap.set(hub, { autoAlpha: 0, scale: 0.9 });
      gsap.set(dashboard, { autoAlpha: 0, y: 16, scale: 0.97 });
      gsap.set(cta, { autoAlpha: 0, y: 12 });

      const syncTrunkArrow = () => syncArrowToLine(trunkLines[0], trunkArrows[0]);
      const syncBranchArrow = () => syncArrowToLine(branchLines[0], branchArrows[0]);
      const syncAllArrows = () => {
        syncTrunkArrow();
        syncBranchArrow();
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "hook-timeline",
          trigger: section,
          start: "top top",
          end: () => `+=${hookScrollDistance()}`,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
        onUpdate: syncAllArrows,
      });

      tl.to(scatterLabel, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.0);
      cards.forEach((card, i) => {
        tl.to(card, { autoAlpha: 1, y: 0, duration: 0.3, ease: "none" }, 0.15 + i * 0.07);
      });
      cardLines.forEach((p, i) => {
        tl.to(p, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, 0.85 + i * 0.05);
      });
      tl.to(hub, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "none" }, 1.25);

      // Line draws; arrowhead rides the growing tip (moves with the stroke).
      tl.to(trunkLines, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, 1.6);
      tl.to(structLabel, { autoAlpha: 1, y: 0, duration: 0.3 }, 2.0);
      tl.to(dashboard, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "none" }, 2.05);

      tl.to(branchLines, { strokeDashoffset: 0, duration: 0.6, ease: "none" }, 2.5);
      tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.4, ease: "none" }, 2.9);
      tl.to({}, { duration: 0.45 });

      const onSync = () => {
        allLines.forEach(resyncPathStroke);
        syncAllArrows();
      };
      window.addEventListener(HOOK_PATH_SYNC, onSync);
      requestAnimationFrame(() => {
        onSync();
        ScrollTrigger.refresh();
      });

      return () => {
        window.removeEventListener(HOOK_PATH_SYNC, onSync);
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion, diagramReady] },
  );

  if (reduceMotion) return <HookStatic />;

  return (
    <section ref={sectionRef} id="problem" className="relative z-10 bg-white">
      <div
        ref={pinWrapRef}
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white"
      >
        <div className={cn("flex w-full shrink-0 flex-col pt-8 md:pt-10 xl:pt-12", heroLayout.gutterX)}>
          <HookCopy />
        </div>

        <div className={cn("mt-4 flex min-h-0 w-full flex-1 flex-col pb-6 md:mt-6", heroLayout.gutterX)}>
          <FlowDiagram onPathsReady={markDiagramReady} />
        </div>
      </div>
    </section>
  );
}
