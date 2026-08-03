"use client";

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
import {
  CirclePlay,
  FileText,
  Globe,
  Icon,
  Library,
  MessageSquare,
  Mic,
  Newspaper,
  NotebookPen,
} from "@/components/icons";
import { HookHolsBall } from "@/components/landing/HookHolsBall";
import {
  HookInteractiveDashboard,
  HookPortalShell,
  HOOK_PORTAL_SIZE,
} from "@/components/landing/HookInteractiveDashboard";
import {
  HookScatteredCard,
  HookScatteredCardInline,
} from "@/components/landing/HookScatteredCard";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { brand } from "@/config/brand";
import { heroLayout } from "@/lib/hero-styles";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const HOOK_PATH_SYNC = "hook-path-sync";
/** Toggle dashboard mock; ball → CTA when false (see landingContent.hook.showDashboard). */
const HOOK_SHOW_DASHBOARD = landingContent.hook.showDashboard ?? true;
/** Diagram strokes + struct capsule + title "becomes" */
const HOOK_LINE = brand.colors.primary.duskBlue;
const BLUE = brand.colors.primary.duskBlue;
/** Match PillarsSection surface */
const HOOK_BG = "#E5E5E5";
/** Card wires terminate inside the visible sphere so the ball layer masks the tips. */
const BALL_ENTRY_RATIO = 0.52;
/** Trunk wires leave from the visible right edge of the sphere. */
const BALL_EXIT_RATIO = 0.685;

const HOOK_CAPSULE_BASE =
  "inline-flex max-w-full items-center justify-center rounded-full px-3.5 py-1.5 text-center font-sans text-[10px] font-bold uppercase tracking-[0.12em] sm:px-4 sm:py-2 sm:text-xs";
/**
 * Both Hook capsules — frosted glass (same family as What You Get / heroGlassPanel).
 * Uses `glass-capsule` (light-surface glass + dark text) rather than
 * `glass-capsule-overlay` / accent / solid duskBlue fills.
 */
const HOOK_CAPSULE_CLASS = cn(HOOK_CAPSULE_BASE, "glass-capsule text-primary");

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

function ballEntryRadius(ballRect: DOMRect) {
  return (ballRect.width / 2) * BALL_ENTRY_RATIO;
}

function ballExitRadius(ballRect: DOMRect) {
  return (ballRect.width / 2) * BALL_EXIT_RATIO;
}

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

/** Pin the arrowhead to the path terminal — target stays put while the stem updates. */
function syncArrowToLineEnd(line: SVGPathElement | undefined, arrow: SVGPolygonElement | undefined, size = 11) {
  if (!line || !arrow) return;
  const length = line.getTotalLength();
  if (length <= 0) {
    arrow.setAttribute("opacity", "0");
    return;
  }
  const raw = gsap.getProperty(line, "strokeDashoffset");
  const dashoffset = typeof raw === "number" ? raw : parseFloat(String(raw)) || 0;
  const drawn = Math.min(length, Math.max(0, length - dashoffset));
  if (drawn / length < 0.03) {
    arrow.setAttribute("opacity", "0");
    return;
  }

  const tip = line.getPointAtLength(length);
  const back = line.getPointAtLength(Math.max(0, length - 2));
  const from =
    Math.hypot(tip.x - back.x, tip.y - back.y) > 0.1 ? back : { x: tip.x - 1, y: tip.y };
  arrow.setAttribute("points", buildArrowPolygon(tip, from, size));
  arrow.setAttribute("opacity", "1");
}

function isLineFullyDrawn(line: SVGPathElement) {
  const length = line.getTotalLength();
  if (length <= 0) return false;
  const raw = gsap.getProperty(line, "strokeDashoffset");
  const dashoffset = typeof raw === "number" ? raw : parseFloat(String(raw)) || 0;
  return dashoffset / length < 0.01;
}

function syncTrunkArrow(line: SVGPathElement | undefined, arrow: SVGPolygonElement | undefined) {
  if (!line || !arrow) return;
  if (isLineFullyDrawn(line)) syncArrowToLineEnd(line, arrow);
  else syncArrowToLine(line, arrow);
}

/** Gap before target border so tip + arrow sit in open space (not under chrome). Desktop only. */
const ARROW_CLEAR_PX = 14;
const MOBILE_ARROW_CLEAR_PX = 18;
/** Space between struct capsule bottom and the short trunk stem (mobile). */
const MOBILE_TRUNK_AFTER_LABEL_PX = 10;
/** Space below dashboard before the branch stem starts (mobile). */
const MOBILE_BRANCH_AFTER_DASH_PX = 10;

