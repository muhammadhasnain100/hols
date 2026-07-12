"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  start?: string;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 40,
  duration = 0.9,
  start = "top 85%",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const element = ref.current;
      if (!element || prefersReducedMotion()) return;

      gsap.fromTo(
        element,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: element,
            start,
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: ref, dependencies: [delay, y, duration, start] },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  stagger?: number;
};

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 32,
  duration = 1,
  stagger = 0.1,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const element = ref.current;
      if (!element || prefersReducedMotion()) return;

      const targets = element.children.length
        ? element.children
        : element;

      gsap.fromTo(
        targets,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          delay,
          stagger,
          ease: "power3.out",
        },
      );
    },
    { scope: ref, dependencies: [delay, y, duration, stagger] },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

type StaggerChildrenProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  start?: string;
};

export function StaggerChildren({
  children,
  className,
  stagger = 0.1,
  y = 36,
  start = "top 85%",
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const container = ref.current;
      if (!container || prefersReducedMotion()) return;

      const items = container.querySelectorAll("[data-stagger-item]");
      if (!items.length) return;

      gsap.fromTo(
        items,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start,
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: ref, dependencies: [stagger, y, start] },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

export function refreshScrollAnimations() {
  if (typeof window === "undefined") return;
  registerGsap();
  ScrollTrigger.refresh();
}
