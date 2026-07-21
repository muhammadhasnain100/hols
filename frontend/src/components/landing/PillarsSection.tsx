"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { landingContent } from "@/content/landing";
import { brand } from "@/config/brand";
import { heroLayout } from "@/lib/hero-styles";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PillarItem = (typeof landingContent.pillars.items)[number];

const AUTO_PLAY_HOLD_MS = 3000;
const SLIDE_DURATION_S = 0.85;
const VISIBLE_CARDS = 4;
const WORD_ROTATE_MS = 1800;
const PILLARS_WORD_COLOR = brand.colors.primary.duskBlue;

function PillarsHeadline({
  prefix,
  suffix,
  words,
  isActive,
  reduceMotion,
}: {
  prefix: string;
  suffix: string;
  words: readonly string[];
  isActive: boolean;
  reduceMotion: boolean;
}) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const animatedIndexRef = useRef<number | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [displayWord, setDisplayWord] = useState(words[0] ?? "");

  useEffect(() => {
    if (!isActive || reduceMotion || words.length <= 1) return;

    const id = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % words.length);
    }, WORD_ROTATE_MS);

    return () => window.clearInterval(id);
  }, [isActive, reduceMotion, words.length]);

  useGSAP(
    () => {
      registerGsap();
      const el = wordRef.current;
      if (!el) return;

      const nextWord = words[wordIndex] ?? words[0] ?? "";

      if (reduceMotion) {
        setDisplayWord(nextWord);
        gsap.set(el, { yPercent: 0, autoAlpha: 1, scale: 1, rotateX: 0 });
        return;
      }

      if (animatedIndexRef.current === wordIndex) return;

      const isFirstReveal = animatedIndexRef.current === null;
      animatedIndexRef.current = wordIndex;

      if (isFirstReveal) {
        setDisplayWord(nextWord);
        gsap.fromTo(
          el,
          { yPercent: 90, autoAlpha: 0, scale: 0.68, rotateX: 38 },
          {
            yPercent: 0,
            autoAlpha: 1,
            scale: 1,
            rotateX: 0,
            duration: 0.72,
            ease: "power4.out",
          },
        );
        return;
      }

      gsap
        .timeline()
        .to(el, {
          yPercent: -135,
          autoAlpha: 0,
          scale: 0.65,
          rotateX: -48,
          duration: 0.48,
          ease: "power3.in",
        })
        .call(() => {
          setDisplayWord(nextWord);
        })
        .set(el, { yPercent: 135, autoAlpha: 0, scale: 0.65, rotateX: 48 })
        .to(el, {
          yPercent: 0,
          autoAlpha: 1,
          scale: 1,
          rotateX: 0,
          duration: 0.72,
          ease: "power4.out",
        });
    },
    { dependencies: [wordIndex, reduceMotion, words] },
  );

  return (
    <h2 className="font-sans text-[1.875rem] font-bold leading-[1.05] tracking-[0.01em] text-primary sm:text-[2.25rem] md:text-[3.75rem]">
      {prefix}{" "}
      <span className="relative inline-block h-[1.08em] overflow-hidden align-bottom [perspective:900px]">
        <span
          ref={wordRef}
          className="inline-block origin-bottom whitespace-nowrap will-change-transform"
          style={{ color: PILLARS_WORD_COLOR }}
        >
          {displayWord}
        </span>
      </span>{" "}
      {suffix}
    </h2>
  );
}

function buildExtendedItems(items: readonly PillarItem[]) {
  return [...items, ...items, ...items];
}