/** Layout box for the portal — prefer the shell (no GSAP scale on the dashboard). */
function getPortalLayoutRect(dashEl: HTMLElement | null): DOMRect | null {
  if (!dashEl) return null;
  const shell = dashEl.closest<HTMLElement>("[data-hook-portal-shell]");
  if (!shell) return dashEl.getBoundingClientRect();
  // Mobile responsive: visual box is the CSS-scaled wrapper (origin top-left).
  const scaled = shell.querySelector<HTMLElement>("[data-hook-portal-scale]");
  if (scaled) return scaled.getBoundingClientRect();
  // Desktop: shell is the exact resting slot (immune to GSAP scale on the child).
  return shell.getBoundingClientRect();
}

/** Prefer the real CTA control box over the animated wrapper. */
function getCtaLayoutRect(ctaEl: HTMLElement | null): DOMRect | null {
  if (!ctaEl) return null;
  const btn = ctaEl.querySelector<HTMLElement>("a, button");
  return (btn ?? ctaEl).getBoundingClientRect();
}

/** Surface point on the ball facing toward a target in viewport space. */
function ballExitPoint(ballCX: number, ballCY: number, exitR: number, targetX: number, targetY: number): Point {
  const dx = targetX - ballCX;
  const dy = targetY - ballCY;
  const dist = Math.hypot(dx, dy) || 1;
  return {
    x: ballCX + (dx / dist) * exitR,
    y: ballCY + (dy / dist) * exitR,
  };
}

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
  const entryR = ballEntryRadius(ballRect);
  const exitR = ballExitRadius(ballRect);

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
      x: center.x + Math.cos(angle) * entryR,
      y: center.y + Math.sin(angle) * entryR,
    };
    paths.push({ id: `card-${i}`, group: "card", d: buildConvergePath(start, entry, center, i + 1) });
  });

  // Stem only — arrowhead travels with the stroke tip via syncArrowToLine.
  if (dashRect && dashRect.width) {
    const dashCY = dashRect.top + dashRect.height / 2;
    const trunkTipX = dashRect.left - ARROW_CLEAR_PX;
    const exit = ballExitPoint(ballCX, ballCY, exitR, trunkTipX, dashCY);
    const start = toSvg(exit.x, exit.y);
    const trunkTip = toSvg(trunkTipX, dashCY);
    paths.push({ id: "trunk", group: "trunk", d: buildStraightLine(start, trunkTip) });
    arrows.push({
      id: "trunk-arrow",
      group: "trunk",
      points: buildArrowPolygon(trunkTip, start),
      tipX: trunkTip.x,
      tipY: trunkTip.y,
    });

    if (ctaRect && ctaRect.width) {
      const ctaCY = ctaRect.top + ctaRect.height / 2;
      const branchTipX = ctaRect.left - ARROW_CLEAR_PX;
      const bStart = toSvg(dashRect.right, dashCY);
      const branchTip = toSvg(branchTipX, ctaCY);
      paths.push({ id: "branch", group: "branch", d: buildStraightLine(bStart, branchTip) });
      arrows.push({
        id: "branch-arrow",
        group: "branch",
        points: buildArrowPolygon(branchTip, bStart),
        tipX: branchTip.x,
        tipY: branchTip.y,
      });
    }
  } else if (ctaRect && ctaRect.width) {
    const ctaCY = ctaRect.top + ctaRect.height / 2;
    const trunkTipX = ctaRect.left - ARROW_CLEAR_PX;
    const exit = ballExitPoint(ballCX, ballCY, exitR, trunkTipX, ctaCY);
    const start = toSvg(exit.x, exit.y);
    const trunkTip = toSvg(trunkTipX, ctaCY);
    paths.push({ id: "trunk", group: "trunk", d: buildStraightLine(start, trunkTip) });
    arrows.push({
      id: "trunk-arrow",
      group: "trunk",
      points: buildArrowPolygon(trunkTip, start),
      tipX: trunkTip.x,
      tipY: trunkTip.y,
    });
  }

  return { paths, arrows };
}

/**
 * Mobile: wires drop from each card's bottom edge onto the ball's top arc.
 * Trunk is a short stem below the struct capsule → dashboard (never through the capsule).
 * Branch is a short stem below the dashboard → CTA.
 */
