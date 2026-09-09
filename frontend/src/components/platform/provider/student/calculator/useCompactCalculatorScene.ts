"use client";

import { useEffect, useState } from "react";

/** True below Tailwind `md` (768px) — scales calculator syringe/vial scenes for phones + small tablets. */
export function useCompactCalculatorScene(breakpointPx = 768): boolean {
  const [compact, setCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpointPx - 1}px)`).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);

  return compact;
}
