"use client";

import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cn("dashboard-skeleton-block", className)} aria-hidden />;
}

export function MembershipPageSkeleton() {
  return (
    <div className="grid w-full min-w-0 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading membership">
      <section className="dashboard-hero relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
        <SkeletonBlock className="h-3 w-36 rounded-full" />
        <SkeletonBlock className="mt-3 h-8 w-44 rounded-full sm:h-10 sm:w-56" />
        <SkeletonBlock className="mt-3 h-4 w-52 rounded-full" />
        <div className="mt-5 flex flex-wrap gap-2">
          <SkeletonBlock className="h-10 w-28 rounded-full" />
          <SkeletonBlock className="h-10 w-28 rounded-full" />
        </div>
      </section>

      <div className="min-w-0">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className="mt-2 h-5 w-40 rounded-full" />
        <div className="mt-4 grid w-full gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <section
              key={index}
              className="dashboard-surface flex min-h-[18rem] flex-col rounded-2xl p-4 sm:p-5"
            >
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="mt-4 h-12 w-12 rounded-2xl" />
              <SkeletonBlock className="mt-4 h-6 w-28 rounded-full" />
              <SkeletonBlock className="mt-2 h-8 w-24 rounded-full" />
              <div className="mt-5 space-y-2.5">
                <SkeletonBlock className="h-3 w-full rounded-full" />
                <SkeletonBlock className="h-3 w-[90%] rounded-full" />
                <SkeletonBlock className="h-3 w-[80%] rounded-full" />
                <SkeletonBlock className="h-3 w-[70%] rounded-full" />
              </div>
              <SkeletonBlock className="mt-auto h-10 w-full rounded-full" />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrderListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 sm:px-3.5 sm:py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 space-y-2">
              <SkeletonBlock className="h-3.5 w-28 rounded-full" />
              <SkeletonBlock className="h-3 w-20 rounded-full" />
            </div>
          </div>
          <SkeletonBlock className="h-4 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function OrdersPageSkeleton() {
  return (
    <div className="grid w-full min-w-0 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading orders">
      <section className="dashboard-hero relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
        <SkeletonBlock className="h-3 w-28 rounded-full" />
        <SkeletonBlock className="mt-3 h-8 w-20 rounded-full sm:h-10" />
        <SkeletonBlock className="mt-3 h-4 w-48 rounded-full" />
        <div className="mt-5 flex flex-wrap gap-2">
          <SkeletonBlock className="h-10 w-24 rounded-full" />
          <SkeletonBlock className="h-10 w-28 rounded-full" />
        </div>
      </section>

      <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="dashboard-surface order-2 min-w-0 rounded-2xl p-4 sm:p-5 lg:order-1">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-5 w-32 rounded-full" />
            <SkeletonBlock className="h-4 w-14 rounded-full" />
          </div>
          <div className="mt-4">
            <OrderListRowsSkeleton />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SkeletonBlock className="h-9 w-full rounded-full" />
            <SkeletonBlock className="h-9 w-full rounded-full" />
          </div>
        </section>

        <section className="dashboard-surface order-1 min-w-0 rounded-2xl p-4 sm:p-5 lg:order-2">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="mt-3 h-8 w-16 rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-40 rounded-full" />
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
                <SkeletonBlock className="h-3 w-16 rounded-full" />
                <SkeletonBlock className="mt-2 h-4 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function PaymentCardPageSkeleton() {
  return (
    <div className="grid w-full min-w-0 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading payment card">
      <section className="dashboard-hero relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className="mt-3 h-8 w-40 rounded-full sm:h-10 sm:w-48" />
        <SkeletonBlock className="mt-3 h-4 w-56 rounded-full" />
        <div className="mt-5 flex flex-wrap gap-2">
          <SkeletonBlock className="h-10 w-24 rounded-full" />
          <SkeletonBlock className="h-10 w-28 rounded-full" />
        </div>
      </section>

      <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <section className="dashboard-surface order-2 min-h-[12rem] rounded-2xl p-4 sm:p-5 md:p-6 lg:order-1">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-8 h-7 w-48 rounded-full" />
          <div className="mt-6 flex justify-between gap-3">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-16 rounded-full" />
              <SkeletonBlock className="h-4 w-28 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-14 rounded-full" />
              <SkeletonBlock className="h-4 w-16 rounded-full" />
            </div>
          </div>
        </section>

        <section className="dashboard-surface order-1 min-w-0 rounded-2xl p-4 sm:p-5 md:p-6 lg:order-2">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-2 h-5 w-44 rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-56 rounded-full" />
          <div className="mt-5 space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-28 rounded-full" />
              <SkeletonBlock className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <SkeletonBlock className="h-11 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-32 rounded-full" />
              <SkeletonBlock className="h-11 w-full rounded-xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-12 rounded-full" />
                <SkeletonBlock className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-20 rounded-full" />
                <SkeletonBlock className="h-11 w-full rounded-xl" />
              </div>
            </div>
            <SkeletonBlock className="h-11 w-36 rounded-full" />
          </div>
        </section>
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div
      className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <SkeletonBlock className="h-14 w-14 shrink-0 rounded-2xl sm:h-20 sm:w-20" />
            <div className="flex w-full min-w-0 flex-col items-center gap-2 sm:items-start">
              <SkeletonBlock className="h-3 w-24 rounded-full" />
              <SkeletonBlock className="h-7 w-40 rounded-full sm:h-9 sm:w-52" />
              <SkeletonBlock className="h-4 w-48 rounded-full" />
            </div>
          </div>
          <SkeletonBlock className="mt-4 h-11 w-full rounded-full sm:ml-auto sm:w-32" />
        </section>

        <section className="dashboard-surface rounded-2xl p-3.5 sm:p-5 md:p-6">
          <SkeletonBlock className="h-3 w-16 rounded-full" />
          <SkeletonBlock className="mt-2 h-5 w-36 rounded-full" />
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 sm:px-3.5 sm:py-3"
              >
                <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-3 w-24 rounded-full" />
                  <SkeletonBlock className="h-3.5 w-40 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-surface rounded-2xl p-3.5 sm:p-5 md:p-6">
        <SkeletonBlock className="h-3 w-20 rounded-full" />
        <SkeletonBlock className="mt-2 h-5 w-36 rounded-full" />
        <div className="mt-3 space-y-1">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 sm:px-3 sm:py-3"
            >
              <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-16 rounded-full" />
                <SkeletonBlock className="h-3.5 w-28 rounded-full" />
              </div>
              <SkeletonBlock className="h-4 w-4 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdviserHubPageSkeleton() {
  return (
    <div className="grid w-full min-w-0 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading adviser">
      <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
        <SkeletonBlock className="h-3 w-28 rounded-full" />
        <SkeletonBlock className="mt-2 h-8 w-48 rounded-full sm:h-10 sm:w-56" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-md rounded-full" />
        <div className="mt-4 flex flex-wrap gap-2">
          <SkeletonBlock className="h-10 w-28 rounded-full" />
          <SkeletonBlock className="h-10 w-24 rounded-full" />
        </div>
      </section>

      <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(14rem,0.8fr)]">
        <aside className="dashboard-surface min-w-0 rounded-2xl p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-5 w-24 rounded-full" />
            <SkeletonBlock className="h-9 w-16 rounded-full" />
          </div>
          <div className="mt-3 space-y-1">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="rounded-xl px-2.5 py-2.5 sm:px-3 sm:py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-3.5 w-32 rounded-full" />
                    <SkeletonBlock className="h-3 w-40 rounded-full" />
                  </div>
                  <SkeletonBlock className="h-5 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <aside className="dashboard-surface min-w-0 rounded-2xl p-3.5 sm:p-5">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <SkeletonBlock className="h-3 w-20 rounded-full" />
                <SkeletonBlock className="h-3 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-1 py-4 sm:gap-7 sm:px-2 sm:py-6"
      aria-busy="true"
      aria-label="Loading conversation"
    >
      {[
        { align: "start", width: "w-[78%]" },
        { align: "end", width: "w-[62%]" },
        { align: "start", width: "w-[85%]" },
        { align: "end", width: "w-[48%]" },
        { align: "start", width: "w-[70%]" },
      ].map((item, index) => (
        <div
          key={index}
          className={cn("flex", item.align === "end" ? "justify-end" : "justify-start")}
        >
          <div className={cn("space-y-2", item.width)}>
            <SkeletonBlock className="h-3 w-full rounded-full" />
            <SkeletonBlock className="h-3 w-[92%] rounded-full" />
            <SkeletonBlock className="h-3 w-[70%] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalculatorPageSkeleton() {
  return (
    <div className="grid w-full min-w-0 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading calculator">
      <section className="dashboard-hero relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
        <SkeletonBlock className="h-3 w-28 rounded-full" />
        <SkeletonBlock className="mt-3 h-8 w-52 rounded-full sm:h-10 sm:w-64" />
        <SkeletonBlock className="mt-3 h-4 w-56 rounded-full" />
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </section>

      <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="dashboard-surface min-h-[18rem] rounded-2xl p-4 sm:p-5 md:p-6">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-2 h-5 w-40 rounded-full" />
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBlock key={index} className="h-20 w-full rounded-2xl sm:h-24" />
            ))}
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <SkeletonBlock className="h-10 w-24 rounded-full" />
            <SkeletonBlock className="h-10 w-24 rounded-full" />
          </div>
        </section>

        <section className="dashboard-surface flex min-h-[18rem] flex-col items-center justify-center rounded-2xl p-4 sm:p-5 md:p-6">
          <SkeletonBlock className="h-40 w-28 rounded-[1.5rem] sm:h-48 sm:w-32" />
          <SkeletonBlock className="mt-4 h-3 w-32 rounded-full" />
          <SkeletonBlock className="mt-2 h-3 w-24 rounded-full" />
        </section>
      </div>
    </div>
  );
}

export function CoursePageSkeleton() {
  return (
    <div
      className="grid w-full items-start gap-4 lg:grid-cols-[1.9fr_1fr]"
      aria-busy="true"
      aria-label="Loading course"
    >
      <section className="dashboard-surface rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-5 w-40 rounded-full" />
          <SkeletonBlock className="h-4 w-16 rounded-full" />
        </div>
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="rounded-xl px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3.5 w-36 rounded-full" />
                    <SkeletonBlock className="h-3 w-24 rounded-full" />
                  </div>
                </div>
                <SkeletonBlock className="h-4 w-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <section className="dashboard-surface rounded-2xl p-5">
          <div className="space-y-1">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-xl px-3 py-3">
                <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
                <SkeletonBlock className="h-3.5 w-28 rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <SkeletonBlock className="h-10 w-full rounded-full" />
            <SkeletonBlock className="h-10 w-full rounded-full" />
          </div>
        </section>
        <section className="dashboard-surface rounded-2xl p-5">
          <SkeletonBlock className="h-5 w-28 rounded-full" />
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl px-3.5 py-3">
                <SkeletonBlock className="h-3.5 w-20 rounded-full" />
                <SkeletonBlock className="h-3.5 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function LessonsWorkspaceSkeleton() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:items-start"
      aria-busy="true"
      aria-label="Loading lessons"
    >
      <aside className="dashboard-surface rounded-2xl p-5">
        <div className="flex items-center justify-between gap-2">
          <SkeletonBlock className="h-5 w-28 rounded-full" />
          <SkeletonBlock className="h-4 w-8 rounded-full" />
        </div>
        <SkeletonBlock className="mt-2 h-3 w-20 rounded-full" />
        <SkeletonBlock className="mt-4 h-9 w-full rounded-full" />
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl px-3.5 py-3">
              <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3.5 w-[80%] rounded-full" />
                <SkeletonBlock className="h-3 w-[50%] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      <LessonContentSkeleton />
    </div>
  );
}

export function LessonContentSkeleton({ includeHeader = true }: { includeHeader?: boolean }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Loading lesson content">
      {includeHeader ? (
        <section className="dashboard-surface rounded-2xl p-5 md:p-6">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="mt-3 h-7 w-[70%] rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-40 rounded-full" />
        </section>
      ) : null}
      {Array.from({ length: 3 }, (_, index) => (
        <section key={index} className="dashboard-surface rounded-2xl p-4 md:p-5">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <div className="mt-3 space-y-2">
            <SkeletonBlock className="h-3.5 w-full rounded-full" />
            <SkeletonBlock className="h-3.5 w-[95%] rounded-full" />
            <SkeletonBlock className="h-3.5 w-[88%] rounded-full" />
            <SkeletonBlock className="h-3.5 w-[70%] rounded-full" />
          </div>
        </section>
      ))}
    </div>
  );
}

export function LessonLearningSkeleton() {
  return (
    <div className="mt-8 space-y-4" aria-busy="true" aria-label="Loading lesson">
      <SkeletonBlock className="h-3 w-28 rounded-full" />
      <SkeletonBlock className="h-3.5 w-full rounded-full" />
      <SkeletonBlock className="h-3.5 w-[96%] rounded-full" />
      <SkeletonBlock className="h-3.5 w-[90%] rounded-full" />
      <SkeletonBlock className="mt-4 h-3 w-24 rounded-full" />
      <SkeletonBlock className="h-3.5 w-full rounded-full" />
      <SkeletonBlock className="h-3.5 w-[92%] rounded-full" />
      <SkeletonBlock className="h-3.5 w-[80%] rounded-full" />
    </div>
  );
}

export function TestResultsPageSkeleton() {
  return (
    <div
      className="grid w-full items-start gap-4 lg:grid-cols-[1.9fr_1fr]"
      aria-busy="true"
      aria-label="Loading test results"
    >
      <div className="flex flex-col gap-4">
        <section className="dashboard-surface rounded-2xl p-5 md:p-6">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-3 h-9 w-24 rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-48 rounded-full" />
          <div className="mt-5 flex flex-wrap gap-2.5">
            <SkeletonBlock className="h-10 w-36 rounded-full" />
            <SkeletonBlock className="h-10 w-32 rounded-full" />
          </div>
        </section>
        <section className="dashboard-surface rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <SkeletonBlock className="h-5 w-40 rounded-full" />
            <SkeletonBlock className="h-4 w-16 rounded-full" />
          </div>
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3.5 w-36 rounded-full" />
                    <SkeletonBlock className="h-3 w-28 rounded-full" />
                  </div>
                </div>
                <SkeletonBlock className="h-6 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-surface rounded-2xl p-5 md:p-6">
        <SkeletonBlock className="h-5 w-28 rounded-full" />
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center justify-between rounded-xl px-3.5 py-3">
              <SkeletonBlock className="h-3.5 w-24 rounded-full" />
              <SkeletonBlock className="h-3.5 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function TestResultRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="mt-4 space-y-2.5" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
            <div className="space-y-2">
              <SkeletonBlock className="h-3.5 w-36 rounded-full" />
              <SkeletonBlock className="h-3 w-28 rounded-full" />
            </div>
          </div>
          <SkeletonBlock className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}
