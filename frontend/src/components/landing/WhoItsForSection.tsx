"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { heroLayout } from "@/lib/hero-styles";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const WHO_IT_FOR_VIDEO = "/assets/whoitfor/background.mp4";
const WHO_IT_FOR_POSTER = "/assets/whoitfor/background.png";

type WhoItsForSlide = (typeof landingContent.whoItsFor.slides)[number];

const WIF_RAW_TEXT =
  "font-body text-[1.25rem] font-light leading-[1.45] tracking-[0.02em] text-balance text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.4)] sm:text-[1.625rem] sm:leading-[1.5] md:text-[2.125rem] lg:text-[2.35rem] lg:leading-[1.45]";
const WIF_BULLET_LABEL =
  "font-body text-[1.125rem] font-light tracking-[0.02em] text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-[1.375rem] md:text-[1.75rem] lg:text-[2rem]";

function StepCapsule({ step }: { step: number }) {
  return (
    <div
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/75 sm:h-10 sm:w-10 md:h-11 md:w-11"
    >
      <span className="font-sans text-sm font-normal text-white sm:text-base md:text-lg">
        {step}
      </span>
    </div>
  );
}

function ScrollProgressLine({
  progress,
  className,
}: {
  progress: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-px w-28 overflow-hidden bg-white/25 sm:w-40 md:w-56",
        className,
      )}
      aria-hidden
    >
      <div
        className="h-full bg-white/70 transition-[width] duration-300 ease-out"
        style={{ width: `${Math.max(8, progress * 100)}%` }}
      />
    </div>
  );
}

function RawTextSlide({ lines }: { lines: readonly string[] }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-1 text-center sm:px-2">
      {lines.map((line) => (
        <p key={line} className={WIF_RAW_TEXT}>
          {line}
        </p>
      ))}
    </div>
  );
}

function BulletSlide({ items }: { items: readonly string[] }) {
  return (
    <ul className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-1 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center sm:gap-x-10 sm:gap-y-10 sm:px-2 md:gap-x-14 lg:gap-x-16">
      {items.map((item) => (
        <li
          key={item}
          className="flex flex-col items-center gap-3 sm:gap-4 md:gap-5"
        >
          <span data-wif-bullet className={WIF_BULLET_LABEL}>
            {item}
          </span>
          <span
            data-wif-dot
            className="h-2 w-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.45)] sm:h-2.5 sm:w-2.5"
            aria-hidden
          />
        </li>
      ))}
    </ul>
  );
}

function WhoItsForSlideContent({ slide }: { slide: WhoItsForSlide }) {
  return (
    <div className="w-full">
      {slide.type === "text" ? (
        <RawTextSlide lines={slide.lines} />
      ) : (
        <BulletSlide items={slide.items} />
      )}
    </div>
  );
}

function WhoItsForBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion || videoFailed) return;

    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("playsinline", "");

    const playVideo = () => {
      const attempt = video.play();
      if (attempt !== undefined) {
        attempt.catch(() => {});
      }
    };

    const handleEnded = () => {
      video.currentTime = 0;
      playVideo();
    };

    const handleError = () => setVideoFailed(true);

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && video.paused) {
        playVideo();
      }
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("loadeddata", playVideo);
    video.addEventListener("canplay", playVideo);
    document.addEventListener("visibilitychange", handleVisibility);

    playVideo();

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadeddata", playVideo);
      video.removeEventListener("canplay", playVideo);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [reduceMotion, videoFailed]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {reduceMotion || videoFailed ? (
        <Image
          src={WHO_IT_FOR_POSTER}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          poster={WHO_IT_FOR_POSTER}
          className="absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src={WHO_IT_FOR_VIDEO} type="video/mp4" />
        </video>
      )}
    </div>
  );
}

function WhoItsForScrim() {
  return (
    <div
      className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,39,68,0.28)_0%,rgba(21,39,68,0.12)_45%,rgba(21,39,68,0.32)_100%)]"
      aria-hidden
    />
  );
}

function WhoItsForBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <WhoItsForBackgroundVideo />
      <WhoItsForScrim />
    </div>
  );
}