function buildVerticalDiagramGeometry(
  cardRects: DOMRect[],
  ballRect: DOMRect,
  dashRect: DOMRect | null,
  ctaRect: DOMRect | null,
  svgRect: DOMRect,
  structLabelRect: DOMRect | null = null,
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
  const entryR = ballEntryRadius(ballRect);

  const paths: DiagramPath[] = [];
  const arrows: DiagramArrow[] = [];
  const count = cardRects.length;

  cardRects.forEach((rect, i) => {
    const start = toSvg(rect.left + rect.width / 2, rect.bottom);
    const t = count > 1 ? i / (count - 1) : 0.5;
    const jitter = seededUnit(i * 13 + 5) - 0.5;
    const angleDeg = 200 + t * 140 + jitter * 8;
    const angle = (angleDeg * Math.PI) / 180;
    const entry: Point = {
      x: center.x + Math.cos(angle) * entryR,
      y: center.y + Math.sin(angle) * entryR,
    };
    paths.push({ id: `card-${i}`, group: "card", d: buildConvergePath(start, entry, center, i + 1) });
  });

  if (dashRect && dashRect.width) {
    const flowX = dashRect.left + dashRect.width / 2;
    // Same clearance above portal and above Explore Courses (visible gap, no overlap).
    const trunkTipY = dashRect.top - MOBILE_ARROW_CLEAR_PX;
    // Start just below the capsule so the stem never pierces "ONE TRUSTED SYSTEM".
    const trunkStartY =
      structLabelRect && structLabelRect.height > 0
        ? structLabelRect.bottom + MOBILE_TRUNK_AFTER_LABEL_PX
        : trunkTipY - 44;

    if (trunkStartY < trunkTipY - 4) {
      const start = toSvg(flowX, trunkStartY);
      const trunkTip = toSvg(flowX, trunkTipY);
      paths.push({ id: "trunk", group: "trunk", d: buildStraightLine(start, trunkTip) });
      arrows.push({
        id: "trunk-arrow",
        group: "trunk",
        points: buildArrowPolygon(trunkTip, start),
        tipX: trunkTip.x,
        tipY: trunkTip.y,
      });
    }

    if (ctaRect && ctaRect.width) {
      const branchStartY = dashRect.bottom + MOBILE_BRANCH_AFTER_DASH_PX;
      const branchTipY = ctaRect.top - MOBILE_ARROW_CLEAR_PX;
      if (branchStartY < branchTipY - 4) {
        const bStart = toSvg(flowX, branchStartY);
        const branchTip = toSvg(ctaRect.left + ctaRect.width / 2, branchTipY);
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
  } else if (ctaRect && ctaRect.width) {
    const flowX = ballCX;
    const trunkStartY = ballRect.bottom + MOBILE_TRUNK_AFTER_LABEL_PX;
    const trunkTipY = ctaRect.top - MOBILE_ARROW_CLEAR_PX;
    if (trunkStartY < trunkTipY - 4) {
      const start = toSvg(flowX, trunkStartY);
      const trunkTip = toSvg(ctaRect.left + ctaRect.width / 2, trunkTipY);
      paths.push({ id: "trunk", group: "trunk", d: buildStraightLine(start, trunkTip) });
      arrows.push({
        id: "trunk-arrow",
        group: "trunk",
        points: buildArrowPolygon(trunkTip, start),
        tipX: trunkTip.x,
        tipY: trunkTip.y,
      });
    }
  }

  return { paths, arrows };
}

function prepareStroke(path: SVGPathElement, hidden: boolean) {
  const length = path.getTotalLength();
  // opacity 0 when collapsed — round linecaps still paint a speck at dashoffset=length
  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: hidden ? length : 0,
    opacity: hidden ? 0 : 1,
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
  // Keep undrawn strokes fully invisible (round caps otherwise leave speck dots)
  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: length * (1 - drawRatio),
    opacity: drawRatio > 0.002 ? 1 : 0,
  });
}

/* ── Scattered source-card icons (Lucide vector) ───────────────────────── */
const CARD_ICONS: Record<string, ReactNode> = {
  pdfs: <Icon icon={FileText} size={16} strokeWidth={1.75} className="h-4 w-4" />,
  youtube: <Icon icon={CirclePlay} size={16} strokeWidth={1.75} className="h-4 w-4" />,
  notes: <Icon icon={NotebookPen} size={16} strokeWidth={1.75} className="h-4 w-4" />,
  articles: <Icon icon={Newspaper} size={16} strokeWidth={1.75} className="h-4 w-4" />,
  aichats: <Icon icon={MessageSquare} size={16} strokeWidth={1.75} className="h-4 w-4" />,
  books: <Icon icon={Library} size={16} strokeWidth={1.75} className="h-4 w-4" />,
  podcasts: <Icon icon={Mic} size={16} strokeWidth={1.75} className="h-4 w-4" />,
  blogs: <Icon icon={Globe} size={16} strokeWidth={1.75} className="h-4 w-4" />,
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
    <HookScatteredCard
      id={id}
      title={title}
      color={color}
      icon={CARD_ICONS[id]}
      top={pos.top}
      left={pos.left}
      cardRef={cardRef}
      className="pointer-events-auto"
    />
  );
}

/* ── Center HOLS ball ──────────────────────────────────────────────────── */
/** Labels hang below out of flow so the ball itself stays on the flow axis. */
function HolsBall({
  innerRef,
  className,
}: {
  innerRef?: (node: HTMLDivElement | null) => void;
  className?: string;
}) {
  return <HookHolsBall innerRef={innerRef} className={className} />;
}

/* ── Interactive portal mock (replaces static dashboard image) ─────────── */
function DashboardMockup({
  innerRef,
  className,
}: {
  innerRef?: (node: HTMLDivElement | null) => void;
  className?: string;
}) {
  return <HookInteractiveDashboard innerRef={innerRef} className={className} />;
}

