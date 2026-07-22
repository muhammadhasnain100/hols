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

const HOOK_PATH_SYNC = "hook-path-sync";

const LINE = brand.colors.primary.duskBlue;
const LINE_SOFT = brand.colors.accent.babyBlue;
const STROKE = 1.35;
const VERTICAL_STROKE = 1.5;

type DiagramPath = {
  id: string;
  d: string;
  kind: "flow" | "vertical";
};

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildFlowPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  seed: number,
) {
  const dx = endX - startX;
  const bend = seededUnit(seed * 17 + 1);
  const c1x = startX + dx * (0.42 + bend * 0.12);
  const c1y = startY;
  const c2x = startX + dx * (0.68 + bend * 0.08);
  const c2y = endY;

  return `M ${startX.toFixed(2)} ${startY.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`;
}

function buildDiagramPaths(
  cardRects: DOMRect[],
  hubRect: DOMRect,
  ctaRect: DOMRect | null,
  svgRect: DOMRect,
) {
  if (svgRect.width <= 0 || svgRect.height <= 0 || !hubRect.width) {
    return { paths: [] as DiagramPath[] };
  }

  const toSvg = (x: number, y: number) => ({
    x: ((x - svgRect.left) / svgRect.width) * 1000,
    y: ((y - svgRect.top) / svgRect.height) * 1000,
  });

  const hubCenterX = hubRect.left + hubRect.width / 2;
  const hubCenterY = hubRect.top + hubRect.height / 2;
  const hubBottom = toSvg(hubCenterX, hubRect.bottom - hubRect.height * 0.04);
  const paths: DiagramPath[] = [];

  const canFlow =
    cardRects.length > 0 && cardRects.every((rect) => rect.right < hubRect.left + hubRect.width * 0.15);

  if (canFlow) {
    cardRects.forEach((cardRect, index) => {
      const start = toSvg(cardRect.right, cardRect.top + cardRect.height / 2);
      const endOffset = (seededUnit(index * 19 + 3) - 0.5) * hubRect.height * 0.22;
      const end = toSvg(hubRect.left + hubRect.width * 0.08, hubCenterY + endOffset);

      paths.push({
        id: `flow-${index}`,
        kind: "flow",
        d: buildFlowPath(start.x, start.y, end.x, end.y, index + 1),
      });
    });
  }

  const verticalEndY = ctaRect
    ? toSvg(ctaRect.left + ctaRect.width / 2, ctaRect.top + ctaRect.height * 0.5).y
    : hubBottom.y + 200;

  paths.push({
    id: "vertical",
    kind: "vertical",
    d: `M ${hubBottom.x.toFixed(2)} ${hubBottom.y.toFixed(2)} L ${hubBottom.x.toFixed(2)} ${Math.max(hubBottom.y + 28, verticalEndY).toFixed(2)}`,
  });

  return { paths };
}

function hideDiagramPaths(svg: SVGSVGElement | null) {
  if (!svg) return;
  svg.querySelectorAll<SVGPathElement>("[data-hook-flow], [data-hook-vertical]").forEach((path) => {
    const length = path.getTotalLength();
    if (length > 0) {
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    }
    prepareStroke(path, true);
  });
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

  if (oldLen > 0 && typeof dashoffset === "number") {
    drawRatio = 1 - dashoffset / oldLen;
  }

  drawRatio = Math.min(1, Math.max(0, drawRatio));
  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: length * (1 - drawRatio),
  });
}

const CARD_ICONS: Record<string, ReactNode> = {
  forums: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M7 10h10M7 14h6" strokeLinecap="round" />
      <rect x="4" y="5" width="16" height="14" rx="4" />
    </svg>
  ),
  pdfs: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M8 4h8l4 4v12H8z" strokeLinejoin="round" />
      <path d="M16 4v4h4M10 13h4M10 17h6" strokeLinecap="round" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M6 4h12v16H6z" strokeLinejoin="round" />
      <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  ),
  books: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M5 6h7v14H5zM12 4h7v16h-7z" strokeLinejoin="round" />
    </svg>
  ),
  blogs: (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4a12 12 0 0 1 0 16" strokeLinecap="round" />
    </svg>
  ),
};

