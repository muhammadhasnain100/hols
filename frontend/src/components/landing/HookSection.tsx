"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";

const LINE = "#152744";
const STROKE = 1.5;
const MERGE_STROKE = 2.15;

/**
 * Parallel lines → smooth funnel → single line.
 * Logo sits on the merge point so lines visually enter the ball.
 */
function buildConvergePaths(viewW: number, viewH: number) {
  const count = 9;
  const padY = 16;
  const gap = (viewH - padY * 2) / (count - 1);
  const mergeY = viewH / 2;

  // Keep parallel longer, then curve into the logo
  const curveStart = viewW * 0.48;
  const mergeX = viewW * 0.68;
  // Tip stops under the logo (logo ~72px ≈ 7% of wide svg)
  const tipX = mergeX - viewW * 0.028;
  const singleStart = mergeX + viewW * 0.028;
  const endX = viewW;

  const paths = Array.from({ length: count }, (_, i) => {
    const y = padY + i * gap;
    // Ease-in toward center — outer lines bend more
    const c1x = curveStart + (tipX - curveStart) * 0.35;
    const c2x = curveStart + (tipX - curveStart) * 0.72;
    const c1y = y;
    const c2y = y + (mergeY - y) * 0.72;
    return `M 0 ${y.toFixed(2)} L ${curveStart.toFixed(2)} ${y.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${tipX.toFixed(2)} ${mergeY.toFixed(2)}`;
  });

  const single = `M ${singleStart.toFixed(2)} ${mergeY.toFixed(2)} L ${endX.toFixed(2)} ${mergeY.toFixed(2)}`;
  return { paths, single, mergeX, mergeY };
}

const VIEW_W = 1200;
const VIEW_H = 240;
const { paths: CONVERGE_PATHS, single: SINGLE_PATH, mergeX } =
  buildConvergePaths(VIEW_W, VIEW_H);

function prepareStroke(path: SVGPathElement, hidden: boolean) {
  const length = path.getTotalLength();
  gsap.set(path, {
    strokeDasharray: length,
    strokeDashoffset: hidden ? length : 0,
  });
}

function ExploreCoursesLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      data-hook-cta
      className="group inline-flex items-center gap-3 font-sans text-sm font-medium text-primary transition-colors duration-300 hover:text-primary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent text-primary transition-transform duration-300 group-hover:translate-x-0.5">
        <span aria-hidden className="text-base leading-none">
          →
        </span>
      </span>
      {label}
    </Link>
  );
}

function FlowDiagram() {
  const { hook } = landingContent;
  const logoPct = (mergeX / VIEW_W) * 100;

  return (
    <div data-hook-diagram className="relative w-full">
      <div className="relative flex w-full items-center gap-4 md:gap-5 lg:gap-6">
        <div className="relative min-w-0 flex-1">
          <p
            data-hook-before-label
            className="font-sans text-sm font-semibold tracking-[-0.01em] text-primary md:text-base"
          >
            {hook.beforeLabel}
          </p>

          {/* SVG + logo share one box so merge point stays aligned */}
          <div className="relative mt-5 w-full md:mt-6">
            <p
              data-hook-after-label
              className="pointer-events-none absolute z-20 -translate-y-full whitespace-nowrap pb-2 font-sans text-sm font-medium italic tracking-[-0.01em] text-primary/75 md:text-[0.95rem]"
              style={{ left: `calc(${logoPct}% + 2.75rem)`, top: "50%" }}
            >
              {hook.afterLabel}
            </p>

            <svg
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
                d={SINGLE_PATH}
                stroke={LINE}
                strokeWidth={MERGE_STROKE}
                strokeLinecap="round"
              />
            </svg>

            {/* Logo centered exactly on the merge point */}
            <div
              data-hook-logo
              aria-hidden
              className="absolute top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-[4.25rem] lg:w-[4.25rem]"
              style={{ left: `${logoPct}%` }}
            >
              <Image
                src="/assets/logo/hols-logo-mark.png"
                alt=""
                width={68}
                height={68}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 shrink-0 self-center pt-6 md:pt-7">
          <ExploreCoursesLink href={hook.cta.href} label={hook.cta.label} />
        </div>
      </div>
    </div>
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
      <p
        data-hook-eyebrow
        className="inline-flex items-center gap-2 font-sans text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary/45 md:text-xs"
      >
        <span
          data-hook-badge-problem
          className="rounded-sm bg-primary/[0.06] px-2.5 py-1 text-primary/70"
        >
          {hook.problemBadge}
        </span>
        <span className="text-primary/25" aria-hidden>
          →
        </span>
        <span
          data-hook-badge-solution
          className="rounded-sm bg-primary/[0.06] px-2.5 py-1 text-primary/70"
        >
          {hook.solutionBadge}
        </span>
      </p>

      <h2
        data-hook-headline
        className="mt-5 font-sans text-[1.65rem] font-bold leading-[1.15] tracking-[-0.02em] text-primary sm:text-[2rem] md:text-[2.35rem] md:leading-[1.12] lg:text-[2.6rem]"
      >
        {hook.headline}
      </h2>

      <div className="relative mt-5 min-h-[4.75rem] max-w-2xl md:min-h-[5.25rem]">
        <p
          data-hook-problem
          className="font-body text-sm leading-[1.65] text-muted md:text-base md:leading-[1.7]"
          style={{ opacity: problemVisible ? 1 : 0 }}
        >
          {hook.problem}
        </p>
        <p
          data-hook-solution
          className="absolute inset-x-0 top-0 font-body text-sm leading-[1.65] text-primary/85 md:text-base md:leading-[1.7]"
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
    <div className="flex h-full w-full flex-col justify-center">
      {/* Left-aligned title block — same edge padding as hero */}
      <div className="w-full px-5 md:px-6 lg:px-8">
        <HookCopy {...copyProps} />
      </div>

      {/* Lines spread full width left → right across the screen */}
      <div className="mt-10 w-full pl-5 md:mt-12 md:pl-6 lg:mt-14 lg:pl-8">
        <div className="pr-5 md:pr-6 lg:pr-8">{children}</div>
      </div>
    </div>
  );
}