/* ── Title + description ───────────────────────────────────────────────── */
function HookCopy({ centered = false }: { centered?: boolean }) {
  const { hook } = landingContent;
  return (
    <div
      data-hook-copy
      className={cn(
        "w-full max-w-3xl lg:max-w-4xl",
        centered ? "mx-auto text-center" : "text-left",
      )}
    >
      <h2 className="font-sans text-[1.875rem] font-normal leading-[1.05] tracking-tight text-primary sm:text-[2.25rem] md:text-[3.75rem]">
        <span>{hook.beforeLabel}</span>
        <span style={{ color: HOOK_LINE }}>
          {" "}
          becomes{" "}
        </span>
        <span>{hook.afterLabel}</span>
        <span>.</span>
      </h2>
      <p
        className={cn(
          "text-brand-body mt-4 max-w-xl text-primary/75 md:mt-5",
          centered && "mx-auto",
        )}
      >
        {hook.solution}
      </p>
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
    const dashRect = HOOK_SHOW_DASHBOARD ? getPortalLayoutRect(dashRef.current) : null;
    const ctaRect = getCtaLayoutRect(ctaRef.current);

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

  // Hide stroke caps before paint; preserve in-progress draws on geometry updates
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || paths.length === 0) return;
    svg.querySelectorAll<SVGPathElement>("[data-hook-line]").forEach((p) => {
      const existing = gsap.getProperty(p, "strokeDasharray");
      const hasDash =
        existing !== undefined &&
        existing !== null &&
        existing !== "none" &&
        String(existing) !== "0" &&
        String(existing) !== "";
      if (hasDash) {
        resyncPathStroke(p);
      } else {
        prepareStroke(p, true);
      }
    });
    svg.querySelectorAll<SVGPolygonElement>("[data-hook-arrow]").forEach((a) => {
      const op = a.getAttribute("opacity");
      if (op === null || op === "") a.setAttribute("opacity", "0");
    });
  }, [paths, arrows]);

  useLayoutEffect(() => {
    syncPaths();
    const diagram = diagramRef.current;
    if (!diagram) return;

    const observer = new ResizeObserver(syncPaths);
    observer.observe(diagram);
    if (ballRef.current) observer.observe(ballRef.current);
    if (HOOK_SHOW_DASHBOARD && dashRef.current) observer.observe(dashRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);
    cardRefs.current.forEach((c) => c && observer.observe(c));

    const onCardMove = () => syncPaths();
    window.addEventListener("resize", syncPaths);
    window.addEventListener(HOOK_PATH_SYNC, onCardMove);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncPaths);
      window.removeEventListener(HOOK_PATH_SYNC, onCardMove);
    };
  }, [syncPaths]);

  return (
    <div ref={diagramRef} className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
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
            <stop offset="0%" stopColor={HOOK_LINE} stopOpacity="0.35" />
            <stop offset="100%" stopColor={HOOK_LINE} stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {paths.map((path) =>
          path.group === "card" ? (
            <path
              key={path.id}
              data-hook-line
              data-group="card"
              d={path.d}
              stroke="url(#hook-card-gradient)"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          ) : (
            <path
              key={path.id}
              data-hook-line
              data-group={path.group}
              d={path.d}
              stroke={HOOK_LINE}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ),
        )}

        {arrows.map((arrow) => (
          <polygon
            key={arrow.id}
            data-hook-arrow
            data-group={arrow.group}
            points={arrow.points}
            fill={HOOK_LINE}
            opacity={0}
          />
        ))}
      </svg>

      {/* Column labels — capsules centered over the cards column / dashboard mockup */}
      <div
        className={cn(
          "relative z-10 mb-4 grid w-full items-end gap-x-2 xl:mb-5 xl:gap-x-3",
          HOOK_SHOW_DASHBOARD
            ? "grid-cols-[minmax(16rem,20rem)_minmax(8rem,1fr)_auto_minmax(6rem,1fr)_auto_minmax(4rem,0.7fr)_auto] xl:grid-cols-[minmax(18rem,22rem)_minmax(10rem,1.2fr)_auto_minmax(8rem,1fr)_auto_minmax(5rem,0.8fr)_auto]"
            : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
        )}
      >
        <div className="flex w-full max-w-[22rem] justify-center justify-self-start xl:max-w-[24rem]">
          <span data-hook-scatter-label className={cn(HOOK_CAPSULE_CLASS, "opacity-0")}>
            {hook.scatteredLabel}
          </span>
        </div>
        {HOOK_SHOW_DASHBOARD ? (
          <>
            <div aria-hidden />
            <div aria-hidden className="w-[150px] sm:w-[180px] md:w-[210px]" />
            <div aria-hidden />
            <div
              className="flex justify-center justify-self-center"
              style={{ width: HOOK_PORTAL_SIZE.width }}
            >
              <span data-hook-struct-label className={cn(HOOK_CAPSULE_CLASS, "opacity-0")}>
                {hook.structuredLabel}
              </span>
            </div>
            <div aria-hidden />
            <div aria-hidden className="w-[9.5rem]" />
          </>
        ) : (
          <>
            <div aria-hidden />
            <div aria-hidden />
          </>
        )}
      </div>

      {/* Full-width flow: cards · ball (center) · CTA — or legacy dashboard grid */}
      <div
        className={cn(
          "relative z-10 min-h-0 w-full flex-1 items-center",
          HOOK_SHOW_DASHBOARD
            ? "grid gap-x-2 xl:gap-x-3 grid-cols-[minmax(16rem,20rem)_minmax(8rem,1fr)_auto_minmax(6rem,1fr)_auto_minmax(4rem,0.7fr)_auto] xl:grid-cols-[minmax(18rem,22rem)_minmax(10rem,1.2fr)_auto_minmax(8rem,1fr)_auto_minmax(5rem,0.8fr)_auto]"
            : "min-h-[280px]",
        )}
      >
        {/* 1 · Scattered cards (left edge) */}
        <div
          className={cn(
            "relative h-full min-h-[280px] w-full max-w-[22rem] xl:max-w-[24rem]",
            HOOK_SHOW_DASHBOARD ? "justify-self-start" : "absolute inset-y-0 left-0 z-10",
          )}
        >
          {hook.sourceCards.map((card, i) => (
            <ScatteredCard key={card.id} id={card.id} title={card.title} cardRef={setCardRef(i)} />
          ))}
        </div>

        {HOOK_SHOW_DASHBOARD ? (
          <>
            {/* 2 · Flexible gap for card → ball lines */}
            <div aria-hidden className="h-full w-full" />

            {/* 3 · HOLS ball */}
            <div className="relative z-10 shrink-0 self-center">
              <HolsBall innerRef={(n) => (ballRef.current = n)} className="opacity-0" />
            </div>

            {/* 4 · Flexible gap for ball → dashboard line */}
            <div aria-hidden className="h-full w-full" />

            {/* 5 · Dashboard */}
            <HookPortalShell className="relative z-10 justify-self-center self-center">
              <DashboardMockup innerRef={(n) => (dashRef.current = n)} className="opacity-0" />
            </HookPortalShell>

            {/* 6 · Flexible gap for dashboard → CTA line */}
            <div aria-hidden className="h-full w-full" />

            <div
              ref={ctaRef}
              data-hook-cta
              className="pointer-events-auto relative z-10 shrink-0 justify-self-end self-center opacity-0"
            >
              <HeroButton
                href={hook.cta.href}
                variant="primary"
                className="whitespace-nowrap px-6 !shadow-none ![backdrop-filter:none] ![-webkit-backdrop-filter:none] md:px-8"
              >
                {hook.cta.label}
              </HeroButton>
            </div>
          </>
        ) : (
          <>
            {/* Ball — true horizontal center of the diagram (independent of card/CTA weight) */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="pointer-events-auto shrink-0">
                <HolsBall innerRef={(n) => (ballRef.current = n)} className="opacity-0" />
              </div>
            </div>

            {/* CTA — right rail */}
            <div className="absolute inset-y-0 right-0 z-10 flex items-center">
              <div
                ref={ctaRef}
                data-hook-cta
                className="pointer-events-auto relative shrink-0 opacity-0"
              >
                <HeroButton
                  href={hook.cta.href}
                  variant="primary"
                  className="whitespace-nowrap px-6 !shadow-none ![backdrop-filter:none] ![-webkit-backdrop-filter:none] md:px-8"
                >
                  {hook.cta.label}
                </HeroButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Mobile vertical flow (centered + card→ball lines) ─────────────────── */
function MobileFlowDiagram({ onPathsReady }: { onPathsReady?: () => void }) {
  const { hook } = landingContent;
  const diagramRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);
  const dashRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const structLabelRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [paths, setPaths] = useState<DiagramPath[]>([]);
  const [arrows, setArrows] = useState<DiagramArrow[]>([]);
  const [viewBox, setViewBox] = useState("0 0 400 800");

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
    const dashRect = HOOK_SHOW_DASHBOARD ? getPortalLayoutRect(dashRef.current) : null;
    const ctaRect = getCtaLayoutRect(ctaRef.current);
    const structLabelRect = structLabelRef.current?.getBoundingClientRect() ?? null;

    const next = buildVerticalDiagramGeometry(
      cardRects,
      ballRect,
      dashRect,
      ctaRect,
      svgRect,
      structLabelRect,
    );
    setViewBox(`0 0 ${svgRect.width.toFixed(1)} ${svgRect.height.toFixed(1)}`);
    setPaths((cur) => (JSON.stringify(cur) === JSON.stringify(next.paths) ? cur : next.paths));
    setArrows((cur) => (JSON.stringify(cur) === JSON.stringify(next.arrows) ? cur : next.arrows));
  }, []);

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

  // Hide stroke caps before paint; preserve in-progress draws on geometry updates
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || paths.length === 0) return;
    svg.querySelectorAll<SVGPathElement>("[data-hook-line]").forEach((p) => {
      const existing = gsap.getProperty(p, "strokeDasharray");
      const hasDash =
        existing !== undefined &&
        existing !== null &&
        existing !== "none" &&
        String(existing) !== "0" &&
        String(existing) !== "";
      if (hasDash) {
        resyncPathStroke(p);
      } else {
        prepareStroke(p, true);
      }
    });
    svg.querySelectorAll<SVGPolygonElement>("[data-hook-arrow]").forEach((a) => {
      const op = a.getAttribute("opacity");
      if (op === null || op === "") a.setAttribute("opacity", "0");
    });
  }, [paths, arrows]);

  useLayoutEffect(() => {
    syncPaths();
    const diagram = diagramRef.current;
    if (!diagram) return;

    const observer = new ResizeObserver(syncPaths);
    observer.observe(diagram);
    if (ballRef.current) observer.observe(ballRef.current);
    if (HOOK_SHOW_DASHBOARD && dashRef.current) observer.observe(dashRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);
    if (HOOK_SHOW_DASHBOARD && structLabelRef.current) observer.observe(structLabelRef.current);
    cardRefs.current.forEach((c) => c && observer.observe(c));

    const onCardMove = () => syncPaths();
    window.addEventListener("resize", syncPaths);
    window.addEventListener(HOOK_PATH_SYNC, onCardMove);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncPaths);
      window.removeEventListener(HOOK_PATH_SYNC, onCardMove);
    };
  }, [syncPaths]);

  return (
    <div ref={diagramRef} className="relative flex w-full flex-col items-center overflow-hidden">
      <svg
        ref={svgRef}
        aria-hidden
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="hook-card-gradient-mobile" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={HOOK_LINE} stopOpacity="0.35" />
            <stop offset="100%" stopColor={HOOK_LINE} stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {paths.map((path) =>
          path.group === "card" ? (
            <path
              key={path.id}
              data-hook-line
              data-group="card"
              d={path.d}
              stroke="url(#hook-card-gradient-mobile)"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          ) : (
            <path
              key={path.id}
              data-hook-line
              data-group={path.group}
              d={path.d}
              stroke={HOOK_LINE}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ),
        )}

        {arrows.map((arrow) => (
          <polygon
            key={arrow.id}
            data-hook-arrow
            data-group={arrow.group}
            points={arrow.points}
            fill={HOOK_LINE}
            opacity={0}
          />
        ))}
      </svg>

      <div className="relative z-10 flex w-full flex-col items-center">
        {/* Scattered cluster header — centered above the card wrap */}
        <div className="mb-4 flex w-full max-w-md flex-col items-center sm:max-w-lg">
          <span data-hook-scatter-label className={cn(HOOK_CAPSULE_CLASS, "opacity-0")}>
            {hook.scatteredLabel}
          </span>
        </div>

        <div className="flex max-w-md flex-wrap items-center justify-center gap-2.5 px-1 sm:max-w-lg sm:gap-3">
          {hook.sourceCards.map((card, i) => {
            const color = CARD_COLORS[card.id] ?? BLUE;
            return (
              <HookScatteredCardInline
                key={card.id}
                id={card.id}
                title={card.title}
                color={color}
                icon={CARD_ICONS[card.id]}
                cardRef={setCardRef(i)}
              />
            );
          })}
        </div>

        <div aria-hidden className="h-16 w-full sm:h-20" />

        <div className="relative z-10">
          <HolsBall innerRef={(n) => (ballRef.current = n)} className="opacity-0" />
        </div>

        {/* Clearance under HOLS wordmark — no trunk through this gap */}
        <div aria-hidden className="h-14 w-full sm:h-16" />

        {HOOK_SHOW_DASHBOARD ? (
          <>
            {/* Capsule sits alone; short trunk starts below it into the dashboard */}
            <span
              ref={structLabelRef}
              data-hook-struct-label
              className={cn(HOOK_CAPSULE_CLASS, "opacity-0")}
            >
              {hook.structuredLabel}
            </span>

            {/* Room for short stem + arrowhead into dashboard chrome */}
            <div aria-hidden className="h-14 w-full sm:h-16" />

            <HookPortalShell responsive className="relative z-10">
              <DashboardMockup innerRef={(n) => (dashRef.current = n)} className="opacity-0" />
            </HookPortalShell>

            {/* Room for short branch stem + arrowhead into Explore Courses */}
            <div aria-hidden className="h-14 w-full sm:h-16" />
          </>
        ) : (
          <div aria-hidden className="h-10 w-full sm:h-12" />
        )}

        {/* z-10 keeps layout; SVG at z-20 draws the tip on top of this border */}
        <div ref={ctaRef} data-hook-cta className="relative z-10 opacity-0">
          <HeroButton
            href={hook.cta.href}
            variant="primary"
            className="whitespace-nowrap px-8 !shadow-none ![backdrop-filter:none] ![-webkit-backdrop-filter:none]"
          >
            {hook.cta.label}
          </HeroButton>
        </div>
      </div>
    </div>
  );
}

