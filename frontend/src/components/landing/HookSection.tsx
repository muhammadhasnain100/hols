"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { HeroButton } from "@/components/hero/HeroButton";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { brand } from "@/config/brand";
import { heroLayout } from "@/lib/hero-styles";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const LINE = "#152744";
const STROKE = 1.5;
const MERGE_STROKE = 2.15;

const HOOK_SINGLE_PATH_SYNC = "hook-single-path-sync";

/** Deterministic pseudo-random in [0, 1) for stable organic curves. */
function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Each scattered capsule sits on the left with a unique x-offset; a curved line
 * originates from the capsule and converges on the HOLS hub, then one line exits to the CTA.
 */
function buildConvergePaths(viewW: number, viewH: number, count: number) {
  const padY = 20;
  const gap = (viewH - padY * 2) / Math.max(count - 1, 1);
  const mergeY = viewH / 2;
  const mergeX = viewW * 0.68;
  const hubHalf = viewW * 0.045;
  const tipX = mergeX - hubHalf;
  const singleStartX = mergeX + hubHalf;
  const capsuleHalfW = viewW * 0.055;

  const scatterPositions = Array.from({ length: count }, (_, i) => {
    const y = padY + i * gap;
    const xJitter = (seededUnit(i * 7 + 1) - 0.5) * viewW * 0.06;
    const capsuleCenterX = viewW * 0.14 + xJitter;
    return {
      leftPct: (capsuleCenterX / viewW) * 100,
      topPct: (y / viewH) * 100,
      lineStartX: capsuleCenterX + capsuleHalfW,
      lineStartY: y,
    };
  });

  const paths = scatterPositions.map((pos, i) => {
    const { lineStartX, lineStartY } = pos;
    const dx = tipX - lineStartX;
    const bend = seededUnit(i * 13 + 3);
    const sway = seededUnit(i * 19 + 5) - 0.5;

    const c1x = lineStartX + dx * (0.28 + bend * 0.18);
    const c1y = lineStartY + sway * viewH * 0.14;
    const c2x = lineStartX + dx * (0.62 + bend * 0.12);
    const c2y = mergeY + (lineStartY - mergeY) * (0.15 + bend * 0.35);

    const endY = mergeY + (lineStartY - mergeY) * (seededUnit(i * 11 + 7) - 0.5) * 0.08;
    const endX = tipX - seededUnit(i * 17 + 9) * hubHalf * 0.35;

    return `M ${lineStartX.toFixed(2)} ${lineStartY.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`;
  });

  const scatterClusterPct =
    scatterPositions.reduce((sum, pos) => sum + pos.leftPct, 0) / scatterPositions.length;

  return { paths, mergeX, mergeY, singleStartX, scatterPositions, scatterClusterPct };
}

function buildSinglePath(endX: number, startX: number, y: number) {
  return `M ${startX.toFixed(2)} ${y.toFixed(2)} L ${endX.toFixed(2)} ${y.toFixed(2)}`;
}

const VIEW_W = 1200;
const VIEW_H = 280;
const SCATTER_COUNT = landingContent.hook.scatterCapsules.length;
const {
  paths: CONVERGE_PATHS,
  mergeX,
  singleStartX,
  mergeY,
  scatterPositions,
  scatterClusterPct,
} = buildConvergePaths(VIEW_W, VIEW_H, SCATTER_COUNT);
const DEFAULT_SINGLE_END = VIEW_W * 0.9;
const MERGE_PCT = (mergeX / VIEW_W) * 100;

function prepareStroke(path: SVGPathElement, hidden: boolean) {
  const length = path.getTotalLength();
  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: hidden ? length : 0,
  });
}

function resyncSinglePathStroke(path: SVGPathElement) {
  const dasharray = gsap.getProperty(path, "strokeDasharray");
  const dashoffset = gsap.getProperty(path, "strokeDashoffset");
  const length = path.getTotalLength();
  const oldLen = parseFloat(String(dasharray).split(" ")[0] || "0") || length;
  let drawRatio = 0;

  if (oldLen > 0 && typeof dashoffset === "number") {
    drawRatio = 1 - dashoffset / oldLen;
  }

  drawRatio = Math.min(1, Math.max(0, drawRatio));
  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: length * (1 - drawRatio),
  });
}