function WhoItsForStatic() {
  const { whoItsFor } = landingContent;

  return (
    <section id="who-its-for" className="relative isolate overflow-hidden">
      <WhoItsForBackground />

      <div
        className={cn(
          "relative mx-auto flex w-full max-w-4xl flex-col items-center gap-12 py-14 sm:gap-14 sm:py-16 md:gap-16 md:py-28",
          heroLayout.gutterX,
        )}
      >
        {whoItsFor.slides.map((slide, index) => (
          <div
            key={slide.id}
            className="flex w-full flex-col items-center gap-6 sm:gap-8 md:gap-10"
          >
            <StepCapsule step={index + 1} />
            <WhoItsForSlideContent slide={slide} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function WhoItsForSection() {
  const { whoItsFor } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);

  const slideCount = whoItsFor.slides.length;
  const progress =
    slideCount <= 1 ? 1 : activeIndex / Math.max(slideCount - 1, 1);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const pinWrap = pinWrapRef.current;
      if (!pinWrap) return;

      // Prevent duplicate pins if this effect re-runs (Strict Mode / refresh).
      ScrollTrigger.getById("who-its-for-timeline")?.kill();

      const slides = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-wif-slide]"),
      );

      if (slides.length === 0) return;

      const scrollDistance = () =>
        window.innerHeight * Math.max(slides.length, 1) * 0.9;

      // Own the visibility on the slide wrappers so React re-renders
      // (step capsule / progress) cannot fight the timeline.
      gsap.set(slides, { autoAlpha: 0, y: 28 });
      gsap.set(slides[0], { autoAlpha: 1, y: 0 });

      slides.forEach((slide) => {
        const bullets = gsap.utils.toArray<HTMLElement>(
          slide.querySelectorAll("[data-wif-bullet]"),
        );
        const dots = gsap.utils.toArray<HTMLElement>(
          slide.querySelectorAll("[data-wif-dot]"),
        );
        if (bullets.length > 0) gsap.set(bullets, { autoAlpha: 0, y: 16 });
        if (dots.length > 0) gsap.set(dots, { autoAlpha: 0, scale: 0.4 });
      });

      let lastIndex = 0;
      setActiveIndex(0);

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "who-its-for-timeline",
          trigger: pinWrap,
          start: "top top",
          end: () => `+=${scrollDistance()}`,
          pin: pinWrap,
          pinSpacing: true,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(
              slides.length - 1,
              Math.round(self.progress * (slides.length - 1)),
            );
            if (index === lastIndex) return;
            lastIndex = index;
            setActiveIndex(index);
          },
        },
      });

      slides.forEach((slide, index) => {
        const start = index;
        const bullets = gsap.utils.toArray<HTMLElement>(
          slide.querySelectorAll("[data-wif-bullet]"),
        );
        const dots = gsap.utils.toArray<HTMLElement>(
          slide.querySelectorAll("[data-wif-dot]"),
        );

        if (index === 0) {
          timeline.to(slide, { autoAlpha: 1, y: 0, duration: 0.35 }, 0);
        } else {
          timeline.fromTo(
            slide,
            { autoAlpha: 0, y: 28 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
            start,
          );
        }

        if (bullets.length > 0) {
          timeline.fromTo(
            bullets,
            { autoAlpha: 0, y: 16 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.35,
              stagger: 0.12,
              ease: "power2.out",
            },
            start + 0.12,
          );
          timeline.fromTo(
            dots,
            { autoAlpha: 0, scale: 0.4 },
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.3,
              stagger: 0.12,
              ease: "back.out(2)",
            },
            start + 0.2,
          );
        }

        if (index < slides.length - 1) {
          timeline.to(
            slide,
            { autoAlpha: 0, y: -20, duration: 0.4, ease: "power2.in" },
            start + 0.65,
          );
        }
      });

      timeline.to({}, { duration: 0.3 });

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        ScrollTrigger.getById("who-its-for-timeline")?.kill();
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion, slideCount] },
  );

  if (reduceMotion) {
    return <WhoItsForStatic />;
  }

  return (
    <section ref={sectionRef} id="who-its-for" className="relative isolate">
      <div
        ref={pinWrapRef}
        className="relative flex h-[100dvh] flex-col overflow-hidden"
      >
        <WhoItsForBackground />

        <div
          className={cn(
            "relative mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col items-center",
            heroLayout.gutterX,
          )}
        >
          <div className="flex shrink-0 justify-center pt-6 sm:pt-8 md:pt-12">
            <StepCapsule step={activeIndex + 1} />
          </div>

          <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden py-4 sm:py-8 md:py-12">
            <div className="relative w-full max-h-full">
              {whoItsFor.slides.map((slide) => (
                <div
                  key={slide.id}
                  data-wif-slide
                  className="absolute inset-0 flex items-center justify-center will-change-transform"
                >
                  <WhoItsForSlideContent slide={slide} />
                </div>
              ))}

              {/* Height sizer: grid stacks every slide so layout uses the tallest */}
              <div
                className="pointer-events-none invisible grid"
                aria-hidden
              >
                {whoItsFor.slides.map((slide) => (
                  <div key={slide.id} className="col-start-1 row-start-1">
                    <WhoItsForSlideContent slide={slide} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:gap-6 sm:pb-10 md:pb-12">
            <ScrollProgressLine progress={progress} />
          </div>
        </div>
      </div>
    </section>
  );
}
