"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

type SmoothScrollContextValue = {
  lenis: Lenis | null;
  paused: boolean;
  setPaused: (paused: boolean) => void;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  lenis: null,
  paused: false,
  setPaused: () => undefined,
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

type SmoothScrollProviderProps = {
  children: ReactNode;
};

function refreshScrollTriggers() {
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [paused, setPaused] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    registerGsap();

    if (prefersReducedMotion()) {
      window.scrollTo(0, 0);
      refreshScrollTriggers();
      return;
    }

    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
      autoRaf: false,
    });

    lenisRef.current = instance;
    setLenis(instance);

    instance.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);

    instance.on("scroll", ScrollTrigger.update);

    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length && typeof value === "number") {
          instance.scrollTo(value, { immediate: true });
        }
        return instance.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    const onRefresh = () => instance.resize();
    ScrollTrigger.addEventListener("refresh", onRefresh);

    const tickerCallback = (time: number) => {
      instance.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback, false, true);
    gsap.ticker.lagSmoothing(0);
    refreshScrollTriggers();
    const delayedRefresh = window.setTimeout(() => ScrollTrigger.refresh(), 280);

    return () => {
      window.clearTimeout(delayedRefresh);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      gsap.ticker.remove(tickerCallback);
      gsap.ticker.lagSmoothing(500, 33);
      instance.off("scroll", ScrollTrigger.update);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);

      // Drop orphaned triggers/proxies left after soft-navigating away from marketing.
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      ScrollTrigger.clearScrollMemory();
      document.documentElement.classList.remove("lenis", "lenis-smooth", "lenis-stopped", "lenis-scrolling");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("height");
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    };
  }, []);

  useEffect(() => {
    if (!lenisRef.current) return;
    if (paused) {
      lenisRef.current.stop();
    } else {
      lenisRef.current.start();
    }
  }, [paused]);

  useEffect(() => {
    const instance = lenisRef.current;
    if (instance) {
      instance.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    refreshScrollTriggers();
    const delayedRefresh = window.setTimeout(() => ScrollTrigger.refresh(), 280);
    return () => window.clearTimeout(delayedRefresh);
  }, [pathname, lenis]);

  return (
    <SmoothScrollContext.Provider value={{ lenis, paused, setPaused }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
