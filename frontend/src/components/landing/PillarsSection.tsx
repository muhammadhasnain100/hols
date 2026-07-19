"use client";

import Image from "next/image";
import { useState } from "react";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

type PillarItem = (typeof landingContent.pillars.items)[number];

function PillarCard({
  item,
  isActive,
  onActivate,
}: {
  item: PillarItem;
  isActive: boolean;
  onActivate: () => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={item.title}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
      className={cn(
        "group relative flex h-[28rem] min-w-0 cursor-pointer flex-col overflow-hidden rounded-[1.15rem] bg-white outline-none transition-[flex,box-shadow,opacity] duration-500 ease-out sm:h-[30rem] lg:h-[32rem]",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isActive
          ? "flex-[2.35] opacity-100 shadow-[0_16px_40px_rgba(21,39,68,0.12)]"
          : "flex-[0.92] opacity-80 shadow-[0_8px_24px_rgba(21,39,68,0.06)] hover:opacity-95",
      )}
    >
      {isActive ? (
        <div className="flex h-full flex-col p-3 sm:p-3.5">
          <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3 px-1 text-[0.7rem] font-medium text-primary/55 sm:text-xs">
            <span>{item.category}</span>
            <span>{item.units}</span>
          </div>

          {/* Image ~60–65% of card — portrait reference proportion */}
          <div className="relative min-h-0 w-full flex-[1.65] overflow-hidden rounded-xl">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 55vw, 38vw"
            />
          </div>

          <div className="mt-3.5 flex shrink-0 flex-col px-1 pb-1">
            <h3 className="font-sans text-[1.05rem] font-bold leading-tight text-primary sm:text-lg lg:text-xl">
              {item.title}
            </h3>
            <p className="mt-3 font-sans text-[0.65rem] font-medium tracking-[0.02em] text-primary/45">
              {item.overviewLabel}
            </p>
            <p className="font-body mt-1.5 line-clamp-3 text-[0.8rem] leading-relaxed text-primary/70 sm:text-sm">
              {item.description}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute inset-0">
            <Image
              src={item.image}
              alt=""
              fill
              className="object-cover opacity-60 grayscale-[40%] transition duration-500 group-hover:opacity-75 group-hover:grayscale-[20%]"
              sizes="(max-width: 1024px) 20vw, 12vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6]/35 to-transparent" />
          </div>
          <div className="relative mt-auto p-4 sm:p-5">
            <h3 className="font-sans text-sm font-semibold leading-snug text-primary/70 sm:text-[0.95rem]">
              {item.shortTitle}
            </h3>
          </div>
        </>
      )}
    </article>
  );
}

export function PillarsSection() {
  const { pillars } = landingContent;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      id="everything-inside"
      className="flex min-h-svh w-full flex-col justify-center bg-[#F3F4F6] py-12 md:py-14 lg:py-16"
    >
      <div className="flex w-full flex-col px-4 md:px-5 lg:px-6">
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

        {/* Full-width portrait card row — sized like the reference */}
        <div className="mt-8 hidden w-full items-end gap-3 md:mt-10 md:flex lg:gap-4">
          {pillars.items.map((item, index) => (
            <PillarCard
              key={item.id}
              item={item}
              isActive={index === activeIndex}
              onActivate={() => setActiveIndex(index)}
            />
          ))}
        </div>

        {/* Mobile */}
        <div className="mt-8 flex w-full flex-col gap-3 md:hidden">
          {pillars.items.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "w-full overflow-hidden rounded-[1.15rem] bg-white text-left shadow-[0_8px_24px_rgba(21,39,68,0.06)] transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-85",
                )}
              >
                {isActive ? (
                  <div className="p-3.5">
                    <div className="mb-2.5 flex items-center justify-between px-0.5 text-[0.7rem] font-medium text-primary/55">
                      <span>{item.category}</span>
                      <span>{item.units}</span>
                    </div>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                    </div>
                    <h3 className="mt-3.5 font-sans text-lg font-bold text-primary">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 font-sans text-[0.65rem] font-medium text-primary/45">
                      {item.overviewLabel}
                    </p>
                    <p className="font-body mt-1.5 text-sm leading-relaxed text-primary/70">
                      {item.description}
                    </p>
                  </div>
                ) : (
                  <div className="relative flex h-32 items-end overflow-hidden">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover opacity-55 grayscale-[35%]"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F3F4F6] via-[#F3F4F6]/40 to-transparent" />
                    <span className="relative z-10 p-4 font-sans text-sm font-semibold text-primary/75">
                      {item.shortTitle}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