function HookStatic() {
  return (
    <section id="problem" className="bg-white">
      <div className="flex min-h-[70vh] flex-col justify-center py-16 md:py-20 lg:py-24">
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

      const pinWrap = pinWrapRef.current;
      if (!pinWrap) return;

      const scatterPaths = gsap.utils.toArray<SVGPathElement>(
        pinWrap.querySelectorAll("[data-hook-scatter]"),
      );
      const singlePaths = gsap.utils.toArray<SVGPathElement>(
        pinWrap.querySelectorAll("[data-hook-single]"),
      );
      const logos = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-hook-logo]"),
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

      const eyebrow = pinWrap.querySelector("[data-hook-eyebrow]");
      const headline = pinWrap.querySelector("[data-hook-headline]");
      const problem = pinWrap.querySelector("[data-hook-problem]");
      const solution = pinWrap.querySelector("[data-hook-solution]");
      const badgeProblem = pinWrap.querySelector("[data-hook-badge-problem]");
      const badgeSolution = pinWrap.querySelector("[data-hook-badge-solution]");

      scatterPaths.forEach((p) => prepareStroke(p, true));
      singlePaths.forEach((p) => prepareStroke(p, true));

      gsap.set(logos, { scale: 0.7, autoAlpha: 0 });
      gsap.set(ctas, { autoAlpha: 0, x: 16 });
      gsap.set(beforeLabels, { autoAlpha: 0, x: -12 });
      gsap.set(afterLabels, { autoAlpha: 0, y: 8 });
      gsap.set([eyebrow, headline], { autoAlpha: 0, y: 22 });
      gsap.set(problem, { autoAlpha: 0, y: 16 });
      gsap.set(solution, { autoAlpha: 0, y: 16 });
      gsap.set(badgeSolution, { opacity: 0.4 });

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

      // 1 — Left copy enters
      tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.55, ease: "none" }, 0)
        .to(headline, { autoAlpha: 1, y: 0, duration: 0.65, ease: "none" }, 0.1)
        .to(problem, { autoAlpha: 1, y: 0, duration: 0.6, ease: "none" }, 0.25)
        .to(
          beforeLabels,
          { autoAlpha: 1, x: 0, duration: 0.45, ease: "none" },
          0.4,
        );

      // 2 — Lines draw left → funnel into the logo
      scatterPaths.forEach((path, i) => {
        tl.to(
          path,
          { strokeDashoffset: 0, duration: 1.55, ease: "none" },
          0.5 + i * 0.045,
        );
      });

      // 3 — Logo appears as lines meet (near end of funnel)
      tl.to(logos, { scale: 1, autoAlpha: 1, duration: 0.55, ease: "none" }, 1.75);

      // 4 — Single line continues right out of the logo
      tl.to(
        afterLabels,
        { autoAlpha: 1, y: 0, duration: 0.4, ease: "none" },
        2.05,
      ).to(
        singlePaths,
        { strokeDashoffset: 0, duration: 0.85, ease: "none" },
        2.1,
      );

      // 5 — Explore courses on the right
      tl.to(ctas, { autoAlpha: 1, x: 0, duration: 0.5, ease: "none" }, 2.55);

      // 6 — Problem → solution
      tl.to(badgeProblem, { opacity: 0.4, duration: 0.4, ease: "none" }, 3.1)
        .to(badgeSolution, { opacity: 1, duration: 0.4, ease: "none" }, 3.1)
        .to(problem, { autoAlpha: 0, y: -14, duration: 0.5, ease: "none" }, 3.15)
        .to(solution, { autoAlpha: 1, y: 0, duration: 0.55, ease: "none" }, 3.3);

      tl.to({}, { duration: 0.6 });

      requestAnimationFrame(() => ScrollTrigger.refresh());
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
          copyProps={{ problemVisible: false, solutionVisible: false }}
        >
          <FlowDiagram />
        </HookShell>
      </div>
    </section>
  );
}
