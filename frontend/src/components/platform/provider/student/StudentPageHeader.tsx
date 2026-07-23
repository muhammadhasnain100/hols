"use client";

import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";

type StudentPageHeaderProps = {
  title: string;
};

export function StudentPageHeader({ title }: StudentPageHeaderProps) {
  return (
    <header className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-5 sm:gap-4">
      <h1 className="font-sans truncate text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
        {title}
      </h1>

      <WelcomeChip />
    </header>
  );
}
