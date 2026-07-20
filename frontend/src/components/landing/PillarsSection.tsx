"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

type PillarItem = (typeof landingContent.pillars.items)[number];

const AUTO_PLAY_MS = 4500;
const VISIBLE_CARDS = 4;
const CLONE_COUNT = 2;

function buildExtendedItems(items: PillarItem[]) {
  return [
    ...items.slice(-CLONE_COUNT),
    ...items,
    ...items.slice(0, CLONE_COUNT),
  ];
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

function PillarCardContent({
  item,
  isActive,
  exploreLabel,
  exploreHref,
  onSelect,
}: {
  item: PillarItem;
  isActive: boolean;
  exploreLabel: string;
  exploreHref: string;
  onSelect: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        aria-pressed={isActive}
        onClick={onSelect}
        className={cn(
          "w-full rounded-2xl bg-white p-4 text-left outline-none lg:p-5",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isActive
            ? "shadow-[0_12px_32px_rgba(21,39,68,0.1)]"
            : "shadow-[0_4px_16px_rgba(21,39,68,0.05)]",
        )}
      >
        <PillarImage src={item.image} alt={item.title} blurred={!isActive} />
        <h3
          className={cn(
            "mt-4 font-sans text-base font-bold leading-snug lg:text-lg",
            isActive ? "text-primary" : "text-primary/45",
          )}
        >
          {isActive ? item.title : item.shortTitle}
        </h3>
      </button>

      {isActive ? (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(21,39,68,0.06)] lg:p-6">
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.06em] text-primary/45">
            {item.overviewLabel}
          </p>
          <p className="font-body mt-2 text-sm leading-relaxed text-primary/70 lg:text-base">
            {item.description}
          </p>
          <Link
            href={exploreHref}
            className="mt-3 inline-flex font-sans text-sm font-semibold text-primary lg:text-base"
          >
            {exploreLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function PillarsCarousel({
  items,
  exploreLabel,
  exploreHref,
}: {
  items: PillarItem[];
  exploreLabel: string;
  exploreHref: string;
}) {
  const extendedItems = useMemo(() => buildExtendedItems(items), [items]);
  const centerIndex = Math.floor((items.length - 1) / 2);
  const startIndex = CLONE_COUNT + centerIndex;

  const [trackIndex, setTrackIndex] = useState(startIndex);
  const [translateX, setTranslateX] = useState(0);
  const [slotWidth, setSlotWidth] = useState(0);
  const [visibleCards, setVisibleCards] = useState(VISIBLE_CARDS);
  const [enableTransition, setEnableTransition] = useState(true);

  const viewportRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const nextVisibleCards =
      window.matchMedia("(min-width: 768px)").matches ? VISIBLE_CARDS : 1;

    setVisibleCards(nextVisibleCards);

    const width = viewport.clientWidth;
    const cardSlot = width / nextVisibleCards;
    const x = width / 2 - cardSlot / 2 - trackIndex * cardSlot;

    setSlotWidth(cardSlot);
    setTranslateX(x);
  }, [trackIndex]);

  useEffect(() => {
    updatePosition();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(updatePosition);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [updatePosition]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setEnableTransition(true);
      setTrackIndex((current) => current + 1);
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
  }, []);

  const snapIfNeeded = useCallback(() => {
    setTrackIndex((current) => {
      if (current >= CLONE_COUNT + items.length) {
        setEnableTransition(false);
        return CLONE_COUNT + (current - CLONE_COUNT - items.length);
      }

      if (current < CLONE_COUNT) {
        setEnableTransition(false);
        return items.length + current;
      }

      return current;
    });
  }, [items.length]);

  useEffect(() => {
    if (!enableTransition) {
      updatePosition();
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setEnableTransition(true));
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [enableTransition, updatePosition]);

  return (
    <div ref={viewportRef} className="mt-6 w-full overflow-hidden md:mt-8">
      <div
        className="flex will-change-transform"
        onTransitionEnd={(event) => {
          if (event.propertyName !== "transform") return;
          snapIfNeeded();
        }}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: enableTransition ? "transform 700ms ease-in-out" : "none",
        }}
      >
        {extendedItems.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="shrink-0 px-2 lg:px-2.5"
            style={{ width: slotWidth || `${100 / visibleCards}%` }}
          >
            <PillarCardContent
              item={item}
              isActive={index === trackIndex}
              exploreLabel={exploreLabel}
              exploreHref={exploreHref}
              onSelect={() => {
                setEnableTransition(true);
                setTrackIndex(index);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PillarsSection() {
  const { pillars } = landingContent;

  return (
    <section
      id="everything-inside"
      className="flex min-h-svh w-full flex-col justify-center bg-[#E5E5E5] py-12 md:py-14 lg:py-16"
    >
      <div className="flex w-full flex-col px-2 md:px-3 lg:px-4">
        <div className="w-full max-w-4xl text-left">
          <h2 className="font-sans text-3xl font-bold tracking-[-0.02em] text-primary md:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
            {pillars.headline}
          </h2>
          {pillars.subhead ? (
            <p className="font-body mt-4 max-w-2xl text-base text-muted md:text-lg">
              {pillars.subhead}
            </p>
          ) : null}
        </div>

        <PillarsCarousel
          items={pillars.items}
          exploreLabel={pillars.exploreCta.label}
          exploreHref={pillars.exploreCta.href}
        />
      </div>
    </section>
  );
}