function HookSourceCard({
  title,
  description,
  id,
  cardRef,
}: {
  title: string;
  description: string;
  id: string;
  cardRef?: (node: HTMLElement | null) => void;
}) {
  return (
    <article
      ref={cardRef}
      data-hook-source-card
      className="glass-capsule flex items-center gap-3 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.06] text-primary/70">
        {CARD_ICONS[id]}
      </span>
      <div className="min-w-0">
        <h3 className="font-sans text-sm font-semibold leading-none text-primary">{title}</h3>
        <p className="mt-1 font-sans text-xs leading-snug text-primary/45">{description}</p>
      </div>
    </article>
  );
}

function HookSphereHub() {
  const { hook } = landingContent;

  return (
    <div data-hook-merge-hub className="relative flex w-full flex-col items-center">
      <div
        data-hook-convergence
        aria-hidden
        className="pointer-events-none absolute left-0 top-1/2 z-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(141,195,225,0.55)_0%,rgba(141,195,225,0)_70%)] blur-2xl"
      />

      <div
        data-hook-ball
        className="relative flex aspect-square w-full max-w-[13rem] items-center justify-center sm:max-w-[15rem] md:max-w-[17rem] lg:max-w-[19rem]"
      >
        <div
          aria-hidden
          className="absolute inset-[6%] rounded-full border border-[#DDE466]/20"
        />
        <div
          aria-hidden
          className="absolute inset-[2%] rounded-full border border-primary/10"
        />
        <Image
          src="/assets/ball/ball.png"
          alt=""
          width={480}
          height={480}
          className="relative z-10 h-full w-full object-contain"
          sizes="(max-width: 640px) 13rem, 19rem"
          priority
        />
      </div>

      <div className="mt-3 text-center sm:mt-4">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-primary sm:text-sm">
          {hook.hubLabel}
        </p>
        <p className="mt-0.5 font-sans text-[11px] font-medium text-primary/50 sm:text-xs">
          {hook.afterLabel}
        </p>
      </div>
    </div>
  );
}