function HookCta({ href, label }: { href: string; label: string }) {
  return (
    <div data-hook-cta className="pointer-events-auto shrink-0">
      <HeroButton href={href} variant="primary" className="whitespace-nowrap">
        {label}
      </HeroButton>
    </div>
  );
}

const HOOK_LABEL_CAPSULE =
  "glass-capsule inline-flex items-center rounded-full px-4 py-2 font-sans text-sm font-semibold leading-none tracking-[0.005em] text-primary md:px-5 md:py-2.5 md:text-base lg:text-lg";

const HOOK_SCATTER_CAPSULE =
  "glass-capsule inline-flex max-w-[8rem] items-center justify-center rounded-full px-3.5 py-1.5 text-center font-sans text-[11px] font-medium leading-tight tracking-[0.005em] text-primary shadow-[0_2px_8px_rgba(21,39,68,0.06)] sm:max-w-none sm:px-4 sm:py-2 sm:text-xs md:text-sm";

function HookMergeHub() {
  return (
    <div
      data-hook-merge-hub
      aria-hidden
      className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${MERGE_PCT}%` }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_8px_24px_rgba(21,39,68,0.18)] sm:h-16 sm:w-16 md:h-20 md:w-20">
        <Image
          src="/assets/logo/hols-logo-mark-light.png"
          alt=""
          width={56}
          height={56}
          className="h-8 w-8 object-contain sm:h-9 sm:w-9 md:h-10 md:w-10"
          sizes="(max-width: 640px) 2rem, 2.5rem"
        />
      </div>
    </div>
  );
}

function FlowDiagram() {
  const { hook } = landingContent;
  const scatterLabels = hook.scatterCapsules;
  const rowRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [singlePathD, setSinglePathD] = useState(() =>
    buildSinglePath(DEFAULT_SINGLE_END, singleStartX, mergeY),
  );

  const syncSinglePath = useCallback(() => {
    const row = rowRef.current;
    const svg = svgRef.current;
    const cta = ctaRef.current;
    if (!row || !svg || !cta) return;

    const svgRect = svg.getBoundingClientRect();
    const ctaRect = cta.getBoundingClientRect();
    if (svgRect.width <= 0) return;

    const endX = ((ctaRect.left - svgRect.left) / svgRect.width) * VIEW_W;
    const clamped = Math.max(singleStartX + 24, Math.min(endX, VIEW_W - 2));
    const nextPath = buildSinglePath(clamped, singleStartX, mergeY);

    setSinglePathD((current) => (current === nextPath ? current : nextPath));
  }, []);

  useLayoutEffect(() => {
    syncSinglePath();

    const row = rowRef.current;
    if (!row) return;

    const observer = new ResizeObserver(syncSinglePath);
    observer.observe(row);
    if (ctaRef.current) observer.observe(ctaRef.current);

    window.addEventListener("resize", syncSinglePath);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncSinglePath);
    };
  }, [syncSinglePath]);

  useLayoutEffect(() => {
    window.dispatchEvent(new Event(HOOK_SINGLE_PATH_SYNC));
  }, [singlePathD]);

  return (
    <div data-hook-diagram className="relative w-full">
      <div className="pointer-events-none relative mb-2 h-10 w-full md:mb-3 md:h-11">
        <div
          data-hook-before-label
          className="absolute top-0 z-20 -translate-x-1/2 will-change-transform"
          style={{ left: `${scatterClusterPct}%` }}
        >
          <span className={HOOK_LABEL_CAPSULE}>{hook.beforeLabel}</span>
        </div>
        <div
          data-hook-after-label
          className="absolute top-0 z-20 -translate-x-1/2 will-change-transform"
          style={{ left: `${MERGE_PCT}%` }}
        >
          <span className={cn(HOOK_LABEL_CAPSULE, "font-medium italic")}>{hook.afterLabel}</span>
        </div>
      </div>

      <div ref={rowRef} className="relative w-full py-1 md:py-2">
        <svg
          ref={svgRef}
          aria-hidden
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="block h-auto w-full overflow-visible"
          fill="none"
          preserveAspectRatio="none"
        >
          {CONVERGE_PATHS.map((d) => (
            <path
              key={d}
              data-hook-scatter
              d={d}
              stroke={LINE}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          <path
            data-hook-single
            d={singlePathD}
            stroke={LINE}
            strokeWidth={MERGE_STROKE}
            strokeLinecap="butt"
          />
        </svg>

        {scatterLabels.map((label, index) => {
          const position = scatterPositions[index];
          if (!position) return null;

          return (
            <div
              key={label}
              data-hook-scatter-capsule
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 will-change-transform"
              style={{ left: `${position.leftPct}%`, top: `${position.topPct}%` }}
            >
              <span className={HOOK_SCATTER_CAPSULE}>{label}</span>
            </div>
          );
        })}

        <HookMergeHub />

        <div ref={ctaRef} className="absolute top-1/2 right-0 z-20 -translate-y-1/2">
          <HookCta href={hook.cta.href} label={hook.cta.label} />
        </div>
      </div>
    </div>
  );
}

const HOOK_ACCENT = brand.colors.accent.lemonLime;

function HookHeadlineText() {
  const { hook } = landingContent;

  return (
    <h2
      data-hook-headline
      className="font-sans text-[1.875rem] font-bold leading-[1.05] tracking-[0.01em] text-primary sm:text-[2.25rem] md:text-[3.75rem]"
    >
      <span data-hook-headline-before>{hook.beforeLabel}</span>
      <span
        data-hook-headline-becomes
        className="text-accent"
        style={{ color: HOOK_ACCENT }}
      >
        {" "}
        becomes{" "}
      </span>
      <span data-hook-headline-after>{hook.afterLabel}</span>
      <span data-hook-headline-dot>.</span>
    </h2>
  );
}

function HookCopy({
  problemVisible = true,
  solutionVisible = true,
}: {
  problemVisible?: boolean;
  solutionVisible?: boolean;
}) {
  const { hook } = landingContent;

  return (
    <div className="w-full max-w-3xl text-left lg:max-w-4xl">
      <HookHeadlineText />

      <div className="relative mt-4 max-w-2xl md:mt-5">
        <p
          data-hook-problem
          className="text-brand-body text-muted"
          style={{ opacity: problemVisible ? 1 : 0 }}
        >
          {hook.problem}
        </p>
        <p
          data-hook-solution
          className="text-brand-body absolute inset-x-0 top-0 text-primary/85"
          style={{ opacity: solutionVisible ? 1 : 0 }}
        >
          {hook.solution}
        </p>
      </div>
    </div>
  );
}

function HookShell({
  children,
  copyProps,
}: {
  children: ReactNode;
  copyProps?: {
    problemVisible?: boolean;
    solutionVisible?: boolean;
  };
}) {
  return (
    <div className="flex h-full w-full flex-col justify-start pt-5 md:pt-6 lg:pt-8">
      <div className={cn("w-full shrink-0", heroLayout.gutterX)}>
        <HookCopy {...copyProps} />
      </div>

      <div
        className={cn(
          "mt-4 flex min-h-0 w-full flex-1 flex-col justify-center md:mt-5 lg:mt-6",
          heroLayout.gutterX,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function HookStatic() {
  return (
    <section id="problem" className="bg-white">
      <div className="flex flex-col justify-start pb-10 md:pb-14">
        <HookShell>
          <FlowDiagram />
        </HookShell>
      </div>
    </section>
  );
}

export function HookSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const section = sectionRef.current;
      const pinWrap = pinWrapRef.current;
      if (!section || !pinWrap) return;

      const scatterPaths = gsap.utils.toArray<SVGPathElement>(
        pinWrap.querySelectorAll("[data-hook-scatter]"),
      );
      const singlePaths = gsap.utils.toArray<SVGPathElement>(
        pinWrap.querySelectorAll("[data-hook-single]"),
      );
      const scatterCapsules = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-scatter-capsule]"),
      );
      const mergeHub = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-merge-hub]"),
      );
      const ctas = gsap.utils.toArray<HTMLElement>(pinWrap.querySelectorAll("[data-hook-cta]"));
      const beforeLabels = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-before-label]"),
      );
      const afterLabels = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-after-label]"),
      );

      const problem = pinWrap.querySelector("[data-hook-problem]");
      const solution = pinWrap.querySelector("[data-hook-solution]");

      scatterPaths.forEach((p) => prepareStroke(p, true));
      singlePaths.forEach((p) => prepareStroke(p, true));

      gsap.set(scatterCapsules, { autoAlpha: 0, scale: 0.92 });
      gsap.set(mergeHub, { scale: 0.85, autoAlpha: 0 });
      gsap.set(ctas, { autoAlpha: 0, x: 16 });
      gsap.set(beforeLabels, { autoAlpha: 0, x: -12 });
      gsap.set(afterLabels, { autoAlpha: 0, y: 8 });
      gsap.set(solution, { autoAlpha: 0, y: 16 });

      const scrollDistance = () => window.innerHeight * 1.9;

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "hook-timeline",
          trigger: pinWrap,
          start: "top top",
          end: () => `+=${scrollDistance()}`,
          pin: pinWrap,
          pinSpacing: true,
          scrub: 0.75,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1 — Before-label enters
      tl.to(beforeLabels, { autoAlpha: 1, x: 0, duration: 0.45, ease: "none" }, 0.4);

      // 2 — Scattered capsules appear, then lines draw from each capsule to the hub
      scatterCapsules.forEach((capsule, i) => {
        tl.to(
          capsule,
          { autoAlpha: 1, scale: 1, duration: 0.35, ease: "none" },
          0.55 + i * 0.035,
        );
      });

      scatterPaths.forEach((path, i) => {
        tl.to(
          path,
          { strokeDashoffset: 0, duration: 1.2, ease: "none" },
          0.85 + i * 0.045,
        );
      });

      // 3 — HOLS hub + after label, then single line exits right
      tl.fromTo(
        mergeHub,
        { scale: 0.85, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.45, ease: "none" },
        2.15,
      )
        .to(afterLabels, { autoAlpha: 1, y: 0, duration: 0.4, ease: "none" }, 2.2)
        .to(singlePaths, { strokeDashoffset: 0, duration: 0.85, ease: "none" }, 2.25);

      // 4 — Explore courses on the right
      tl.to(ctas, { autoAlpha: 1, x: 0, duration: 0.5, ease: "none" }, 2.8);

      // 5 — Problem → solution
      tl.to(problem, { autoAlpha: 0, y: -14, duration: 0.5, ease: "none" }, 3.25).to(
        solution,
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "none" },
        3.4,
      );

      tl.to({}, { duration: 0.6 });

      const onSinglePathSync = () => {
        singlePaths.forEach(resyncSinglePathStroke);
        ScrollTrigger.refresh();
      };

      window.addEventListener(HOOK_SINGLE_PATH_SYNC, onSinglePathSync);
      requestAnimationFrame(() => {
        onSinglePathSync();
        ScrollTrigger.refresh();
      });

      return () => {
        window.removeEventListener(HOOK_SINGLE_PATH_SYNC, onSinglePathSync);
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  if (reduceMotion) {
    return <HookStatic />;
  }

  return (
    <section ref={sectionRef} id="problem" className="relative isolate bg-white">
      <div
        ref={pinWrapRef}
        className="relative flex h-[100dvh] flex-col overflow-hidden bg-white"
      >
        <HookShell
          copyProps={{
            problemVisible: true,
            solutionVisible: false,
          }}
        >
          <FlowDiagram />
        </HookShell>
      </div>
    </section>
  );
}
