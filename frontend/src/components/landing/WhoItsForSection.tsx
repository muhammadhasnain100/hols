"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const AUDIENCE_META = [
  {
    tag: "Owners",
    focus: ["Standards", "Lower risk", "Professional"],
    detail: "Clinic-wide",
  },
  {
    tag: "Providers",
    focus: ["Dosing", "Protocols", "Credential"],
    detail: "Day-to-day",
  },
  {
    tag: "Learners",
    focus: ["Evidence-based", "Clear"],
    detail: "On-demand",
  },
] as const;

type RoleFilter = "all" | "owners" | "providers" | "learners";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function AudienceCard({
  title,
  description,
  image,
  index,
  layout = "grid",
}: {
  title: string;
  description: string;
  image: string;
  index: number;
  layout?: "grid" | "list";
}) {
  const meta = AUDIENCE_META[index] ?? AUDIENCE_META[0];
  const isList = layout === "list";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-primary/8 bg-white shadow-[0_8px_20px_rgba(21,39,68,0.05)]",
        isList ? "flex flex-row items-stretch" : "flex h-full flex-col",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[#EEF3F6]",
          isList ? "w-36 shrink-0 self-stretch sm:w-44" : "aspect-[16/10]",
        )}
      >
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes={isList ? "176px" : "(max-width: 768px) 100vw, 33vw"}
        />
        <span className="font-sans absolute left-2.5 top-2.5 rounded-md bg-[#E6F3F4] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#0F6B73]">
          {meta.tag}
        </span>
      </div>

      <div className={cn("flex flex-1 flex-col", isList ? "p-3 sm:p-4" : "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-sans text-sm font-semibold leading-snug text-primary">{title}</h3>
          <span className="font-sans shrink-0 rounded-md bg-primary/[0.06] px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] text-primary/55">
            Role
          </span>
        </div>

        <p className="font-body mt-2 text-sm leading-snug text-muted">{description}</p>

        <div className={cn("mt-3 grid gap-2", isList ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
          <div className="rounded-lg border border-primary/8 bg-[#F7FAFB] px-2.5 py-2">
            <p className="font-sans text-[0.6rem] font-medium uppercase tracking-[0.12em] text-primary/45">
              Focus
            </p>
            <p className="font-sans mt-0.5 text-xs font-semibold leading-snug text-primary">
              {meta.focus[0]}
            </p>
          </div>
          <div className="rounded-lg border border-primary/8 bg-[#F7FAFB] px-2.5 py-2">
            <p className="font-sans text-[0.6rem] font-medium uppercase tracking-[0.12em] text-primary/45">
              Coverage
            </p>
            <p className="font-sans mt-0.5 text-xs font-semibold leading-snug text-primary">
              {meta.detail}
            </p>
          </div>
          {isList
            ? meta.focus.slice(1, 3).map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-primary/8 bg-[#F7FAFB] px-2.5 py-2"
                >
                  <p className="font-sans text-[0.6rem] font-medium uppercase tracking-[0.12em] text-primary/45">
                    Also
                  </p>
                  <p className="font-sans mt-0.5 text-xs font-semibold leading-snug text-primary">
                    {item}
                  </p>
                </div>
              ))
            : null}
        </div>

        {!isList ? (
          <div className="mt-3 flex flex-wrap gap-1 border-t border-primary/8 pt-2.5">
            {meta.focus.map((item) => (
              <span
                key={item}
                className="font-sans rounded-md border border-primary/10 bg-primary/[0.04] px-1.5 py-0.5 text-[0.65rem] font-medium text-primary/70"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PracticeOverviewDashboard() {
  const { whoItsFor } = landingContent;
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return whoItsFor.audiences.filter((audience) => {
      if (roleFilter !== "all" && audience.id !== roleFilter) return false;
      if (!q) return true;
      return (
        audience.title.toLowerCase().includes(q) ||
        audience.description.toLowerCase().includes(q)
      );
    });
  }, [whoItsFor.audiences, roleFilter, query]);

  const tabs: { id: RoleFilter; label: string }[] = [
    { id: "all", label: "All roles" },
    { id: "owners", label: "Owners" },
    { id: "providers", label: "Providers" },
    { id: "learners", label: "Learners" },
  ];

  return (
    <div className="mx-auto mt-12 max-w-6xl overflow-hidden rounded-[1.75rem] border border-primary/10 bg-[#F4F7F8] shadow-[0_30px_90px_rgba(0,0,0,0.22)] md:mt-16">
      {/* Window chrome — design only */}
      <div className="flex items-center gap-3 border-b border-primary/8 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-brand-caption text-primary/50">Practice overview</span>
      </div>

      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-sans text-2xl font-semibold text-primary md:text-[1.75rem]">
              Practice overview
            </h3>
            <p className="font-body text-brand-body mt-1 text-primary/50">
              {filtered.length} of {whoItsFor.audiences.length} roles · one shared standard
            </p>
          </div>

          <div className="inline-flex flex-wrap rounded-full bg-primary/[0.06] p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={cn(
                  "font-sans rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  roleFilter === tab.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-primary/50 hover:text-primary/75",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search roles</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles, outcomes, coverage..."
              className="font-sans w-full rounded-full border border-primary/10 bg-white py-3 pl-11 pr-4 text-sm text-primary outline-none transition placeholder:text-primary/35 focus:border-primary/25 focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <button
            type="button"
            onClick={() => setView((prev) => (prev === "grid" ? "list" : "grid"))}
            aria-pressed={view === "grid"}
            aria-label={view === "grid" ? "Switch to list view" : "Switch to grid view"}
            className="font-sans inline-flex items-center justify-center gap-2 rounded-full border border-primary/10 bg-white px-4 py-3 text-sm font-medium text-primary transition-colors hover:border-primary/20 hover:bg-primary/[0.03]"
          >
            {view === "grid" ? (
              <>
                <ListIcon className="h-4 w-4 text-primary/60" />
                List
              </>
            ) : (
              <>
                <GridIcon className="h-4 w-4 text-primary/60" />
                Grid
              </>
            )}
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="font-body text-brand-body mt-10 text-center text-primary/50">
            No roles match your search.
          </p>
        ) : (
          <div
            className={cn(
              "mt-5 gap-3",
              view === "grid" ? "grid md:grid-cols-3" : "flex flex-col",
            )}
          >
            {filtered.map((audience, index) => {
              const originalIndex = whoItsFor.audiences.findIndex((a) => a.id === audience.id);
              return (
                <AudienceCard
                  key={audience.id}
                  title={audience.title}
                  description={audience.description}
                  image={audience.image}
                  index={originalIndex >= 0 ? originalIndex : index}
                  layout={view}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function WhoItsForSection() {
  const { whoItsFor } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const headlineTextRef = useRef<HTMLHeadingElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const headlineText = headlineTextRef.current;
      const headline = headlineRef.current;
      const shell = shellRef.current;

      if (!headlineText || !headline || !shell) return;

      gsap.set(headlineText, { yPercent: 110, opacity: 0 });
      gsap.set(shell, { autoAlpha: 0, y: 40 });

      gsap.to(headlineText, {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headline,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      gsap.to(shell, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 66%",
          toggleActions: "play none none reverse",
        },
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="who-its-for"
      className="relative overflow-hidden bg-[#142644] py-20 md:py-28"
    >
      <Container>
        <div ref={headlineRef} className="mx-auto max-w-3xl overflow-hidden text-center">
          <h2 ref={headlineTextRef} className="font-sans text-brand-subheading text-white">
            {whoItsFor.headline}
          </h2>
        </div>
        <p className="font-body text-brand-body mx-auto mt-4 max-w-xl text-center text-white/60">
          One platform, every role in your clinic covered.
        </p>

        <div ref={shellRef}>
          <PracticeOverviewDashboard />
        </div>
      </Container>
    </section>
  );
}