function HookCheckpoint({ label }: { label: string }) {
  return (
    <div
      data-hook-checkpoint
      className="glass-capsule flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-3.5 sm:py-2"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg viewBox="0 0 16 16" aria-hidden className="h-2.5 w-2.5">
          <path
            d="M4 8.5 6.5 11 12 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/65 sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

function HookCta({ href, label }: { href: string; label: string }) {
  return (
    <div data-hook-cta className="pointer-events-auto shrink-0">
      <HeroButton href={href} variant="primary" className="whitespace-nowrap px-8 md:px-10">
        {label}
      </HeroButton>
    </div>
  );
}

function FlowDiagram({ onPathsReady }: { onPathsReady?: () => void }) {
  const { hook } = landingContent;
  const diagramRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [diagramPaths, setDiagramPaths] = useState<DiagramPath[]>([]);

  const syncDiagramPaths = useCallback(() => {
    const diagram = diagramRef.current;
    const svg = svgRef.current;
    const hub = hubRef.current;
    const cta = ctaRef.current;
    if (!diagram || !svg || !hub) return;

    const svgRect = svg.getBoundingClientRect();
    if (svgRect.width <= 0) return;

    const cardRects = cardRefs.current
      .filter((card): card is HTMLElement => Boolean(card))
      .map((card) => card.getBoundingClientRect());

    const hubRect = hub.getBoundingClientRect();
    const ctaRect = cta?.getBoundingClientRect() ?? null;
    const next = buildDiagramPaths(cardRects, hubRect, ctaRect, svgRect);

    setDiagramPaths((current) =>
      JSON.stringify(current) === JSON.stringify(next.paths) ? current : next.paths,
    );

    if (next.paths.length > 0) onPathsReady?.();
  }, [onPathsReady]);

  const setCardRef = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      cardRefs.current[index] = node;
      if (node) requestAnimationFrame(syncDiagramPaths);
    },
    [syncDiagramPaths],
  );

  useLayoutEffect(() => {
    hideDiagramPaths(svgRef.current);
    window.dispatchEvent(new Event(HOOK_PATH_SYNC));
  }, [diagramPaths]);

  useLayoutEffect(() => {
    syncDiagramPaths();
    const diagram = diagramRef.current;
    if (!diagram) return;

    const observer = new ResizeObserver(syncDiagramPaths);
    observer.observe(diagram);
    if (hubRef.current) observer.observe(hubRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);
    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    window.addEventListener("resize", syncDiagramPaths);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncDiagramPaths);
    };
  }, [syncDiagramPaths]);

  return (
    <div
      data-hook-diagram
      ref={diagramRef}
      className="relative h-full min-h-[20rem] w-full flex-1 lg:min-h-0"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_65%_45%,rgba(141,195,225,0.12),transparent_70%)]"
      />

      <svg
        ref={svgRef}
        aria-hidden
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="hook-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={LINE_SOFT} stopOpacity="0.35" />
            <stop offset="100%" stopColor={LINE} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {diagramPaths.map((path) =>
          path.kind === "vertical" ? (
            <path
              key={path.id}
              data-hook-vertical
              d={path.d}
              stroke={LINE}
              strokeWidth={VERTICAL_STROKE}
              strokeLinecap="round"
              opacity="0.5"
            />
          ) : (
            <path
              key={path.id}
              data-hook-flow
              d={path.d}
              stroke="url(#hook-flow-gradient)"
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          ),
        )}
      </svg>

      <div className="relative z-10 grid h-full w-full items-center gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)] xl:gap-20">
        <div className="flex flex-col gap-2 sm:gap-2.5">
          {hook.sourceCards.map((card, index) => (
            <HookSourceCard
              key={card.id}
              id={card.id}
              title={card.title}
              description={card.description}
              cardRef={setCardRef(index)}
            />
          ))}
        </div>

        <div className="flex flex-col items-center justify-center">
          <div ref={hubRef} className="w-full max-w-[13rem] sm:max-w-[15rem] md:max-w-[17rem] lg:max-w-[19rem]">
            <HookSphereHub />
          </div>

          <div
            data-hook-output-flow
            className="relative mt-1 flex flex-col items-center gap-2.5 sm:mt-2 sm:gap-3"
          >
            <div
              aria-hidden
              className="h-6 w-px bg-gradient-to-b from-primary/25 to-transparent"
            />
            {hook.checkpoints.map((checkpoint) => (
              <HookCheckpoint key={checkpoint.id} label={checkpoint.label} />
            ))}
            <div ref={ctaRef} className="pt-1">
              <HookCta href={hook.cta.href} label={hook.cta.label} />
            </div>
          </div>
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
      <span data-hook-headline-becomes className="text-accent" style={{ color: HOOK_ACCENT }}>
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
  copyProps?: { problemVisible?: boolean; solutionVisible?: boolean };
}) {
  return (
    <div className="flex h-full w-full flex-col justify-start pt-4 md:pt-5 lg:pt-6">
      <div className={cn("w-full shrink-0", heroLayout.gutterX)}>
        <HookCopy {...copyProps} />
      </div>
      <div className={cn("mt-3 flex min-h-0 w-full flex-1 flex-col md:mt-4", heroLayout.gutterX)}>
        {children}
      </div>
    </div>
  );
}