function PillarImage({
  src,
  alt,
  blurred,
}: {
  src: string;
  alt: string;
  blurred: boolean;
}) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl">
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", blurred && "scale-105 blur-[2px]")}
        sizes="(max-width: 768px) 85vw, 25vw"
      />
      {blurred ? (
        <div
          className="pointer-events-none absolute inset-0 bg-white/35"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

function PillarCardFace({
  item,
  isActive,
}: {
  item: PillarItem;
  isActive: boolean;
}) {
  return (
    <div
      aria-hidden={!isActive}
      className={cn(
        "h-full w-full cursor-default rounded-2xl bg-white p-4 text-left select-none lg:p-5",
        isActive
          ? "shadow-[0_12px_32px_rgba(21,39,68,0.1)]"
          : "shadow-[0_4px_16px_rgba(21,39,68,0.05)]",
      )}
    >
      <PillarImage src={item.image} alt={item.title} blurred={!isActive} />
      <h3
        className={cn(
          "mt-4 font-sans text-lg font-bold leading-[1.15] tracking-[0.005em] md:text-[1.375rem]",
          isActive ? "text-primary" : "text-primary/45",
        )}
      >
        {isActive ? item.title : item.shortTitle}
      </h3>
    </div>
  );
}

function PillarDetailPanel({
  item,
  className,
}: {
  item: PillarItem;
  className?: string;
}) {
  return (
    <div className={cn("glass-panel rounded-2xl p-5 lg:p-6", className)}>
      <span className="glass-capsule-accent inline-flex items-center rounded-full px-4 py-1.5 text-brand-caption font-semibold uppercase tracking-[0.08em] text-primary">
        {item.overviewLabel}
      </span>
      <p className="text-brand-body mt-3 text-primary/75">{item.description}</p>
    </div>
  );
}

function PillarsCarousel({
  items,
  pauseAutoplay = false,
}: {
  items: readonly PillarItem[];
  pauseAutoplay?: boolean;
}) {
  const itemCount = items.length;
  const extendedItems = useMemo(() => buildExtendedItems(items), [items]);
  const centerIndex = Math.floor((itemCount - 1) / 2);
  const startIndex = itemCount + centerIndex;

  const [trackIndex, setTrackIndex] = useState(startIndex);
  const [slotWidth, setSlotWidth] = useState(0);
  const [visibleCards, setVisibleCards] = useState(VISIBLE_CARDS);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const trackIndexRef = useRef(startIndex);
  const autoplayTimerRef = useRef<number | null>(null);
  const slideTweenRef = useRef<gsap.core.Tween | null>(null);
  const isAnimatingRef = useRef(false);
  const pauseAutoplayRef = useRef(pauseAutoplay);

  useEffect(() => {
    pauseAutoplayRef.current = pauseAutoplay;
  }, [pauseAutoplay]);

  const activeItem = extendedItems[trackIndex] ?? items[centerIndex];

  const getVisibleCards = useCallback(
    () => (window.matchMedia("(min-width: 768px)").matches ? VISIBLE_CARDS : 1),
    [],
  );

  const getTranslateX = useCallback(
    (index: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return 0;

      const nextVisibleCards = getVisibleCards();
      const width = viewport.clientWidth;
      const cardSlot = width / nextVisibleCards;

      return width / 2 - cardSlot / 2 - index * cardSlot;
    },
    [getVisibleCards],
  );

  const snapTrackIfNeeded = useCallback(() => {
    const current = trackIndexRef.current;
    let snapped = current;

    if (current >= itemCount * 2) {
      snapped = current - itemCount;
    } else if (current < itemCount) {
      snapped = current + itemCount;
    }

    if (snapped === current) return;

    trackIndexRef.current = snapped;
    setTrackIndex(snapped);

    const track = trackRef.current;
    if (track) {
      gsap.set(track, { x: getTranslateX(snapped) });
    }
  }, [getTranslateX, itemCount]);

  const clearAutoplay = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      window.clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const scheduleAutoplay = useCallback(
    (delay = AUTO_PLAY_HOLD_MS) => {
      clearAutoplay();
      if (pauseAutoplayRef.current) return;

      autoplayTimerRef.current = window.setTimeout(() => {
        autoplayTimerRef.current = null;
        advanceRef.current();
      }, delay);
    },
    [clearAutoplay],
  );

  const advanceRef = useRef<() => void>(() => {});

  const applyTransform = useCallback(
    (index: number, animate: boolean) => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      registerGsap();

      const nextVisibleCards = getVisibleCards();
      const cardSlot = viewport.clientWidth / nextVisibleCards;
      const x = getTranslateX(index);

      setVisibleCards(nextVisibleCards);
      setSlotWidth(cardSlot);

      slideTweenRef.current?.kill();

      if (!animate) {
        gsap.set(track, { x });
        isAnimatingRef.current = false;
        return;
      }

      isAnimatingRef.current = true;
      slideTweenRef.current = gsap.to(track, {
        x,
        duration: SLIDE_DURATION_S,
        ease: "power2.inOut",
        overwrite: true,
        onComplete: () => {
          isAnimatingRef.current = false;
          snapTrackIfNeeded();
          scheduleAutoplay();
        },
      });
    },
    [getTranslateX, getVisibleCards, scheduleAutoplay, snapTrackIfNeeded],
  );

  const advance = useCallback(() => {
    if (isAnimatingRef.current || pauseAutoplayRef.current) return;

    const nextIndex = trackIndexRef.current + 1;
    trackIndexRef.current = nextIndex;
    setTrackIndex(nextIndex);
    applyTransform(nextIndex, true);
  }, [applyTransform]);

  advanceRef.current = advance;

  useEffect(() => {
    if (pauseAutoplay) {
      clearAutoplay();
      slideTweenRef.current?.kill();
      return;
    }

    if (!isAnimatingRef.current) {
      scheduleAutoplay();
    }
  }, [pauseAutoplay, clearAutoplay, scheduleAutoplay]);

  useEffect(() => {
    registerGsap();
    trackIndexRef.current = startIndex;
    setTrackIndex(startIndex);
    applyTransform(startIndex, false);
    scheduleAutoplay();

    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => {
      slideTweenRef.current?.kill();
      isAnimatingRef.current = false;
      applyTransform(trackIndexRef.current, false);
    });
    observer.observe(viewport);

    return () => {
      observer.disconnect();
      clearAutoplay();
      slideTweenRef.current?.kill();
    };
  }, [applyTransform, clearAutoplay, scheduleAutoplay, startIndex]);

  return (
    <div className="mt-6 md:mt-8">
      <div ref={viewportRef} className="w-full cursor-default select-none">
        <div className="overflow-hidden">
          <div ref={trackRef} className="flex will-change-transform">
            {extendedItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="shrink-0 px-2 lg:px-2.5"
                style={{ width: slotWidth || `${100 / visibleCards}%` }}
              >
                <PillarCardFace item={item} isActive={index === trackIndex} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <div
            className="px-2 lg:px-2.5"
            style={{ width: slotWidth || `${100 / visibleCards}%` }}
          >
            <PillarDetailPanel item={activeItem} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PillarsSection() {
  const { pillars } = landingContent;
  const sectionRef = useRef<HTMLElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sectionInView, setSectionInView] = useState(false);
  const rotatingWords = useMemo(
    () => pillars.items.map((item) => item.shortTitle),
    [pillars.items],
  );

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="everything-inside"
      className="flex min-h-svh w-full flex-col justify-center bg-[#E5E5E5] py-12 md:py-14 lg:py-16"
    >
      <div className={cn("flex w-full flex-col", heroLayout.gutterX)}>
        <div className="w-full max-w-3xl text-left lg:max-w-4xl">
          <PillarsHeadline
            prefix={pillars.headlinePrefix}
            suffix={pillars.headlineSuffix}
            words={rotatingWords}
            isActive={sectionInView}
            reduceMotion={reduceMotion}
          />
        </div>

        <PillarsCarousel items={pillars.items} pauseAutoplay={!sectionInView} />
      </div>
    </section>
  );
}
