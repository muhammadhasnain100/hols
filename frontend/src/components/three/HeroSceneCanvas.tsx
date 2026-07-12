"use client";

import dynamic from "next/dynamic";

export const HeroSceneCanvas = dynamic(
  () => import("./HeroScene").then((mod) => mod.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[linear-gradient(180deg,#8DC3E1_0%,#B8D9EE_50%,#D9EBF7_100%)] opacity-40" />
    ),
  },
);