function HookStatic() {
  return (
    <section id="problem" className="bg-white">
      <div className="flex min-h-screen flex-col pb-10 md:pb-14">
        <HookShell copyProps={{ problemVisible: false, solutionVisible: true }}>
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
  const [diagramReady, setDiagramReady] = useState(false);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  const hookScrollDistance = () => window.innerHeight * 2.2;

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

      const flowPaths = gsap.utils.toArray<SVGPathElement>(
        pinWrap.querySelectorAll("[data-hook-flow]"),
      );
      const verticalPaths = gsap.utils.toArray<SVGPathElement>(
        pinWrap.querySelectorAll("[data-hook-vertical]"),
      );
      const sourceCards = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-source-card]"),
      );
      const mergeHub = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-merge-hub]"),
      );
      const convergence = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-convergence]"),
      );
      const checkpoints = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-checkpoint]"),
      );
      const ctas = gsap.utils.toArray<HTMLElement>(pinWrap.querySelectorAll("[data-hook-cta]"));
      const problem = pinWrap.querySelector("[data-hook-problem]");
      const solution = pinWrap.querySelector("[data-hook-solution]");

      [...flowPaths, ...verticalPaths].forEach((path) => prepareStroke(path, true));

      gsap.set(sourceCards, { autoAlpha: 0, y: 16 });
      gsap.set(convergence, { autoAlpha: 0, scale: 0.85 });
      gsap.set(mergeHub, { autoAlpha: 0, scale: 0.94 });
      gsap.set(checkpoints, { autoAlpha: 0, y: 10 });
      gsap.set(ctas, { autoAlpha: 0, y: 12 });
      gsap.set(solution, { autoAlpha: 0, y: 14 });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "hook-timeline",
          trigger: section,
          start: "top top",
          end: () => `+=${hookScrollDistance()}`,
          scrub: 0.75,
          invalidateOnRefresh: true,
        },
      });

      sourceCards.forEach((card, i) => {
        tl.to(card, { autoAlpha: 1, y: 0, duration: 0.35, ease: "none" }, 0.1 + i * 0.09);
      });

      flowPaths.forEach((path, i) => {
        tl.to(path, { strokeDashoffset: 0, duration: 0.7, ease: "none" }, 0.72 + i * 0.07);
      });

      tl.to(convergence, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "none" }, 1.35).to(
        mergeHub,
        { autoAlpha: 1, scale: 1, duration: 0.4, ease: "none" },
        1.5,
      );

      tl.to(verticalPaths, { strokeDashoffset: 0, duration: 0.75, ease: "none" }, 2.1);

      checkpoints.forEach((checkpoint, i) => {
        tl.to(checkpoint, { autoAlpha: 1, y: 0, duration: 0.28, ease: "none" }, 2.28 + i * 0.09);
      });

      tl.to(ctas, { autoAlpha: 1, y: 0, duration: 0.32, ease: "none" }, 2.6);

      tl.to(problem, { autoAlpha: 0, y: -12, duration: 0.45, ease: "none" }, 3.0).to(
        solution,
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "none" },
        3.12,
      );

      tl.to({}, { duration: 0.5 });

      const onPathSync = () => {
        [...flowPaths, ...verticalPaths].forEach(resyncPathStroke);
        ScrollTrigger.refresh();
      };

      window.addEventListener(HOOK_PATH_SYNC, onPathSync);
      requestAnimationFrame(() => {
        onPathSync();
        ScrollTrigger.refresh();
      });

      return () => window.removeEventListener(HOOK_PATH_SYNC, onPathSync);
    },
    { scope: sectionRef, dependencies: [reduceMotion, diagramReady] },
  );

  if (reduceMotion) return <HookStatic />;

  return (
    <section ref={sectionRef} id="problem" className="relative z-30 bg-white">
      <div ref={pinWrapRef} className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white">
        <HookShell copyProps={{ problemVisible: true, solutionVisible: false }}>
          <FlowDiagram onPathsReady={() => setDiagramReady(true)} />
        </HookShell>
      </div>
    </section>
  );
}