/* ── Reduced-motion fallback ───────────────────────────────────────────── */
function HookStatic() {
  const { hook } = landingContent;
  return (
    <section id="problem" className="relative z-10" style={{ backgroundColor: HOOK_BG }}>
      <div className="w-full py-12 md:py-14 lg:py-16">
        <div className={cn("flex w-full flex-col items-center", heroLayout.gutterX)}>
          <HookCopy centered />
          <div className="mt-10 flex w-full flex-col items-center gap-6">
            <div className="flex w-full max-w-md flex-col items-center sm:max-w-lg">
              <span className={HOOK_CAPSULE_CLASS}>
                {hook.scatteredLabel}
              </span>
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2 sm:max-w-lg">
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
            <HolsBall />
            {HOOK_SHOW_DASHBOARD ? (
              <>
                <span className={HOOK_CAPSULE_CLASS}>
                  {hook.structuredLabel}
                </span>
                <HookPortalShell responsive>
                  <DashboardMockup />
                </HookPortalShell>
              </>
            ) : null}
            <HeroButton
              href={hook.cta.href}
              variant="primary"
              className="px-8 !shadow-none ![backdrop-filter:none] ![-webkit-backdrop-filter:none]"
            >
              {hook.cta.label}
            </HeroButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HookSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const mobileWrapRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [desktopReady, setDesktopReady] = useState(false);
  const [mobileReady, setMobileReady] = useState(false);
  const markDesktopReady = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      setDesktopReady(true);
    }
  }, []);
  const markMobileReady = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMobileReady(true);
    }
  }, []);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  const hookScrollDistance = () => window.innerHeight * 2.4;

  // Desktop pin only — never unmount pinWrap; CSS hides it on mobile.
  // pinWrap MUST stay a direct child of section or sibling ScrollTriggers break.
  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const section = sectionRef.current;
      const pinWrap = pinWrapRef.current;
      if (!section || !pinWrap) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
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
          requestAnimationFrame(() => ScrollTrigger.refresh());
        };
      });

      return () => {
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  // Desktop scrub timeline (pinned horizontal diagram).
  useGSAP(
    () => {
      if (reduceMotion || !desktopReady) return;

      registerGsap();

      const section = sectionRef.current;
      const pinWrap = pinWrapRef.current;
      if (!section || !pinWrap) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
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

        if (cards.length === 0) return;

        allLines.forEach((p) => prepareStroke(p, true));
        allArrows.forEach((arrow) => arrow.setAttribute("opacity", "0"));
        gsap.set(cards, { autoAlpha: 0, y: 10, yPercent: -50 });
        gsap.set(scatterLabel, { autoAlpha: 0, y: 6 });
        if (HOOK_SHOW_DASHBOARD) {
          gsap.set(structLabel, { autoAlpha: 0, y: 6 });
          gsap.set(dashboard, { autoAlpha: 0, y: 12, scale: 0.98 });
        }
        gsap.set(hub, { autoAlpha: 0, scale: 0.94 });
        gsap.set(cta, { autoAlpha: 0, y: 8 });

        const syncAllArrows = () => {
          syncTrunkArrow(trunkLines[0], trunkArrows[0]);
          if (HOOK_SHOW_DASHBOARD) {
            syncArrowToLine(branchLines[0], branchArrows[0]);
          }
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            id: "hook-timeline",
            trigger: section,
            start: "top top",
            end: () => `+=${hookScrollDistance()}`,
            scrub: 1.8,
            invalidateOnRefresh: true,
          },
          onUpdate: syncAllArrows,
        });

        // Long, overlapping beats so scroll feels continuous — no snap-in pops.
        tl.to(scatterLabel, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power1.out" }, 0.0);
        cards.forEach((card, i) => {
          tl.to(
            card,
            { autoAlpha: 1, y: 0, duration: 0.65, ease: "power1.out" },
            0.12 + i * 0.09,
          );
        });
        cardLines.forEach((p, i) => {
          tl.to(
            p,
            { strokeDashoffset: 0, opacity: 1, duration: 1.1, ease: "none" },
            0.9 + i * 0.07,
          );
        });
        tl.to(hub, { autoAlpha: 1, scale: 1, duration: 0.85, ease: "power1.out" }, 1.55);
        tl.to(trunkLines, { strokeDashoffset: 0, opacity: 1, duration: 1.15, ease: "none" }, 2.05);
        if (HOOK_SHOW_DASHBOARD) {
          tl.to(structLabel, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power1.out" }, 2.55);
          tl.to(
            dashboard,
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: "power1.out" },
            2.65,
          );
          tl.to(branchLines, { strokeDashoffset: 0, opacity: 1, duration: 1.15, ease: "none" }, 3.25);
          tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power1.out" }, 3.85);
        } else {
          tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power1.out" }, 2.85);
        }
        // Hold the finished frame so the last beat doesn't cut off mid-scroll.
        tl.to({}, { duration: 0.9 });

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
      });

      return () => {
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion, desktopReady] },
  );

  // Mobile scrub timeline (no pin — natural scroll keeps sibling sections healthy).
  useGSAP(
    () => {
      if (reduceMotion || !mobileReady) return;

      registerGsap();

      const section = sectionRef.current;
      const mobileWrap = mobileWrapRef.current;
      if (!section || !mobileWrap) return;

      const mm = gsap.matchMedia();

      mm.add("(max-width: 1023px)", () => {
        const q = <T extends Element>(sel: string) =>
          gsap.utils.toArray<T>(mobileWrap.querySelectorAll(sel));

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

        if (cards.length === 0) return;

        allLines.forEach((p) => prepareStroke(p, true));
        allArrows.forEach((arrow) => arrow.setAttribute("opacity", "0"));
        gsap.set(cards, { autoAlpha: 0, y: 10 });
        gsap.set(scatterLabel, { autoAlpha: 0, y: 6 });
        if (HOOK_SHOW_DASHBOARD) {
          gsap.set(structLabel, { autoAlpha: 0, y: 6 });
          gsap.set(dashboard, { autoAlpha: 0, y: 12, scale: 0.98 });
        }
        gsap.set(hub, { autoAlpha: 0, scale: 0.94 });
        gsap.set(cta, { autoAlpha: 0, y: 8 });

        const syncAllArrows = () => {
          syncTrunkArrow(trunkLines[0], trunkArrows[0]);
          if (HOOK_SHOW_DASHBOARD) {
            syncArrowToLine(branchLines[0], branchArrows[0]);
          }
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            id: "hook-timeline-mobile",
            trigger: section,
            start: "top 80%",
            end: "bottom 25%",
            scrub: 1.8,
            invalidateOnRefresh: true,
          },
          onUpdate: syncAllArrows,
        });

        tl.to(scatterLabel, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power1.out" }, 0.0);
        cards.forEach((card, i) => {
          tl.to(
            card,
            { autoAlpha: 1, y: 0, duration: 0.65, ease: "power1.out" },
            0.12 + i * 0.09,
          );
        });
        cardLines.forEach((p, i) => {
          tl.to(
            p,
            { strokeDashoffset: 0, opacity: 1, duration: 1.1, ease: "none" },
            0.9 + i * 0.07,
          );
        });
        tl.to(hub, { autoAlpha: 1, scale: 1, duration: 0.85, ease: "power1.out" }, 1.55);
        tl.to(trunkLines, { strokeDashoffset: 0, opacity: 1, duration: 1.15, ease: "none" }, 2.05);
        if (HOOK_SHOW_DASHBOARD) {
          tl.to(structLabel, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power1.out" }, 2.55);
          tl.to(
            dashboard,
            { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: "power1.out" },
            2.65,
          );
          tl.to(branchLines, { strokeDashoffset: 0, opacity: 1, duration: 1.15, ease: "none" }, 3.25);
          tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power1.out" }, 3.85);
        } else {
          tl.to(cta, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power1.out" }, 2.85);
        }
        tl.to({}, { duration: 0.9 });

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
      });

      return () => {
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion, mobileReady] },
  );

  if (reduceMotion) return <HookStatic />;

  return (
    <section ref={sectionRef} id="problem" className="relative z-10" style={{ backgroundColor: HOOK_BG }}>
      {/* Desktop: stable pin target — always mounted, CSS-hidden below lg */}
      <div
        ref={pinWrapRef}
        className="relative hidden h-[100dvh] w-full flex-col overflow-hidden lg:flex"
        style={{ backgroundColor: HOOK_BG }}
      >
        <div className={cn("flex w-full shrink-0 flex-col pt-8 md:pt-10 xl:pt-12", heroLayout.gutterX)}>
          <HookCopy />
        </div>
        <div className={cn("mt-4 flex min-h-0 w-full flex-1 flex-col overflow-hidden pb-6 md:mt-6", heroLayout.gutterX)}>
          <FlowDiagram onPathsReady={markDesktopReady} />
        </div>
      </div>

      {/* Mobile: natural-height vertical flow — never pinned */}
      <div
        ref={mobileWrapRef}
        className={cn(
          "flex w-full flex-col items-center overflow-hidden py-12 md:py-14 lg:hidden",
          heroLayout.gutterX,
        )}
        style={{ backgroundColor: HOOK_BG }}
      >
        <HookCopy centered />
        <div className="mt-8 w-full md:mt-10">
          <MobileFlowDiagram onPathsReady={markMobileReady} />
        </div>
      </div>
    </section>
  );
}
