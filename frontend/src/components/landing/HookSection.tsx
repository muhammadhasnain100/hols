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

/**
 * Scattered lines originate from the left ball, fan out, converge at the right ball,
 * then one line exits to the CTA.
 */
function buildConvergePaths(viewW: number, viewH: number) {
  const count = 9;
  const padY = 16;
  const gap = (viewH - padY * 2) / (count - 1);
  const originY = viewH / 2;
  const ballRadius = viewW * 0.038;
  const originX = ballRadius;
  const startX = originX;

  const mergeY = viewH / 2;
  const mergeX = viewW * 0.68;
  const spreadEnd = viewW * 0.34;
  const convergeStart = viewW * 0.5;
  const tipX = mergeX - ballRadius;
  const singleStartX = mergeX + ballRadius;

  const paths = Array.from({ length: count }, (_, i) => {
    const y = padY + i * gap;
    const fanC1x = startX + (spreadEnd - startX) * 0.32;
    const fanC2x = startX + (spreadEnd - startX) * 0.68;
    const fanC1y = originY + (y - originY) * 0.12;
    const fanC2y = originY + (y - originY) * 0.88;
    const c1x = convergeStart + (tipX - convergeStart) * 0.35;
    const c2x = convergeStart + (tipX - convergeStart) * 0.72;
    const c1y = y;
    const c2y = y + (mergeY - y) * 0.72;

    return `M ${startX.toFixed(2)} ${originY.toFixed(2)} C ${fanC1x.toFixed(2)} ${fanC1y.toFixed(2)}, ${fanC2x.toFixed(2)} ${fanC2y.toFixed(2)}, ${spreadEnd.toFixed(2)} ${y.toFixed(2)} L ${convergeStart.toFixed(2)} ${y.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${tipX.toFixed(2)} ${mergeY.toFixed(2)}`;
  });

  return { paths, originX, mergeX, mergeY, ballRadius, singleStartX };
}

function buildSinglePath(endX: number, startX: number, y: number) {
  return `M ${startX.toFixed(2)} ${y.toFixed(2)} L ${endX.toFixed(2)} ${y.toFixed(2)}`;
}

const VIEW_W = 1200;
const VIEW_H = 240;
const { paths: CONVERGE_PATHS, mergeX, singleStartX, mergeY } =
  buildConvergePaths(VIEW_W, VIEW_H);
const DEFAULT_SINGLE_END = VIEW_W * 0.9;

const BALL_CLASS =
  "h-14 w-14 object-contain drop-shadow-[0_8px_24px_rgba(21,39,68,0.18)] sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24";

function HookBall({
  src,
  dataAttr,
  leftPct,
  align = "center",
}: {
  src: string;
  dataAttr: "data-hook-ball-origin" | "data-hook-ball-merge";
  leftPct?: number;
  align?: "center" | "start";
}) {
  return (
    <div
      {...{ [dataAttr]: true }}
      aria-hidden
      className={cn(
        "absolute top-1/2 z-10 -translate-y-1/2",
        align === "center" ? "-translate-x-1/2" : "translate-x-0",
      )}
      style={{ left: align === "start" ? 0 : `${leftPct}%` }}
    >
      <Image
        src={src}
        alt=""
        width={96}
        height={96}
        className={BALL_CLASS}
        sizes="(max-width: 640px) 3.5rem, 6rem"
        priority
      />
    </div>
  );
}

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

function FlowDiagram() {
  const { hook } = landingContent;
  const mergePct = (mergeX / VIEW_W) * 100;
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

    const endX =
      ((ctaRect.left - svgRect.left) / svgRect.width) * VIEW_W;
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
          className="absolute top-0 left-[1.75rem] z-20 -translate-x-1/2 will-change-transform sm:left-8 md:left-10"
        >
          <span className={HOOK_LABEL_CAPSULE}>{hook.beforeLabel}</span>
        </div>
        <div
          data-hook-after-label
          className="absolute top-0 z-20 -translate-x-1/2 will-change-transform"
          style={{ left: `${mergePct}%` }}
        >
          <span className={cn(HOOK_LABEL_CAPSULE, "font-medium italic")}>
            {hook.afterLabel}
          </span>
        </div>
      </div>

      <div ref={rowRef} className="relative w-full">
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

        <HookBall
          src={hook.ballImage}
          dataAttr="data-hook-ball-origin"
          align="start"
        />
        <HookBall
          src={hook.ballImage}
          dataAttr="data-hook-ball-merge"
          leftPct={mergePct}
        />

        <div
          ref={ctaRef}
          className="absolute top-1/2 right-0 z-20 -translate-y-1/2"
        >
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
      const originBalls = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-ball-origin]"),
      );
      const mergeBalls = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-ball-merge]"),
      );
      const ctas = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-cta]"),
      );
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

      gsap.set(originBalls, { scale: 0.85, autoAlpha: 0 });
      gsap.set(mergeBalls, { scale: 0.85, autoAlpha: 0 });
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

      // 1 — Before-label + origin ball enter
      tl.to(
          beforeLabels,
          { autoAlpha: 1, x: 0, duration: 0.45, ease: "none" },
          0.4,
        )
        .fromTo(
          originBalls,
          { scale: 0.85, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.45, ease: "none" },
          0.4,
        );

      // 2 — Scattered lines draw outward from the origin ball, then converge
      scatterPaths.forEach((path, i) => {
        tl.to(
          path,
          { strokeDashoffset: 0, duration: 1.55, ease: "none" },
          0.55 + i * 0.045,
        );
      });

      // 3 — Merge ball + label, then single line exits right
      tl.fromTo(
        mergeBalls,
        { scale: 0.85, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.45, ease: "none" },
        2.0,
      )
        .to(
          afterLabels,
          { autoAlpha: 1, y: 0, duration: 0.4, ease: "none" },
          2.05,
        )
        .to(
          singlePaths,
          { strokeDashoffset: 0, duration: 0.85, ease: "none" },
          2.1,
        );

      // 4 — Explore courses on the right
      tl.to(ctas, { autoAlpha: 1, x: 0, duration: 0.5, ease: "none" }, 2.65);

      // 5 — Problem → solution
      tl.to(problem, { autoAlpha: 0, y: -14, duration: 0.5, ease: "none" }, 3.1)
        .to(solution, { autoAlpha: 1, y: 0, duration: 0.55, ease: "none" }, 3.25);

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
